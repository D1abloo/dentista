import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Download,
  Eye,
  FileText,
  Lock,
  Plus,
  Trash2,
  Upload
} from 'lucide-react';
import { isClientDemoMode } from '@/lib/appMode';
import {
  applyReportTemplate,
  appointmentBelongsToPatient,
  buildReportTitle,
  enrichReportListRow,
  getAppointmentReportContext,
  inferReportTemplateFromTreatment,
  REPORT_TEMPLATES,
  type ReportTemplateId
} from '@/lib/clinical/reportTemplates';
import {
  EMPTY_REPORT_FORM,
  formToPersistedFields,
  parseReportApiError,
  validateClinicalReportForm,
  type ClinicalReportFormState,
  type ClinicalReportSections
} from '@/lib/clinical/reportForm';
import { ReportSectionBox, ReportSectionGroup } from './ReportSectionBox';
import {
  addMessage,
  createClinicalReport,
  saveClinicalReport
} from '@/lib/demoStore';
import { isPdfMime, saveDemoFile } from '@/lib/demoFiles';
import {
  buildClinicalReportPrintHtmlFromState,
  ensureClinicalReportPdf,
  openClinicalReportPrintView,
  printClinicalReportFromState
} from '@/lib/pdfClinicalReport';
import { fmtDateTime } from '@/lib/format';
import { mapClinicalReportRow, type ClinicalReportRow } from '@/lib/records/clinicalReportMapper';
import { recordMatchesPatientQuery } from '@/lib/patientSearch';
import { patientDisplayCode } from '@/lib/nhc';
import { useDemoStore } from '@/hooks/useDemoStore';
import { useNotice } from '@/hooks/useNotice';
import type { ClinicalReport } from '@/types/demo';
import { FileActions } from '@/components/shared/FileActions';
import { patientName } from '@/lib/selectors';
import { PatientLookup } from './PatientLookup';
import { Field, Input, SearchInput, Select } from '@/components/ui';

function appointmentLabel(state: ReturnType<typeof useDemoStore>['state'], appointmentId: string) {
  const appt = state.appointments.find((a) => a.id === appointmentId);
  if (!appt) return '';
  const t = state.treatments.find((x) => x.id === appt.treatmentId);
  return `${fmtDateTime(appt.date, appt.time)} · ${t?.name ?? 'Consulta'}`;
}

export function AdminClinicalReports() {
  const { state, commit, refresh } = useDemoStore();
  const { setNotice } = useNotice();
  const [tab, setTab] = useState<'compose' | 'list'>('compose');
  const [listQ, setListQ] = useState('');
  const [patientQ, setPatientQ] = useState('');
  const [templateId, setTemplateId] = useState<ReportTemplateId>('revision_general');
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ClinicalReportFormState>(() => ({
    ...EMPTY_REPORT_FORM,
    patientId: state.patients[0]?.id ?? ''
  }));

  const apptContext = useMemo(
    () => (form.appointmentId ? getAppointmentReportContext(state, form.appointmentId) : null),
    [state, form.appointmentId]
  );

  const list = useMemo(() => {
    let rows = [...state.clinicalReports];
    if (patientQ.trim()) rows = rows.filter((x) => recordMatchesPatientQuery(state, x.patientId, patientQ));
    if (listQ.trim()) {
      const s = listQ.toLowerCase();
      rows = rows.filter(
        (x) =>
          x.id.toLowerCase().includes(s) ||
          x.title.toLowerCase().includes(s) ||
          patientName(state, x.patientId).toLowerCase().includes(s)
      );
    }
    return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [state, listQ, patientQ]);

  const applyTemplate = useCallback(
    (id: ReportTemplateId, ctx = apptContext) => {
      if (!ctx) {
        setNotice({ type: 'error', message: 'Selecciona una cita válida para aplicar la plantilla.' });
        return;
      }
      const filled = applyReportTemplate(id, ctx);
      setForm((f) => ({
        ...f,
        title: filled.title,
        sections: filled.sections,
        dentistName: ctx.dentistName
      }));
      setTemplateId(id);
    },
    [apptContext, setNotice]
  );

  useEffect(() => {
    if (!form.appointmentId || !apptContext) return;
    if (form.patientId && apptContext.patientId !== form.patientId) {
      setForm((f) => ({ ...f, appointmentId: '', dentistName: '' }));
      return;
    }
    setForm((f) => ({
      ...f,
      patientId: apptContext.patientId,
      dentistName: apptContext.dentistName,
      title: f.title.trim() ? f.title : buildReportTitle(apptContext)
    }));
  }, [form.appointmentId, apptContext, form.patientId]);

  function onSelectAppointment(appointmentId: string) {
    if (!appointmentId) {
      setForm((f) => ({ ...f, appointmentId: '', dentistName: '' }));
      return;
    }
    if (form.patientId && !appointmentBelongsToPatient(state, appointmentId, form.patientId)) {
      setNotice({ type: 'error', message: 'Selecciona una cita válida.' });
      return;
    }
    const ctx = getAppointmentReportContext(state, appointmentId);
    if (!ctx) return;
    const suggested = inferReportTemplateFromTreatment(ctx.treatmentName);
    setTemplateId(suggested);
    setForm((f) => ({
      ...f,
      appointmentId,
      patientId: ctx.patientId,
      dentistName: `${ctx.dentistHonorific} ${ctx.dentistName}`,
      uploadedBy: `${ctx.dentistHonorific} ${ctx.dentistName}`
    }));
    applyTemplate(suggested, ctx);
  }

  async function saveReport() {
    const err = validateClinicalReportForm(form, apptContext);
    if (err) {
      setNotice({ type: 'error', message: err });
      return;
    }
    if (form.appointmentId && !appointmentBelongsToPatient(state, form.appointmentId, form.patientId)) {
      setNotice({ type: 'error', message: 'Selecciona una cita válida.' });
      return;
    }

    let fileRef: string | undefined;
    let fileName: string | undefined;
    let mimeType: string | undefined;
    if (reportFile) {
      if (!isPdfMime(reportFile.type, reportFile.name)) {
        setNotice({ type: 'error', message: 'Solo se permiten archivos PDF.' });
        return;
      }
      try {
        fileRef = await saveDemoFile(reportFile);
        fileName = reportFile.name;
        mimeType = reportFile.type;
      } catch (e) {
        setNotice({ type: 'error', message: e instanceof Error ? e.message : 'No se pudo subir el PDF.' });
        return;
      }
    }

    const patient = state.patients.find((p) => p.id === form.patientId);
    const appt = form.appointmentId ? state.appointments.find((a) => a.id === form.appointmentId) : undefined;
    const clinicId =
      appt?.clinicId ?? patient?.preferredClinicId ?? state.clinics.find((c) => c.active)?.id;
    if (!clinicId) {
      setNotice({ type: 'error', message: 'No se encontró clínica para vincular el informe.' });
      return;
    }

    const professionalLine = apptContext
      ? `Profesional responsable: ${apptContext.dentistHonorific} ${apptContext.dentistName} · Colegiado n.º ${apptContext.dentistCollegiateNumber}`
      : undefined;
    const persisted = formToPersistedFields(form, professionalLine);

    const reportInput = {
      clinicId,
      patientId: form.patientId,
      appointmentId: form.appointmentId || undefined,
      title: form.title.trim(),
      description: persisted.description,
      diagnosis: persisted.diagnosis,
      recommendations: persisted.recommendations,
      fileName,
      fileRef,
      mimeType,
      uploadedBy: form.uploadedBy,
      visibleToPatient: form.visibleToPatient
    };

    setSaving(true);
    try {
      if (!isClientDemoMode()) {
        const res = await fetch('/api/records/report', {
          method: 'POST',
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(reportInput)
        });
        const json = (await res.json()) as {
          data?: Record<string, unknown>;
          error?: { message?: string; details?: { fieldErrors?: Record<string, string[]> } };
        };
        if (!res.ok) {
          setNotice({ type: 'error', message: parseReportApiError(json) });
          return;
        }
        if (json.data && typeof json.data.id === 'string') {
          let mapped = mapClinicalReportRow(json.data as ClinicalReportRow);
          if (!fileRef) {
            const ensured = await ensureClinicalReportPdf(state, mapped);
            mapped = ensured.report;
            fileRef = ensured.fileRef;
            fileName = ensured.fileName;
            mimeType = 'application/pdf';
          }
          let next = saveClinicalReport(state, mapped);
          if (form.visibleToPatient) {
            next = addMessage(next, {
              patientId: form.patientId,
              subject: `Nuevo informe disponible: ${form.title}`,
              body: persisted.description,
              channel: 'app',
              type: 'clinica',
              read: false,
              sentAt: new Date().toISOString()
            });
          }
          commit(next);
          await refresh();
          setNotice({
            type: 'ok',
            message: form.visibleToPatient ? 'Informe guardado correctamente.' : 'Informe guardado (solo clínica).'
          });
          resetForm();
          setTab('list');
          return;
        }
      }

      const { clinicId: _c, ...reportData } = reportInput;
      let next = createClinicalReport(state, reportData);
      const created = next.clinicalReports[next.clinicalReports.length - 1];
      if (!fileRef && created) {
        const ensured = await ensureClinicalReportPdf(next, created);
        next = saveClinicalReport(next, ensured.report);
      }
      if (form.visibleToPatient) {
        next = addMessage(next, {
          patientId: form.patientId,
          subject: `Nuevo informe disponible: ${form.title}`,
          body: persisted.description,
          channel: 'app',
          type: 'clinica',
          read: false,
          sentAt: new Date().toISOString()
        });
      }
      commit(next);
      setNotice({ type: 'ok', message: 'Informe guardado correctamente.' });
      resetForm();
      setTab('list');
    } catch (e) {
      setNotice({
        type: 'error',
        message: e instanceof Error ? e.message : 'No se pudo guardar el informe.'
      });
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setForm({ ...EMPTY_REPORT_FORM, patientId: state.patients[0]?.id ?? '' });
    setReportFile(null);
    setTemplateId('revision_general');
  }

  const previewPatient = state.patients.find((p) => p.id === form.patientId);

  function patchSection<K extends keyof ClinicalReportSections>(key: K, value: ClinicalReportSections[K]) {
    setForm((f) => ({ ...f, sections: { ...f.sections, [key]: value } }));
  }

  return (
    <div className="cr-module">
      <header className="cr-module__head">
        <div>
          <h1 className="cr-module__title">
            <FileText className="h-6 w-6 text-teal-700" aria-hidden />
            {tab === 'compose' ? 'Nuevo informe odontológico' : 'Informes clínicos'}
          </h1>
          <p className="cr-module__subtitle">
            {tab === 'compose'
              ? 'Completa la información del informe. El paciente podrá verlo en su portal si lo marcas como visible.'
              : 'Consulta, descarga y gestiona la visibilidad de los informes publicados.'}
          </p>
        </div>
        <div className="cr-module__tabs">
          <button
            type="button"
            className={`cr-tab${tab === 'compose' ? ' cr-tab--active' : ''}`}
            onClick={() => setTab('compose')}
          >
            <Plus className="h-4 w-4" aria-hidden />
            Nuevo informe
          </button>
          <button
            type="button"
            className={`cr-tab${tab === 'list' ? ' cr-tab--active' : ''}`}
            onClick={() => setTab('list')}
          >
            Listado ({list.length})
          </button>
        </div>
      </header>

      {tab === 'list' ? (
        <section className="cr-list-panel">
          <div className="cr-list-toolbar">
            <SearchInput value={patientQ} onChange={setPatientQ} placeholder="Filtrar por DNI, NHC o paciente…" />
            <SearchInput value={listQ} onChange={setListQ} placeholder="Buscar por título o ID…" />
          </div>
          {list.length ? (
            <div className="cr-table">
              {list.map((r) => (
                <ReportListRow key={r.id} report={r} />
              ))}
            </div>
          ) : (
            <div className="cr-empty">
              <FileText className="h-8 w-8 text-teal-600" aria-hidden />
              <p>No hay informes registrados.</p>
              <button type="button" className="cr-btn cr-btn--primary" onClick={() => setTab('compose')}>
                Crear informe
              </button>
            </div>
          )}
        </section>
      ) : (
        <div className="cr-compose-grid">
          <section className="cr-form-panel">
            <div className="cr-form-row cr-form-row--3">
              <div className="cr-field-block">
                <PatientLookup
                  state={state}
                  patientId={form.patientId}
                  onPatientId={(id) => setForm({ ...form, patientId: id, appointmentId: '' })}
                  label="Paciente *"
                  placeholder="Buscar por NHC, DNI o nombre…"
                  nhcPrimary
                />
                {previewPatient ? (
                  <p className="cr-hint">
                    {previewPatient.fullName} · {patientDisplayCode(previewPatient)}
                  </p>
                ) : null}
              </div>
              <Field label="Cita (motivo del informe) *">
                <Select value={form.appointmentId} onChange={(e) => onSelectAppointment(e.target.value)}>
                  <option value="">Seleccionar cita…</option>
                  {state.appointments
                    .filter((a) => a.patientId === form.patientId)
                    .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {appointmentLabel(state, a.id)}
                      </option>
                    ))}
                </Select>
                <p className="cr-hint">El título y la plantilla se completan según la cita seleccionada.</p>
              </Field>
              <Field label="Profesional">
                <Input value={form.dentistName} readOnly placeholder="Selecciona una cita…" />
              </Field>
            </div>

            {apptContext ? (
              <div className="cr-letterhead" aria-label="Membrete de la clínica">
                <img src={apptContext.clinicLogoUrl} alt="" className="cr-letterhead__logo" width={56} height={56} />
                <div className="cr-letterhead__body">
                  <p className="cr-letterhead__name">{apptContext.clinicName}</p>
                  <p className="cr-letterhead__line">
                    {apptContext.clinicAddress}, {apptContext.clinicCity}
                  </p>
                  <p className="cr-letterhead__line">
                    Tel. {apptContext.clinicPhone} · {apptContext.clinicEmail}
                  </p>
                  <p className="cr-letterhead__pro">
                    {apptContext.dentistHonorific} {apptContext.dentistName} · Col. n.º{' '}
                    {apptContext.dentistCollegiateNumber}
                  </p>
                </div>
              </div>
            ) : null}

            <div className="cr-title-box">
              <Field label="Título del informe *">
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                <p className="cr-hint">Sugerencia: Informe odontológico - [Tratamiento] - [Fecha]</p>
              </Field>
            </div>

            <div className="cr-sections">
              <ReportSectionGroup
                title="Cuerpo del informe"
                subtitle="Completa cada recuadro. El texto se ordenará automáticamente al guardar."
              >
                <ReportSectionBox
                  step="1"
                  title="Antecedentes"
                  hint="Historia médica, alergias, medicación y hábitos relevantes."
                  required
                  rows={5}
                  value={form.sections.antecedentes}
                  onChange={(v) => patchSection('antecedentes', v)}
                />
                <ReportSectionBox
                  step="2"
                  title="Informe clínico sobre tratamiento"
                  hint="Motivo de consulta, contexto de la visita y actuación programada."
                  required
                  rows={4}
                  value={form.sections.informeTratamiento}
                  onChange={(v) => patchSection('informeTratamiento', v)}
                />
                <ReportSectionBox
                  step="3"
                  title="Fuentes del informe"
                  hint="Historia clínica, exploración, radiografías, fotografías, etc."
                  rows={4}
                  value={form.sections.fuentesInforme}
                  onChange={(v) => patchSection('fuentesInforme', v)}
                />
                <ReportSectionBox
                  step="4"
                  title="Anamnesis y exploración"
                  hint="Motivo, hallazgos, piezas revisadas, actuación realizada y observaciones."
                  required
                  rows={8}
                  value={form.sections.anamnesisExploracion}
                  onChange={(v) => patchSection('anamnesisExploracion', v)}
                />
                <ReportSectionBox
                  step="5"
                  title="Tratamientos presupuestados y no ejecutados"
                  hint="Tratamientos propuestos que el paciente no realizó en esta visita."
                  rows={4}
                  value={form.sections.tratamientosNoEjecutados}
                  onChange={(v) => patchSection('tratamientosNoEjecutados', v)}
                />
              </ReportSectionGroup>

              <ReportSectionGroup title="Diagnóstico" subtitle="Valoración clínica y estado del paciente.">
                <ReportSectionBox
                  step="A"
                  title="Diagnóstico principal"
                  required
                  rows={3}
                  value={form.sections.diagnosticoPrincipal}
                  onChange={(v) => patchSection('diagnosticoPrincipal', v)}
                />
                <ReportSectionBox
                  step="B"
                  title="Hallazgos secundarios"
                  hint="Lista de hallazgos adicionales."
                  rows={4}
                  value={form.sections.hallazgosSecundarios}
                  onChange={(v) => patchSection('hallazgosSecundarios', v)}
                />
                <ReportSectionBox
                  step="C"
                  title="Estado general"
                  hint="Estable, en seguimiento, requiere tratamiento, etc."
                  rows={2}
                  value={form.sections.estadoGeneral}
                  onChange={(v) => patchSection('estadoGeneral', v)}
                />
              </ReportSectionGroup>

              <ReportSectionGroup title="Recomendaciones y seguimiento" subtitle="Indicaciones para el paciente y controles.">
                <ReportSectionBox
                  step="I"
                  title="Recomendaciones al paciente"
                  required
                  rows={4}
                  value={form.sections.recomendacionesPaciente}
                  onChange={(v) => patchSection('recomendacionesPaciente', v)}
                />
                <ReportSectionBox
                  step="II"
                  title="Tratamiento recomendado"
                  rows={3}
                  value={form.sections.tratamientoRecomendado}
                  onChange={(v) => patchSection('tratamientoRecomendado', v)}
                />
                <div className="cr-section-duo">
                  <ReportSectionBox
                    step="III"
                    title="Seguimiento"
                    rows={3}
                    value={form.sections.seguimiento}
                    onChange={(v) => patchSection('seguimiento', v)}
                  />
                  <ReportSectionBox
                    step="IV"
                    title="Próxima revisión sugerida"
                    rows={2}
                    value={form.sections.proximaRevision}
                    onChange={(v) => patchSection('proximaRevision', v)}
                  />
                </div>
                <ReportSectionBox
                  step="V"
                  title="Indicaciones adicionales"
                  rows={3}
                  value={form.sections.indicacionesAdicionales}
                  onChange={(v) => patchSection('indicacionesAdicionales', v)}
                />
                <ReportSectionBox
                  step="§"
                  title="Aviso legal (Colegio de Dentistas)"
                  hint="Texto en tamaño reducido para impresión en membrete. Editable."
                  variant="legal"
                  rows={4}
                  value={form.sections.avisoLegal}
                  onChange={(v) => patchSection('avisoLegal', v)}
                />
              </ReportSectionGroup>
            </div>

            <div className="cr-upload-block">
              <p className="cr-upload-label">Adjuntar informe (PDF)</p>
              {reportFile ? (
                <div className="cr-file-chip">
                  <FileText className="h-4 w-4 text-teal-700 shrink-0" aria-hidden />
                  <span className="min-w-0 truncate">{reportFile.name}</span>
                  <span className="text-xs text-slate-500">{(reportFile.size / 1024).toFixed(0)} KB</span>
                  <button type="button" className="cr-icon-btn" onClick={() => setReportFile(null)} aria-label="Quitar archivo">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="cr-upload-zone">
                  <Upload className="h-5 w-5 text-teal-700" aria-hidden />
                  <span>Subir PDF</span>
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    className="sr-only"
                    onChange={(e) => setReportFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              )}
            </div>

            <label className="cr-check">
              <input
                type="checkbox"
                checked={form.visibleToPatient}
                onChange={(e) => setForm({ ...form, visibleToPatient: e.target.checked })}
              />
              <span>
                <strong>Visible en portal del paciente</strong>
                <small>El paciente podrá ver y descargar este informe en su portal.</small>
              </span>
            </label>

            <div className="cr-form-actions">
              <button type="button" className="cr-btn cr-btn--outline" onClick={resetForm}>
                Cancelar
              </button>
              <button type="button" className="cr-btn cr-btn--primary" disabled={saving} onClick={() => void saveReport()}>
                <Lock className="h-4 w-4" aria-hidden />
                {saving ? 'Guardando…' : 'Guardar informe'}
              </button>
            </div>

            <p className="cr-save-note">
              <CheckCircle2 className="inline h-4 w-4 text-teal-700 mr-1" aria-hidden />
              Al guardar el informe, quedará vinculado al paciente y a la cita seleccionada y se publicará en su portal si
              está marcado como visible.
            </p>
          </section>

          <aside className="cr-aside">
            <div className="cr-aside-card">
              <h3>Plantillas rápidas</h3>
              <ul className="cr-templates">
                {REPORT_TEMPLATES.map((t) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      className={`cr-template${templateId === t.id ? ' cr-template--active' : ''}`}
                      onClick={() => applyTemplate(t.id)}
                    >
                      <span aria-hidden>{t.icon}</span>
                      {t.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="cr-aside-card cr-preview">
              <h3>Vista previa del paciente</h3>
              {form.title ? (
                <>
                  {apptContext ? (
                    <div className="cr-preview__letterhead">
                      <img src={apptContext.clinicLogoUrl} alt="" className="cr-preview__logo" width={48} height={48} />
                      <div>
                        <p className="cr-preview__clinic">{apptContext.clinicName}</p>
                        <p className="cr-preview__addr">
                          {apptContext.clinicAddress}, {apptContext.clinicCity}
                        </p>
                        <p className="cr-preview__addr">
                          {apptContext.dentistHonorific} {apptContext.dentistName} · Col. {apptContext.dentistCollegiateNumber}
                        </p>
                      </div>
                    </div>
                  ) : null}
                  <div className="cr-preview__head">
                    <span className="cr-preview__badge">Nuevo</span>
                    <p className="cr-preview__title">{form.title}</p>
                  </div>
                  <p className="cr-preview__meta">
                    {apptContext?.dateLabel ?? '—'} · {apptContext?.clinicName ?? 'Clínica'}
                  </p>
                  <p className="cr-preview__snippet">{form.sections.diagnosticoPrincipal.slice(0, 120)}</p>
                  <p className="cr-preview__snippet cr-preview__snippet--legal">
                    {form.sections.avisoLegal.includes('colegio@dentistascadiz.com')
                      ? 'Incluye aviso legal para el Colegio de Dentistas de Cádiz.'
                      : form.sections.recomendacionesPaciente.split('\n')[0]}
                  </p>
                  <div className="cr-preview__actions">
                    <button
                      type="button"
                      className="cr-btn cr-btn--outline cr-btn--sm"
                      onClick={() => {
                        const profLine = apptContext
                          ? `Profesional responsable: ${apptContext.dentistHonorific} ${apptContext.dentistName} · Colegiado n.º ${apptContext.dentistCollegiateNumber}`
                          : undefined;
                        const persistedPreview = formToPersistedFields(form, profLine);
                        const draft: ClinicalReport = {
                          id: 'preview',
                          tenantId: state.clinics.find((c) => c.id === apptContext?.clinicId)?.tenantId ?? '',
                          patientId: form.patientId,
                          appointmentId: form.appointmentId,
                          title: form.title,
                          description: persistedPreview.description,
                          diagnosis: persistedPreview.diagnosis,
                          recommendations: persistedPreview.recommendations,
                          uploadedBy: form.uploadedBy,
                          visibleToPatient: form.visibleToPatient,
                          createdAt: new Date().toISOString()
                        };
                        openClinicalReportPrintView(buildClinicalReportPrintHtmlFromState(state, draft), true);
                      }}
                    >
                      <Eye className="h-3 w-3" aria-hidden />
                      Ver PDF
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-500 m-0">Selecciona una cita y una plantilla para ver la vista previa.</p>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function ReportListRow({ report }: { report: ClinicalReport }) {
  const { state, commit } = useDemoStore();
  const { setNotice } = useNotice();
  const row = enrichReportListRow(state, report.id);
  if (!row) return null;

  return (
    <article className="cr-row">
      <div className="cr-row__main">
        <p className="cr-row__title">{row.report.title}</p>
        <p className="cr-row__meta">
          {row.patientName} · {row.nhc} · {row.clinicName}
        </p>
        <p className="cr-row__meta">
          {row.dateLabel} · {row.appointmentLabel} · {row.dentistName}
        </p>
        <span className={`cr-visibility${row.report.visibleToPatient ? ' cr-visibility--on' : ''}`}>
          Portal: {row.visibleLabel}
        </span>
      </div>
      <div className="cr-row__actions">
        <FileActions fileRef={row.report.fileRef} fileName={row.report.fileName} mimeType={row.report.mimeType} />
        <button
          type="button"
          className="cr-btn cr-btn--outline cr-btn--sm"
          title="Ver PDF con membrete"
          onClick={() => printClinicalReportFromState(state, row.report, true)}
        >
          <Eye className="h-3.5 w-3.5" aria-hidden />
          Ver PDF
        </button>
        <button
          type="button"
          className="cr-btn cr-btn--outline cr-btn--sm"
          onClick={() => {
            void (async () => {
              const nextVisible = !row.report.visibleToPatient;
              if (!isClientDemoMode()) {
                const clinicId =
                  state.patients.find((p) => p.id === row.report.patientId)?.preferredClinicId ??
                  state.clinics.find((c) => c.active)?.id;
                if (clinicId) {
                  const res = await fetch('/api/records/report', {
                    method: 'PATCH',
                    credentials: 'include',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({ clinicId, id: row.report.id, visibleToPatient: nextVisible })
                  });
                  if (!res.ok) {
                    setNotice({ type: 'error', message: 'No se pudo actualizar la visibilidad.' });
                    return;
                  }
                }
              }
              commit(saveClinicalReport(state, { ...row.report, visibleToPatient: nextVisible }));
              setNotice({ type: 'ok', message: 'Visibilidad actualizada.' });
            })();
          }}
        >
          {row.report.visibleToPatient ? 'Ocultar' : 'Publicar'}
        </button>
      </div>
    </article>
  );
}

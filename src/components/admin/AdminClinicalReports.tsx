import { useCallback, useEffect, useMemo, useState } from 'react';
import { Eye, FileText, Lock, Plus, Trash2, Upload } from 'lucide-react';
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
import {
  fieldsForComposeTab,
  REPORT_COMPOSE_TABS,
  type ReportComposeTab
} from '@/lib/clinical/reportFormUi';
import { ReportSectionBox } from './ReportSectionBox';
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
  const [composeTab, setComposeTab] = useState<ReportComposeTab>('clinical');
  const [listQ, setListQ] = useState('');
  const [patientQ, setPatientQ] = useState('');
  const [templateId, setTemplateId] = useState<ReportTemplateId>('revision_general');
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [showLegal, setShowLegal] = useState(false);
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

  function previewDraft() {
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
          setNotice({ type: 'ok', message: 'Informe guardado.' });
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
      setNotice({ type: 'ok', message: 'Informe guardado.' });
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
    setComposeTab('clinical');
    setShowLegal(false);
  }

  function patchSection<K extends keyof ClinicalReportSections>(key: K, value: ClinicalReportSections[K]) {
    setForm((f) => ({ ...f, sections: { ...f.sections, [key]: value } }));
  }

  const composeFields = fieldsForComposeTab(composeTab);

  return (
    <div className="cr-module">
      <header className="cr-module__head">
        <div>
          <h1 className="cr-module__title">
            <FileText className="h-6 w-6 text-teal-700" aria-hidden />
            Informes clínicos
          </h1>
        </div>
        <div className="cr-module__tabs">
          <button
            type="button"
            className={`cr-tab${tab === 'compose' ? ' cr-tab--active' : ''}`}
            onClick={() => setTab('compose')}
          >
            <Plus className="h-4 w-4" aria-hidden />
            Nuevo
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
            <SearchInput value={patientQ} onChange={setPatientQ} placeholder="Paciente, DNI o NHC…" />
            <SearchInput value={listQ} onChange={setListQ} placeholder="Título o ID…" />
          </div>
          {list.length ? (
            <div className="cr-table">
              {list.map((r) => (
                <ReportListRow key={r.id} report={r} />
              ))}
            </div>
          ) : (
            <div className="cr-empty">
              <p>No hay informes.</p>
              <button type="button" className="cr-btn cr-btn--primary" onClick={() => setTab('compose')}>
                Crear informe
              </button>
            </div>
          )}
        </section>
      ) : (
        <div className="cr-compose">
          <section className="cr-form-panel">
            <div className="cr-setup">
              <div className="cr-setup__row">
                <PatientLookup
                  state={state}
                  patientId={form.patientId}
                  onPatientId={(id) => setForm({ ...form, patientId: id, appointmentId: '' })}
                  label="Paciente *"
                  placeholder="NHC, DNI o nombre…"
                  nhcPrimary
                />
                <Field label="Cita *">
                  <Select value={form.appointmentId} onChange={(e) => onSelectAppointment(e.target.value)}>
                    <option value="">Seleccionar…</option>
                    {state.appointments
                      .filter((a) => a.patientId === form.patientId)
                      .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {appointmentLabel(state, a.id)}
                        </option>
                      ))}
                  </Select>
                </Field>
              </div>

              {apptContext ? (
                <p className="cr-context-bar">
                  {apptContext.clinicName} · {apptContext.dentistHonorific} {apptContext.dentistName} · Col.{' '}
                  {apptContext.dentistCollegiateNumber}
                </p>
              ) : null}

              <Field label="Título *">
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </Field>

              <div className="cr-templates-bar">
                <span className="cr-templates-bar__label">Plantilla</span>
                <div className="cr-templates-bar__chips">
                  {REPORT_TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={`cr-tpl-chip${templateId === t.id ? ' cr-tpl-chip--active' : ''}`}
                      onClick={() => applyTemplate(t.id)}
                      title={t.label}
                    >
                      <span aria-hidden>{t.icon}</span>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="cr-body-tabs" role="tablist">
              {REPORT_COMPOSE_TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={composeTab === t.id}
                  className={`cr-body-tab${composeTab === t.id ? ' cr-body-tab--active' : ''}`}
                  onClick={() => setComposeTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="cr-body-fields" role="tabpanel">
              {composeFields.map((f) => (
                <ReportSectionBox
                  key={f.key}
                  title={f.label}
                  rows={f.rows}
                  required={f.required}
                  value={form.sections[f.key]}
                  onChange={(v) => patchSection(f.key, v)}
                />
              ))}
              {composeTab === 'care' ? (
                <details
                  className="cr-legal-details"
                  open={showLegal}
                  onToggle={(e) => setShowLegal((e.target as HTMLDetailsElement).open)}
                >
                  <summary>Aviso legal (opcional)</summary>
                  <ReportSectionBox
                    title="Texto legal"
                    rows={2}
                    variant="legal"
                    value={form.sections.avisoLegal}
                    onChange={(v) => patchSection('avisoLegal', v)}
                  />
                </details>
              ) : null}
            </div>

            <footer className="cr-compose-footer">
              <label className="cr-check-inline">
                <input
                  type="checkbox"
                  checked={form.visibleToPatient}
                  onChange={(e) => setForm({ ...form, visibleToPatient: e.target.checked })}
                />
                Visible en portal del paciente
              </label>

              <div className="cr-compose-footer__row">
                {reportFile ? (
                  <span className="cr-file-mini">
                    <FileText className="h-3.5 w-3.5" aria-hidden />
                    {reportFile.name}
                    <button type="button" className="cr-icon-btn" onClick={() => setReportFile(null)} aria-label="Quitar">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ) : (
                  <label className="cr-upload-mini">
                    <Upload className="h-3.5 w-3.5" aria-hidden />
                    PDF
                    <input
                      type="file"
                      accept="application/pdf,.pdf"
                      className="sr-only"
                      onChange={(e) => setReportFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                )}
                <button
                  type="button"
                  className="cr-btn cr-btn--outline cr-btn--sm"
                  disabled={!form.title.trim()}
                  onClick={previewDraft}
                >
                  <Eye className="h-3.5 w-3.5" aria-hidden />
                  Ver PDF
                </button>
                <button type="button" className="cr-btn cr-btn--outline cr-btn--sm" onClick={resetForm}>
                  Cancelar
                </button>
                <button
                  type="button"
                  className="cr-btn cr-btn--primary cr-btn--sm"
                  disabled={saving}
                  onClick={() => void saveReport()}
                >
                  <Lock className="h-3.5 w-3.5" aria-hidden />
                  {saving ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </footer>
          </section>
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
          {row.patientName} · {row.dateLabel} · {row.dentistName}
        </p>
        <span className={`cr-visibility${row.report.visibleToPatient ? ' cr-visibility--on' : ''}`}>
          {row.report.visibleToPatient ? 'En portal' : 'Solo clínica'}
        </span>
      </div>
      <div className="cr-row__actions">
        <button
          type="button"
          className="cr-btn cr-btn--outline cr-btn--sm"
          onClick={() => printClinicalReportFromState(state, row.report, true)}
        >
          <Eye className="h-3.5 w-3.5" aria-hidden />
          PDF
        </button>
        <FileActions fileRef={row.report.fileRef} fileName={row.report.fileName} mimeType={row.report.mimeType} />
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
                    setNotice({ type: 'error', message: 'No se pudo actualizar.' });
                    return;
                  }
                }
              }
              commit(saveClinicalReport(state, { ...row.report, visibleToPatient: nextVisible }));
              setNotice({ type: 'ok', message: 'Actualizado.' });
            })();
          }}
        >
          {row.report.visibleToPatient ? 'Ocultar' : 'Publicar'}
        </button>
      </div>
    </article>
  );
}

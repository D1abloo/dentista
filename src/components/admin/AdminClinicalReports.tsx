import { useCallback, useEffect, useMemo, useState } from 'react';
import { Edit2, Eye, FileText, Lock, Trash2, Upload } from 'lucide-react';
import { isClientDemoMode } from '@/lib/appMode';
import {
  appointmentBelongsToPatient,
  buildReportTitle,
  enrichReportListRow,
  getAppointmentReportContext,
  type AppointmentReportContext
} from '@/lib/clinical/reportContext';
import {
  EMPTY_REPORT_FORM,
  formToPersistedFields,
  parseReportApiError,
  validateClinicalReportForm,
  type ClinicalReportFormState,
  type ClinicalReportSections
} from '@/lib/clinical/reportForm';
import { REPORT_FORM_GROUPS } from '@/lib/clinical/reportFormUi';
import { applyReportPublishLock, isClinicalReportEditable } from '@/lib/clinical/reportLock';
import { parseStoredReportSections } from '@/lib/clinical/reportSections';
import { ReportSectionBox, ReportSectionGroup } from './ReportSectionBox';
import { addMessage, createClinicalReport, saveClinicalReport } from '@/lib/demoStore';
import { isPdfMime, saveDemoFile } from '@/lib/demoFiles';
import {
  buildClinicalReportPrintHtmlFromState,
  ensureClinicalReportPdf,
  openClinicalReportPrintView,
  printClinicalReportFromState
} from '@/lib/pdfClinicalReport';
import { mapClinicalReportRow, type ClinicalReportRow } from '@/lib/records/clinicalReportMapper';
import { recordMatchesPatientQuery } from '@/lib/patientSearch';
import { useDemoStore } from '@/hooks/useDemoStore';
import { useNotice } from '@/hooks/useNotice';
import type { ClinicalReport } from '@/types/demo';
import { FileActions } from '@/components/shared/FileActions';
import { patientName } from '@/lib/selectors';
import { SearchInput } from '@/components/ui';
import {
  canEnableReportSections,
  ClinicalReportBaseSetup,
  ClinicalReportSectionsPlaceholder,
  regenerateReportTitle
} from './clinical-reports/ClinicalReportBaseSetup';

export function AdminClinicalReports() {
  const { state, commit, refresh } = useDemoStore();
  const { setNotice } = useNotice();
  const [tab, setTab] = useState<'compose' | 'list'>('compose');
  const [listQ, setListQ] = useState('');
  const [patientQ, setPatientQ] = useState('');
  const [dentistFilter, setDentistFilter] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const id = new URLSearchParams(window.location.search).get('dentist');
    if (id) setDentistFilter(id);
  }, []);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [withoutAppointment, setWithoutAppointment] = useState(false);
  const [form, setForm] = useState<ClinicalReportFormState>(() => ({
    ...EMPTY_REPORT_FORM,
    patientId: ''
  }));

  const editingReport = useMemo(
    () => (editingId ? state.clinicalReports.find((r) => r.id === editingId) : undefined),
    [editingId, state.clinicalReports]
  );

  const formLocked = Boolean(editingReport && !isClinicalReportEditable(editingReport));

  const apptContext = useMemo(
    () => (form.appointmentId ? getAppointmentReportContext(state, form.appointmentId) : null),
    [state, form.appointmentId]
  );

  const list = useMemo(() => {
    let rows = [...state.clinicalReports];
    if (dentistFilter) {
      const pro = state.dentists.find((d) => d.id === dentistFilter);
      rows = rows.filter((r) => {
        const appt = r.appointmentId ? state.appointments.find((a) => a.id === r.appointmentId) : undefined;
        if (appt?.dentistId === dentistFilter) return true;
        if (pro && r.uploadedBy.includes(pro.fullName.replace(/^(dr\.?|dra\.?)\s+/i, '').trim())) return true;
        return false;
      });
    }
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
  }, [state, listQ, patientQ, dentistFilter]);

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
      title: f.title.trim() && editingId ? f.title : buildReportTitle(apptContext)
    }));
  }, [form.appointmentId, apptContext, form.patientId, editingId]);

  const openEdit = useCallback(
    (report: ClinicalReport) => {
      if (!isClinicalReportEditable(report)) {
        setNotice({
          type: 'error',
          message: 'Informe bloqueado en el portal del paciente. Solo administración de BBDD puede reabrirlo.'
        });
        return;
      }
      setEditingId(report.id);
      setReportFile(null);
      setWithoutAppointment(!report.appointmentId);
      setForm({
        patientId: report.patientId,
        appointmentId: report.appointmentId ?? '',
        dentistName: report.uploadedBy,
        title: report.title,
        sections: parseStoredReportSections(
          report.description,
          report.diagnosis ?? '',
          report.recommendations ?? ''
        ),
        visibleToPatient: report.visibleToPatient,
        uploadedBy: report.uploadedBy
      });
      setTab('compose');
    },
    [setNotice]
  );

  function onSelectAppointment(appointmentId: string) {
    if (!appointmentId) {
      setForm((f) => ({ ...f, appointmentId: '', dentistName: '' }));
      return;
    }
    if (form.patientId && !appointmentBelongsToPatient(state, appointmentId, form.patientId)) {
      setNotice({ type: 'error', message: 'La cita seleccionada no pertenece a este paciente.' });
      return;
    }
    const ctx = getAppointmentReportContext(state, appointmentId);
    if (!ctx) return;
    setWithoutAppointment(false);
    setForm((f) => ({
      ...f,
      appointmentId,
      patientId: ctx.patientId,
      dentistName: `${ctx.dentistHonorific} ${ctx.dentistName}`,
      uploadedBy: `${ctx.dentistHonorific} ${ctx.dentistName}`,
      title: editingId && f.title.trim() ? f.title : buildReportTitle(ctx)
    }));
  }

  function toggleWithoutAppointment() {
    if (withoutAppointment) {
      setWithoutAppointment(false);
      setForm((f) => ({ ...f, appointmentId: '' }));
      return;
    }
    setWithoutAppointment(true);
    setForm((f) => ({
      ...f,
      appointmentId: '',
      title: regenerateReportTitle(state, '', f.patientId)
    }));
  }

  const sectionsEnabled = canEnableReportSections(form, withoutAppointment) || Boolean(editingId);

  function previewDraft() {
    const profLine = professionalLineFromContext(apptContext);
    const persistedPreview = formToPersistedFields(form, profLine);
    const draft: ClinicalReport = {
      id: editingId ?? 'preview',
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
    if (formLocked) {
      setNotice({ type: 'error', message: 'Este informe no se puede modificar.' });
      return;
    }
    const err = validateClinicalReportForm(form, apptContext, { allowWithoutAppointment: withoutAppointment });
    if (err) {
      setNotice({ type: 'error', message: err });
      return;
    }
    if (form.appointmentId && !appointmentBelongsToPatient(state, form.appointmentId, form.patientId)) {
      setNotice({ type: 'error', message: 'Selecciona una cita válida.' });
      return;
    }

    let fileRef: string | undefined = editingReport?.fileRef;
    let fileName: string | undefined = editingReport?.fileName;
    let mimeType: string | undefined = editingReport?.mimeType;
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

    const professionalLine = professionalLineFromContext(apptContext);
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
        const url = '/api/records/report';
        const res = await fetch(url, {
          method: editingId ? 'PUT' : 'POST',
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(editingId ? { ...reportInput, id: editingId } : reportInput)
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
          mapped = applyReportPublishLock(mapped, mapped.visibleToPatient);
          let next = saveClinicalReport(state, mapped);
          if (!editingId && form.visibleToPatient) {
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
          setNotice({ type: 'ok', message: editingId ? 'Informe actualizado.' : 'Informe guardado.' });
          resetForm();
          setTab('list');
          return;
        }
      }

      if (editingId && editingReport) {
        const updated: ClinicalReport = applyReportPublishLock(
          {
            ...editingReport,
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
          },
          form.visibleToPatient
        );
        let next = saveClinicalReport(state, updated);
        if (!fileRef) {
          const ensured = await ensureClinicalReportPdf(next, updated);
          next = saveClinicalReport(next, ensured.report);
        }
        commit(next);
        setNotice({ type: 'ok', message: 'Informe actualizado.' });
        resetForm();
        setTab('list');
        return;
      }

      const { clinicId: _c, ...reportData } = reportInput;
      let next = createClinicalReport(state, reportData);
      const created = next.clinicalReports[next.clinicalReports.length - 1];
      if (created) {
        const locked = applyReportPublishLock(created, created.visibleToPatient);
        next = saveClinicalReport(next, locked);
      }
      const saved = next.clinicalReports[next.clinicalReports.length - 1];
      if (!fileRef && saved) {
        const ensured = await ensureClinicalReportPdf(next, saved);
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
    setEditingId(null);
    setWithoutAppointment(false);
    setForm({ ...EMPTY_REPORT_FORM, patientId: '' });
    setReportFile(null);
  }

  function patchSection<K extends keyof ClinicalReportSections>(key: K, value: ClinicalReportSections[K]) {
    setForm((f) => ({ ...f, sections: { ...f.sections, [key]: value } }));
  }

  const publishLocked = Boolean(editingReport?.lockedAt);
  const filteredProfessional = dentistFilter ? state.dentists.find((d) => d.id === dentistFilter) : null;
  const patientAppointments = useMemo(
    () =>
      state.appointments
        .filter((a) => a.patientId === form.patientId)
        .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`)),
    [state.appointments, form.patientId]
  );

  function openNewReport() {
    resetForm();
    setTab('compose');
  }

  const baseSetupProps = {
    state,
    form,
    listCount: list.length,
    dentistFilter,
    filteredProfessionalName: filteredProfessional?.fullName,
    apptContext,
    patientAppointments,
    withoutAppointment,
    onNewReport: openNewReport,
    onOpenList: () => setTab('list'),
    onClearDentistFilter: () => {
      window.location.href = '/admin/informes';
    },
    onSelectAppointment,
    onWithoutAppointment: toggleWithoutAppointment,
    onRegenerateTitle: () =>
      setForm((f) => ({
        ...f,
        title: regenerateReportTitle(state, f.appointmentId, f.patientId)
      })),
    activeTab: tab
  } as const;

  return (
    <div className="cr-module cr-module--v2">
      <ClinicalReportBaseSetup
        {...baseSetupProps}
        formLocked={tab === 'list' ? false : formLocked}
        showBaseForm={tab === 'compose'}
        onPatientId={(id) => {
          setWithoutAppointment(false);
          setForm((f) => ({ ...f, patientId: id, appointmentId: '', title: '' }));
        }}
        onTitleChange={(title) => setForm((f) => ({ ...f, title }))}
      />

      {tab === 'list' ? (
        <section className="cr-list-panel">
          <div className="cr-list-toolbar">
            <SearchInput value={patientQ} onChange={setPatientQ} placeholder="Paciente, DNI o NHC…" />
            <SearchInput value={listQ} onChange={setListQ} placeholder="Título o ID…" />
          </div>
          {list.length ? (
            <div className="cr-table">
              {list.map((r) => (
                <ReportListRow key={r.id} report={r} onEdit={() => openEdit(r)} />
              ))}
            </div>
          ) : (
            <div className="cr-empty">
              <p>No hay informes.</p>
              <button type="button" className="cr-btn cr-btn--primary" onClick={openNewReport}>
                Crear informe
              </button>
            </div>
          )}
        </section>
      ) : (
        <div className="cr-compose">
          <ClinicalReportSectionsPlaceholder enabled={sectionsEnabled} />

          {sectionsEnabled ? (
          <section className="cr-form-panel cr-fade-in">
            {editingReport?.reopenedForEdit ? (
              <p className="cr-compose-banner cr-compose-banner--edit">
                Informe reabierto para edición (desbloqueo en base de datos). Al guardar se vuelve a bloquear si sigue en
                portal del paciente.
              </p>
            ) : null}
            {formLocked ? (
              <p className="cr-compose-banner cr-compose-banner--locked">
                Informe bloqueado: publicado en el portal del paciente. Solo administración de BBDD puede reabrirlo.
              </p>
            ) : null}
            {withoutAppointment ? (
              <p className="cr-compose-banner cr-compose-banner--edit">Informe sin cita vinculada.</p>
            ) : null}

            <div className="cr-form-body">
              {REPORT_FORM_GROUPS.map((group) => (
                <ReportSectionGroup key={group.id} title={group.title} subtitle={group.subtitle}>
                  {group.fields.map((f) => (
                    <ReportSectionBox
                      key={f.key}
                      title={f.label}
                      rows={f.rows}
                      required={f.required}
                      wide={f.wide}
                      variant={f.key === 'avisoLegal' ? 'legal' : 'framed'}
                      value={form.sections[f.key]}
                      onChange={(v) => patchSection(f.key, v)}
                      disabled={formLocked}
                    />
                  ))}
                </ReportSectionGroup>
              ))}
            </div>

            <footer className="cr-compose-footer">
              <label
                className={`cr-check-inline${publishLocked ? ' cr-check-inline--disabled' : ''}`}
                title={
                  publishLocked
                    ? 'Publicado en portal: la visibilidad no se cambia desde el formulario'
                    : undefined
                }
              >
                <input
                  type="checkbox"
                  checked={form.visibleToPatient}
                  disabled={formLocked || publishLocked}
                  onChange={(e) => setForm({ ...form, visibleToPatient: e.target.checked })}
                />
                Visible en portal del paciente (bloquea edición al publicar)
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
                    PDF adjunto
                    <input
                      type="file"
                      accept="application/pdf,.pdf"
                      className="sr-only"
                      disabled={formLocked}
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
                  disabled={saving || formLocked}
                  onClick={() => void saveReport()}
                >
                  <Lock className="h-3.5 w-3.5" aria-hidden />
                  {saving ? 'Guardando…' : editingId ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </footer>
          </section>
          ) : null}
        </div>
      )}
    </div>
  );
}

function professionalLineFromContext(apptContext: AppointmentReportContext | null) {
  return apptContext
    ? `Profesional responsable: ${apptContext.dentistHonorific} ${apptContext.dentistName} · Colegiado n.º ${apptContext.dentistCollegiateNumber}`
    : undefined;
}

function ReportListRow({ report, onEdit }: { report: ClinicalReport; onEdit: () => void }) {
  const { state, commit } = useDemoStore();
  const { setNotice } = useNotice();
  const row = enrichReportListRow(state, report.id);
  if (!row) return null;

  const editable = isClinicalReportEditable(row.report);
  const locked = Boolean(row.report.lockedAt);

  return (
    <article className="cr-row">
      <div className="cr-row__main">
        <p className="cr-row__title">{row.report.title}</p>
        <p className="cr-row__meta">
          {row.patientName} · {row.dateLabel} · {row.dentistName}
        </p>
        <div className="cr-row__badges">
          <span className={`cr-visibility${row.report.visibleToPatient ? ' cr-visibility--on' : ''}`}>
            {row.report.visibleToPatient ? 'En portal' : 'Solo clínica'}
          </span>
          {locked ? (
            <span className={`cr-lock-badge${row.report.reopenedForEdit ? ' cr-lock-badge--open' : ''}`}>
              {row.report.reopenedForEdit ? 'Reabierto (BBDD)' : 'Bloqueado'}
            </span>
          ) : null}
        </div>
      </div>
      <div className="cr-row__actions">
        {editable ? (
          <button type="button" className="cr-btn cr-btn--outline cr-btn--sm" onClick={onEdit}>
            <Edit2 className="h-3.5 w-3.5" aria-hidden />
            Editar
          </button>
        ) : null}
        <button
          type="button"
          className="cr-btn cr-btn--outline cr-btn--sm"
          onClick={() => printClinicalReportFromState(state, row.report, true)}
        >
          <Eye className="h-3.5 w-3.5" aria-hidden />
          PDF
        </button>
        <FileActions fileRef={row.report.fileRef} fileName={row.report.fileName} mimeType={row.report.mimeType} />
        {!locked ? (
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
                    const json = (await res.json()) as { data?: ClinicalReportRow };
                    if (json.data) {
                      const mapped = applyReportPublishLock(
                        mapClinicalReportRow(json.data),
                        Boolean(json.data.visible_to_patient)
                      );
                      commit(saveClinicalReport(state, mapped));
                      setNotice({ type: 'ok', message: 'Actualizado.' });
                      return;
                    }
                  }
                }
                const updated = applyReportPublishLock(
                  { ...row.report, visibleToPatient: nextVisible },
                  nextVisible
                );
                commit(saveClinicalReport(state, updated));
                setNotice({ type: 'ok', message: 'Actualizado.' });
              })();
            }}
          >
            {row.report.visibleToPatient ? 'Ocultar' : 'Publicar'}
          </button>
        ) : null}
      </div>
    </article>
  );
}

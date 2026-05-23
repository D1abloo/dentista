import { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Calendar,
  ChevronDown,
  ClipboardList,
  FileText,
  Filter,
  Info,
  List,
  Mail,
  Pencil,
  Phone,
  Plus,
  Search,
  Sparkles,
  Stethoscope,
  User,
  X
} from 'lucide-react';
import type { ClinicalReportFormState } from '@/lib/clinical/reportForm';
import { buildReportTitle, getAppointmentReportContext, type AppointmentReportContext } from '@/lib/clinical/reportContext';
import { findPatientsByQuery, findPatientIdByQuery } from '@/lib/patientSearch';
import { fmtDate, statusLabel } from '@/lib/format';
import { patientDisplayCode } from '@/lib/nhc';
import type { Appointment, DemoState, Patient } from '@/types/demo';

function appointmentSelectLabel(state: DemoState, appointmentId: string) {
  const appt = state.appointments.find((a) => a.id === appointmentId);
  if (!appt) return '';
  return `${fmtDate(appt.date)} - ${appt.time}`;
}

function clinicNameForPatient(state: DemoState, patient: Patient) {
  const clinic =
    (patient.preferredClinicId && state.clinics.find((c) => c.id === patient.preferredClinicId)) ||
    state.clinics.find((c) => c.active) ||
    state.clinics[0];
  return clinic?.name ?? 'Clínica';
}

type Props = {
  state: DemoState;
  form: ClinicalReportFormState;
  formLocked: boolean;
  listCount: number;
  dentistFilter: string;
  filteredProfessionalName?: string;
  apptContext: AppointmentReportContext | null;
  patientAppointments: Appointment[];
  withoutAppointment: boolean;
  onNewReport: () => void;
  onOpenList: () => void;
  onClearDentistFilter: () => void;
  onPatientId: (id: string) => void;
  onSelectAppointment: (id: string) => void;
  onWithoutAppointment: () => void;
  onTitleChange: (title: string, manual?: boolean) => void;
  onRegenerateTitle: () => void;
  activeTab?: 'compose' | 'list';
  showBaseForm?: boolean;
};

export function ClinicalReportBaseSetup({
  state,
  form,
  formLocked,
  listCount,
  dentistFilter,
  filteredProfessionalName,
  apptContext,
  patientAppointments,
  withoutAppointment,
  onNewReport,
  onOpenList,
  onClearDentistFilter,
  onPatientId,
  onSelectAppointment,
  onWithoutAppointment,
  onTitleChange,
  onRegenerateTitle,
  activeTab = 'compose',
  showBaseForm = true
}: Props) {
  const [patientQ, setPatientQ] = useState('');
  const [changingPatient, setChangingPatient] = useState(false);
  const [titleHighlight, setTitleHighlight] = useState(false);
  const [showPatientResults, setShowPatientResults] = useState(false);

  const selectedPatient = state.patients.find((p) => p.id === form.patientId);
  const showPatientCard = Boolean(selectedPatient) && !changingPatient;

  const patientMatches = useMemo(() => {
    const list = findPatientsByQuery(state, patientQ);
    return patientQ.trim() ? list.slice(0, 8) : [];
  }, [state, patientQ]);

  const selectedAppt = form.appointmentId
    ? state.appointments.find((a) => a.id === form.appointmentId)
    : undefined;
  const treatment = selectedAppt ? state.treatments.find((t) => t.id === selectedAppt.treatmentId) : null;
  const dentist = selectedAppt ? state.dentists.find((d) => d.id === selectedAppt.dentistId) : null;

  useEffect(() => {
    if (!titleHighlight) return;
    const t = window.setTimeout(() => setTitleHighlight(false), 1200);
    return () => window.clearTimeout(t);
  }, [titleHighlight]);

  function pickPatient(id: string) {
    onPatientId(id);
    setChangingPatient(false);
    setPatientQ('');
    setShowPatientResults(false);
  }

  function applyPatientSearch() {
    const id = findPatientIdByQuery(state, patientQ);
    if (id) pickPatient(id);
  }

  function handleRegenerateTitle() {
    onRegenerateTitle();
    setTitleHighlight(true);
  }

  const titleSuggested = Boolean(apptContext && form.title.trim() && !withoutAppointment);

  return (
    <>
      <header className="cr-hero">
        <div className="cr-hero__brand">
          <span className="cr-hero__icon" aria-hidden>
            <FileText className="h-6 w-6" />
          </span>
          <div>
            <h1 className="cr-hero__title">Informes clínicos</h1>
            <p className="cr-hero__sub">Crea y gestiona los informes clínicos de tus pacientes</p>
          </div>
        </div>
        <div className="cr-hero__actions">
          <button
            type="button"
            className={`cr-btn-hero cr-btn-hero--primary${activeTab === 'compose' ? ' cr-btn-hero--active' : ''}`}
            onClick={onNewReport}
          >
            <Plus className="h-4 w-4" aria-hidden />
            Nuevo informe
          </button>
          <button
            type="button"
            className={`cr-btn-hero cr-btn-hero--secondary${activeTab === 'list' ? ' cr-btn-hero--active' : ''}`}
            onClick={onOpenList}
          >
            <List className="h-4 w-4" aria-hidden />
            Listado ({listCount})
          </button>
        </div>
      </header>

      {dentistFilter ? (
        <div className="cr-pro-filter cr-fade-in" role="status">
          <div className="cr-pro-filter__icon" aria-hidden>
            <Filter className="h-5 w-5" />
          </div>
          <div className="cr-pro-filter__text">
            <p className="cr-pro-filter__title">Mostrando informes de {filteredProfessionalName ?? 'profesional'}</p>
            <p className="cr-pro-filter__sub">Los informes que crees se asociarán a este profesional.</p>
          </div>
          <button type="button" className="cr-pro-filter__clear" onClick={onClearDentistFilter}>
            <X className="h-4 w-4" aria-hidden />
            Quitar filtro
          </button>
        </div>
      ) : null}

      {showBaseForm ? (
      <section className="cr-base-card cr-fade-in">
        <header className="cr-base-card__head">
          <span className="cr-base-card__head-icon" aria-hidden>
            <ClipboardList className="h-5 w-5" />
          </span>
          <div>
            <h2 className="cr-base-card__title">Datos base del informe</h2>
            <p className="cr-base-card__sub">
              Selecciona el paciente y la cita vinculada para crear el informe clínico.
            </p>
          </div>
        </header>

        <div className="cr-base-grid">
          <div className="cr-base-col">
            <h3 className="cr-base-col__title">
              1. Paciente <span className="cr-req">*</span>
            </h3>

            {!showPatientCard ? (
              <div className="cr-search-wrap">
                <Search className="cr-search-wrap__icon" aria-hidden />
                <input
                  type="search"
                  className="cr-search-wrap__input"
                  placeholder="Buscar por NHC, DNI o nombre..."
                  value={patientQ}
                  onChange={(e) => {
                    setPatientQ(e.target.value);
                    setShowPatientResults(true);
                  }}
                  onFocus={() => setShowPatientResults(true)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), applyPatientSearch())}
                  disabled={formLocked}
                />
                {showPatientResults && patientMatches.length ? (
                  <ul className="cr-search-wrap__results">
                    {patientMatches.map((p) => (
                      <li key={p.id}>
                        <button type="button" className="cr-search-wrap__item" onClick={() => pickPatient(p.id)}>
                          {p.nhc ? <span className="cr-search-wrap__nhc">NHC {p.nhc}</span> : null}
                          <span>{p.fullName}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}

            {showPatientCard && selectedPatient ? (
              <article className="cr-patient-card cr-fade-in">
                <div className="cr-patient-card__top">
                  <span className="cr-patient-card__avatar" aria-hidden>
                    <User className="h-6 w-6" />
                  </span>
                  <div className="cr-patient-card__identity">
                    {selectedPatient.nhc ? (
                      <span className="cr-patient-card__nhc">NHC {selectedPatient.nhc}</span>
                    ) : (
                      <span className="cr-patient-card__nhc">{patientDisplayCode(selectedPatient)}</span>
                    )}
                    <p className="cr-patient-card__name">{selectedPatient.fullName}</p>
                  </div>
                </div>
                <ul className="cr-patient-card__meta">
                  {selectedPatient.email ? (
                    <li>
                      <Mail className="h-4 w-4" aria-hidden />
                      {selectedPatient.email}
                    </li>
                  ) : null}
                  {selectedPatient.phone ? (
                    <li>
                      <Phone className="h-4 w-4" aria-hidden />
                      {selectedPatient.phone}
                    </li>
                  ) : null}
                  <li>
                    <Building2 className="h-4 w-4" aria-hidden />
                    {clinicNameForPatient(state, selectedPatient)}
                  </li>
                </ul>
                <button
                  type="button"
                  className="cr-patient-card__change"
                  disabled={formLocked}
                  onClick={() => {
                    setChangingPatient(true);
                    setPatientQ('');
                  }}
                >
                  <Pencil className="h-4 w-4" aria-hidden />
                  Cambiar paciente
                </button>
              </article>
            ) : null}

            {!showPatientCard && !patientQ && !form.patientId ? (
              <p className="cr-base-hint">Busca y selecciona un paciente para continuar.</p>
            ) : null}
          </div>

          <div className="cr-base-col">
            <h3 className="cr-base-col__title">
              2. Cita vinculada
              <button type="button" className="cr-info-tip" title="La cita determina tratamiento y profesional">
                <Info className="h-4 w-4" aria-hidden />
              </button>
            </h3>

            <div className={`cr-select-wrap${withoutAppointment ? ' cr-select-wrap--muted' : ''}`}>
              <Calendar className="cr-select-wrap__icon" aria-hidden />
              <select
                className="cr-select-wrap__select"
                value={form.appointmentId}
                disabled={formLocked || !form.patientId || withoutAppointment}
                onChange={(e) => onSelectAppointment(e.target.value)}
              >
                <option value="">
                  {form.patientId ? 'Seleccionar cita…' : 'Primero elige un paciente'}
                </option>
                {patientAppointments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {appointmentSelectLabel(state, a.id)}
                  </option>
                ))}
              </select>
              <ChevronDown className="cr-select-wrap__chev" aria-hidden />
            </div>

            {selectedAppt && !withoutAppointment ? (
              <article className="cr-appt-card cr-fade-in">
                <dl className="cr-appt-card__rows">
                  <div className="cr-appt-card__row">
                    <dt>
                      <Stethoscope className="h-4 w-4" aria-hidden />
                      Tratamiento
                    </dt>
                    <dd>{treatment?.name ?? 'Consulta'}</dd>
                  </div>
                  <div className="cr-appt-card__row">
                    <dt>
                      <User className="h-4 w-4" aria-hidden />
                      Profesional
                    </dt>
                    <dd>
                      {dentist?.fullName ??
                        (apptContext ? `${apptContext.dentistHonorific} ${apptContext.dentistName}` : '—')}
                    </dd>
                  </div>
                  <div className="cr-appt-card__row">
                    <dt>
                      <Calendar className="h-4 w-4" aria-hidden />
                      Hora
                    </dt>
                    <dd>{selectedAppt.time}</dd>
                  </div>
                  <div className="cr-appt-card__row">
                    <dt>Estado</dt>
                    <dd>
                      <span className="cr-status-pill">{statusLabel(selectedAppt.status)}</span>
                    </dd>
                  </div>
                </dl>
              </article>
            ) : withoutAppointment ? (
              <p className="cr-base-hint cr-base-hint--warn">Informe sin cita vinculada.</p>
            ) : (
              <p className="cr-base-hint">Elige una cita del paciente o crea el informe sin cita.</p>
            )}

            <button
              type="button"
              className="cr-link-action"
              disabled={formLocked || !form.patientId}
              onClick={onWithoutAppointment}
            >
              <FileText className="h-4 w-4" aria-hidden />
              {withoutAppointment ? 'Vincular una cita' : 'Crear informe sin cita'}
            </button>
          </div>

          <div className="cr-base-col">
            <h3 className="cr-base-col__title">
              3. Título del informe <span className="cr-req">*</span>
            </h3>

            <div className="cr-title-row">
              <input
                type="text"
                className={`cr-title-row__input${titleHighlight ? ' cr-title-row__input--flash' : ''}`}
                value={form.title}
                disabled={formLocked}
                placeholder="Informe odontológico - …"
                onChange={(e) => onTitleChange(e.target.value, true)}
              />
              <button
                type="button"
                className="cr-title-row__magic"
                title="Regenerar título sugerido"
                disabled={formLocked || !apptContext}
                onClick={handleRegenerateTitle}
              >
                <Sparkles className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <p className="cr-base-hint">Puedes editar el título antes de guardar.</p>

            {titleSuggested ? (
              <div className="cr-title-tip cr-fade-in">
                <Info className="h-4 w-4 shrink-0" aria-hidden />
                <div>
                  <p className="cr-title-tip__label">Título sugerido</p>
                  <p className="cr-title-tip__text">
                    El título se ha generado automáticamente según el tratamiento y la fecha de la cita.
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>
      ) : null}
    </>
  );
}

export function ClinicalReportSectionsPlaceholder({ enabled }: { enabled: boolean }) {
  if (enabled) return null;
  return (
    <section className="cr-sections-placeholder cr-fade-in" aria-hidden={enabled}>
      <FileText className="cr-sections-placeholder__icon" aria-hidden />
      <p className="cr-sections-placeholder__title">
        Selecciona un paciente y una cita para comenzar a crear el informe.
      </p>
      <p className="cr-sections-placeholder__sub">Los campos restantes se habilitarán automáticamente.</p>
    </section>
  );
}

export function canEnableReportSections(
  form: ClinicalReportFormState,
  withoutAppointment: boolean
): boolean {
  if (!form.patientId?.trim()) return false;
  if (!form.title?.trim()) return false;
  if (!withoutAppointment && !form.appointmentId?.trim()) return false;
  return true;
}

export function regenerateReportTitle(
  state: DemoState,
  appointmentId: string,
  patientId: string
): string {
  if (appointmentId) {
    const ctx = getAppointmentReportContext(state, appointmentId);
    if (ctx) return buildReportTitle(ctx);
  }
  const patient = state.patients.find((p) => p.id === patientId);
  return patient ? `Informe odontológico - ${patient.fullName}` : 'Informe odontológico';
}

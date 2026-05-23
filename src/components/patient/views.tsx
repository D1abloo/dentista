import { useState } from 'react';
import {
  filterAppointments,
  isActiveStatus,
  isClinicSlotTaken
} from '@/lib/appointments';
import {
  rescheduleAppointment,
  savePatient,
  settingsFor,
  updateAppointmentStatus
} from '@/lib/demoStore';
import { fmtDate, fmtDateTime, money, statusLabel } from '@/lib/format';
import { HelpEmbedded } from '@/components/help/HelpEmbedded';
import { PatientConsents } from './consents';
import { PatientIdentity } from './PatientIdentity';
import { email, phone, required } from '@/lib/validation';
import { useDemoStore } from '@/hooks/useDemoStore';
import { useNotice } from '@/hooks/useNotice';
import { usePatient } from '@/hooks/usePatient';
import type { Appointment, AppointmentStatus, Patient } from '@/types/demo';
import {
  Badge,
  Button,
  Card,
  ConfirmModal,
  Empty,
  Field,
  FilterTabs,
  Input,
  PageHeader,
  SearchInput,
  Select,
  Textarea
} from '@/components/ui';
export { PatientInvoices, PatientPayments } from './records';
export { PatientReports } from './PatientReports';
export { PatientDocuments } from './PatientDocuments';
export { PatientBook } from './PatientBook';

function useApptMeta(state: ReturnType<typeof useDemoStore>['state'], a: Appointment) {
  const t = state.treatments.find((x) => x.id === a.treatmentId);
  const d = state.dentists.find((x) => x.id === a.dentistId);
  const c = state.clinics.find((x) => x.id === a.clinicId);
  return { treatment: t?.name ?? '—', dentist: d?.fullName ?? '—', clinic: c?.name ?? '—', price: t?.price ?? 0 };
}

export { PatientDashboard } from './PatientHome';

function AppointmentRow({ a }: { a: Appointment }) {
  const { state, commit } = useDemoStore();
  const { setNotice } = useNotice();
  const patient = usePatient();
  const meta = useApptMeta(state, a);
  const [showCancel, setShowCancel] = useState(false);
  const [showResched, setShowResched] = useState(false);
  const [date, setDate] = useState(a.date);
  const [time, setTime] = useState(a.time);
  const [certLoading, setCertLoading] = useState(false);
  const clinic = state.clinics.find((c) => c.id === a.clinicId);
  const settings = settingsFor(state, a.tenantId);

  async function downloadJustificante() {
    if (!a.attendanceConfirmed || !clinic) {
      setNotice({ type: 'error', message: 'El justificante estará disponible cuando la clínica confirme tu asistencia.' });
      return;
    }
    setCertLoading(true);
    try {
      const { generateAppointmentCertificatePdf, downloadCertificateBlob } = await import(
        '@/lib/pdfAppointmentCertificate'
      );
      const p = state.patients.find((x) => x.id === patient.id) ?? patient;
      const { fileRef, fileName } = await generateAppointmentCertificatePdf(a, p, clinic, settings);
      downloadCertificateBlob(fileRef, fileName);
      setNotice({ type: 'ok', message: 'Justificante descargado (sin motivo de consulta).' });
    } catch {
      setNotice({ type: 'error', message: 'No se pudo generar el justificante.' });
    } finally {
      setCertLoading(false);
    }
  }

  return (
    <article className="data-row appt-row">
      <div className="data-row__main">
        <p className="data-row__title">{meta.treatment}</p>
        <p className="data-row__meta">{meta.dentist} · {meta.clinic}</p>
        <p className="data-row__meta">{fmtDateTime(a.date, a.time)} · {money(meta.price)}</p>
        {a.attendanceConfirmed ? (
          <p className="data-row__meta text-teal-700">Asistencia confirmada por la clínica</p>
        ) : null}
      </div>
      <div className="data-row__aside">
        <Badge status={a.status} label={statusLabel(a.status)} />
      {a.attendanceConfirmed ? (
        <Button
          tone="secondary"
          className="!py-2 !text-xs"
          disabled={certLoading}
          onClick={() => void downloadJustificante()}
        >
          {certLoading ? 'Generando…' : 'Justificante de asistencia'}
        </Button>
      ) : null}
      {isActiveStatus(a.status) ? (
        <div className="flex flex-wrap gap-2">
          <Button tone="secondary" className="!py-2 !text-xs" onClick={() => setShowCancel(true)}>Cancelar</Button>
          <Button className="!py-2 !text-xs" onClick={() => setShowResched(true)}>Reprogramar</Button>
        </div>
      ) : null}
      </div>
      <ConfirmModal open={showCancel} title="Cancelar cita" message="¿Seguro que deseas cancelar esta cita?" confirmLabel="Sí, cancelar"
        onConfirm={() => { commit(updateAppointmentStatus(state, a.id, 'cancelada')); setNotice({ type: 'ok', message: 'Cita cancelada.' }); }}
        onClose={() => setShowCancel(false)} />
      <ConfirmModal open={showResched} title="Reprogramar cita" message="Indica nueva fecha y hora en el formulario al cerrar." confirmLabel="Guardar"
        onConfirm={() => {
          if (isClinicSlotTaken(state, { clinicId: a.clinicId, date, time, excludeId: a.id })) {
            setNotice({ type: 'error', message: 'Horario no disponible.' });
            return;
          }
          commit(rescheduleAppointment(state, a.id, date, time));
          setNotice({ type: 'ok', message: 'Cita reprogramada.' });
        }}
        onClose={() => setShowResched(false)} />
      {showResched ? (
        <div className="col-span-full grid gap-2 sm:grid-cols-2">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
      ) : null}
    </article>
  );
}

export function PatientAppointments() {
  const { state } = useDemoStore();
  const patient = usePatient();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<string>('todos');
  const list = filterAppointments(state, state.appointments.filter((a) => a.patientId === patient.id), { q, status });

  return (
    <div className="space-y-4">
      <PageHeader title="Mis citas" subtitle="CIT-XXXX · cancelar, reprogramar o reservar de nuevo" />
      <SearchInput value={q} onChange={setQ} placeholder="Buscar por fecha o estado…" />
      <FilterTabs
        value={status as 'todos'}
        onChange={setStatus}
        options={[
          { id: 'todos', label: 'Todas' },
          { id: 'pendiente', label: 'Pendientes' },
          { id: 'confirmada', label: 'Confirmadas' },
          { id: 'completada', label: 'Completadas' },
          { id: 'cancelada', label: 'Canceladas' }
        ]}
      />
      <div className="table-cards">
        {list.map((a) => <AppointmentRow key={a.id} a={a} />)}
      </div>
      {!list.length ? <Empty title="Sin citas" text="No hay resultados con ese filtro." /> : null}
    </div>
  );
}

export function PatientHistory() {
  const { state } = useDemoStore();
  const patient = usePatient();
  const done = state.appointments.filter((a) => a.patientId === patient.id && ['completada', 'cancelada', 'no_asistio'].includes(a.status));

  return (
    <Card title="Historial de visitas">
      <div className="table-cards">
        {done.map((a) => {
          const meta = useApptMeta(state, a);
          return (
            <div key={a.id} className="table-cards__row">
              <div>
                <p className="font-bold">{meta.treatment}</p>
                <p className="text-sm text-slate-600">{meta.dentist} · {fmtDateTime(a.date, a.time)}</p>
                <Badge status={a.status} label={statusLabel(a.status)} />
              </div>
              <a href={`/paciente/reservar`}><Button tone="secondary" className="!text-xs">Reservar de nuevo</Button></a>
            </div>
          );
        })}
      </div>
      {!done.length ? <Empty title="Sin historial" text="Las visitas cerradas aparecerán aquí." /> : null}
    </Card>
  );
}

export function PatientProfile() {
  const { state, commit } = useDemoStore();
  const base = usePatient();
  const { setNotice } = useNotice();
  const [form, setForm] = useState<Patient>(base);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function save(e: React.FormEvent) {
    e.preventDefault();
    const e1 = required(form.fullName, 'Nombre') || email(form.email) || phone(form.phone);
    const map: Record<string, string> = {};
    if (e1) map.general = e1;
    setErrors(map);
    if (e1) return;
    commit(savePatient(state, form));
    setNotice({ type: 'ok', message: 'Perfil guardado correctamente.' });
  }

  const channels: Array<'email' | 'whatsapp' | 'sms'> = ['email', 'whatsapp', 'sms'];

  return (
    <div className="space-y-4">
      <PageHeader title="Mi perfil" subtitle="Datos personales y preferencias" />
      <Card title="Datos y preferencias">
      <form className="grid gap-4 md:grid-cols-2" onSubmit={save}>
        {errors.general ? <p className="md:col-span-2 text-sm font-bold text-rose-600">{errors.general}</p> : null}
        <Field label="Nombre"><Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></Field>
        <div className="md:col-span-2">
          <PatientIdentity patient={form} size="sm" />
        </div>
        <Field label="DNI"><Input value={form.dni ?? ''} onChange={(e) => setForm({ ...form, dni: e.target.value })} /></Field>
        <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
        <Field label="Teléfono"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
        <Field label="Fecha de nacimiento"><Input type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} /></Field>
        <Field label="Clínica preferida">
          <Select value={form.preferredClinicId} onChange={(e) => setForm({ ...form, preferredClinicId: e.target.value })}>
            {state.clinics.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
        <Field label="Contacto de emergencia"><Input value={form.emergencyContactName} onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })} /></Field>
        <Field label="Teléfono emergencia"><Input value={form.emergencyContactPhone} onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })} /></Field>
        <Field label="Alergias"><Input value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} /></Field>
        <Field label="Medicación"><Input value={form.medication} onChange={(e) => setForm({ ...form, medication: e.target.value })} /></Field>
        <div className="md:col-span-2">
          <p className="mb-2 text-sm font-bold text-slate-700">Recordatorios</p>
          <div className="flex flex-wrap gap-3">
            {channels.map((ch) => (
              <label key={ch} className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={(form.reminderChannels ?? []).includes(ch)} onChange={(e) => {
                  const channels = form.reminderChannels ?? [];
                  setForm({
                    ...form,
                    reminderChannels: e.target.checked
                      ? [...channels, ch]
                      : channels.filter((c) => c !== ch)
                  });
                }} />
                {ch}
              </label>
            ))}
          </div>
        </div>
        <Field label="Notas"><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
        <Button type="submit">Guardar cambios</Button>
      </form>
    </Card>
      <PatientConsents compact />
    </div>
  );
}

export function PatientMessages() {
  const { state, commit } = useDemoStore();
  const patient = usePatient();
  const [filter, setFilter] = useState<'todos' | 'recordatorio' | 'confirmacion' | 'clinica'>('todos');
  const contexto =
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('contexto') : null;
  const list = state.messages.filter((m) => m.patientId === patient.id && (filter === 'todos' || m.type === filter));

  return (
    <div className="space-y-4">
      {contexto ? (
        <div className="banner-alert flex flex-wrap items-center justify-between gap-2">
          <span>{contexto}</span>
          <a href="/paciente/informes" className="text-xs font-bold text-teal-800 underline">
            Volver a informes
          </a>
        </div>
      ) : null}
      <FilterTabs value={filter} onChange={setFilter} options={[
        { id: 'todos', label: 'Todos' },
        { id: 'recordatorio', label: 'Recordatorios' },
        { id: 'confirmacion', label: 'Confirmaciones' },
        { id: 'clinica', label: 'Clínica' }
      ]} />
      <Card title="Bandeja">
        <ul className="space-y-3">
          {list.map((m) => (
            <li key={m.id} className={`rounded-2xl p-4 ring-1 ${m.read ? 'bg-white ring-slate-100' : 'bg-dental-50 ring-dental-100'}`}>
              <div className="flex justify-between gap-2">
                <p className="font-bold">{m.subject}</p>
                {!m.read ? (
                  <Button tone="ghost" className="!py-1 !text-xs" onClick={() => commit({ ...state, messages: state.messages.map((x) => x.id === m.id ? { ...x, read: true } : x) })}>Marcar leído</Button>
                ) : null}
              </div>
              <p className="mt-2 text-sm text-slate-600">{m.body}</p>
            </li>
          ))}
        </ul>
        {!list.length ? <Empty title="Sin mensajes" text="No hay mensajes en esta categoría." /> : null}
      </Card>
    </div>
  );
}

export function PatientHelp() {
  return <HelpEmbedded audience="patient" />;
}

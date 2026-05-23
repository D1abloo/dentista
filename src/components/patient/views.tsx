import { useState } from 'react';
import {
  filterAppointments,
  isActiveStatus,
  isClinicSlotTaken
} from '@/lib/appointments';
import {
  rescheduleAppointment,
  settingsFor,
  updateAppointmentStatus
} from '@/lib/demoStore';
import { fmtDate, fmtDateTime, money, statusLabel } from '@/lib/format';
import { HelpEmbedded } from '@/components/help/HelpEmbedded';
import { PatientConsentsCompact } from './consents';
export { PatientConsents } from './PatientConsents';
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
export { PatientHistory } from './PatientHistory';
export { PatientReports } from './PatientReports';
export { PatientDocuments } from './PatientDocuments';
export { PatientInvoices } from './PatientInvoices';
export { PatientPayments } from './PatientPayments';
export { PatientMessages } from './PatientMessages';
export { PatientProfile } from './PatientProfile';
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


export function PatientHelp() {
  return <HelpEmbedded audience="patient" />;
}

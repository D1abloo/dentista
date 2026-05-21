import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, Lock } from 'lucide-react';
import { dentistsForClinic, getPrimaryClinic } from '@/lib/clinic';
import { isClientDemoMode } from '@/lib/appMode';
import { appointmentsInRange, monthPrefix, weekRange } from '@/lib/appointments';
import { addBlockedSlot, removeBlockedSlot, tryCreateAppointment, updateAppointmentStatus } from '@/lib/demoStore';
import { fmtDate, fmtDateTime, statusLabel, todayIso } from '@/lib/format';
import { patientName } from '@/lib/selectors';
import { required } from '@/lib/validation';
import { createAppointmentLive, patchAppointmentLive } from '@/lib/clinicApi';
import { useDemoStore } from '@/hooks/useDemoStore';
import { useNotice } from '@/hooks/useNotice';
import { useStaffContext } from '@/hooks/useStaffContext';
import { useTenant } from '@/hooks/useTenant';
import type { Appointment, AppointmentStatus } from '@/types/demo';
import { Badge, Button, Empty, Field, Input, Select } from '@/components/ui';
import { IdBadge } from '@/components/ui/IdBadge';
import { PatientLookup } from './PatientLookup';

function AgendaRow({ a, onAction }: { a: Appointment; onAction: (m: string) => void }) {
  const { state, commit, refresh } = useDemoStore();
  const { setNotice } = useNotice();
  const setStatus = async (status: AppointmentStatus) => {
    commit(updateAppointmentStatus(state, a.id, status));
    if (!isClientDemoMode()) {
      const live = await patchAppointmentLive({
        clinicId: a.clinicId,
        appointmentId: a.id,
        status,
        date: a.date,
        time: a.time
      });
      if (!live.ok) {
        setNotice({ type: 'error', message: live.message });
        return;
      }
      await refresh();
    }
    onAction(`Cita ${statusLabel(status).toLowerCase()}.`);
  };
  const patient = state.patients.find((p) => p.id === a.patientId);
  return (
    <article className="agenda-appointment">
      <div className="agenda-appointment__main">
        <p className="agenda-appointment__patient">
          {patient?.nhc ? <span className="agenda-appointment__nhc">NHC {patient.nhc}</span> : null}
          {patientName(state, a.patientId)}
        </p>
        <p className="agenda-appointment__time">{fmtDateTime(a.date, a.time)}</p>
        <IdBadge id={a.id} kind="cita" />
      </div>
      <Badge status={a.status} label={statusLabel(a.status)} />
      <div className="agenda-appointment__actions">
        <Button tone="ghost" className="!py-1 !text-xs" onClick={() => void setStatus('confirmada')}>
          Confirmar
        </Button>
        <Button tone="ghost" className="!py-1 !text-xs" onClick={() => void setStatus('completada')}>
          Completar
        </Button>
        <Button tone="ghost" className="!py-1 !text-xs" onClick={() => void setStatus('cancelada')}>
          Cancelar
        </Button>
      </div>
    </article>
  );
}

const MODE_LABEL = { dia: 'del día', semana: 'de la semana', mes: 'del mes' } as const;

export function AdminAgenda() {
  const { state, commit, refresh } = useDemoStore();
  const scope = useTenant();
  const { setNotice } = useNotice();
  const { staff, loading: staffLoading } = useStaffContext();
  const [mode, setMode] = useState<'dia' | 'semana' | 'mes'>('dia');
  const [date, setDate] = useState(todayIso());
  const primaryClinic = getPrimaryClinic(state, scope.tenantId);
  const [clinicId, setClinicId] = useState(primaryClinic.id);
  const [dentistId, setDentistId] = useState('');
  const ownAgenda = staff?.agendaScope === 'own' && Boolean(staff.dentistId);
  const [blockTime, setBlockTime] = useState('13:00');
  const [blockReason, setBlockReason] = useState('');
  const [bookPatientId, setBookPatientId] = useState('');
  const [bookTime, setBookTime] = useState('10:00');
  const [bookTreatmentId, setBookTreatmentId] = useState(scope.treatments[0]?.id ?? '');

  useEffect(() => {
    if (!staffLoading && ownAgenda && staff?.dentistId) setDentistId(staff.dentistId);
  }, [staffLoading, ownAgenda, staff?.dentistId]);

  const filtered = useMemo(() => {
    let list = scope.appointments.filter((a) => a.clinicId === clinicId);
    if (dentistId) list = list.filter((a) => a.dentistId === dentistId);
    if (mode === 'dia') return list.filter((a) => a.date === date);
    if (mode === 'semana') {
      const { from, to } = weekRange(date);
      return appointmentsInRange(list, from, to);
    }
    return list.filter((a) => a.date.startsWith(monthPrefix(date)));
  }, [scope.appointments, mode, date, clinicId, dentistId]);

  const blockedForDay = scope.blockedSlots.filter((b) => b.clinicId === clinicId && b.date === date);

  async function createAppointment() {
    const err =
      required(bookPatientId, 'Paciente') ||
      required(bookTime, 'Hora') ||
      required(bookTreatmentId, 'Tratamiento');
    if (err) {
      setNotice({ type: 'error', message: err });
      return;
    }
    const patient = state.patients.find((p) => p.id === bookPatientId);
    const activeDentist = dentistId || scope.dentists[0]?.id;
    if (!activeDentist) {
      setNotice({ type: 'error', message: 'Selecciona un dentista.' });
      return;
    }
    if (!isClientDemoMode()) {
      const live = await createAppointmentLive({
        clinicId,
        patientId: bookPatientId,
        patientName: patient?.fullName ?? 'Paciente',
        patientEmail: patient?.email,
        patientPhone: patient?.phone,
        dentistId: activeDentist,
        treatmentId: bookTreatmentId,
        roomName: 'Gabinete 1',
        date,
        time: bookTime
      });
      if (!live.ok) {
        setNotice({ type: 'error', message: live.message });
        return;
      }
      await refresh();
      setNotice({ type: 'ok', message: 'Cita creada. Visible en el PdP del paciente.' });
      return;
    }
    const result = tryCreateAppointment(state, {
      patientId: bookPatientId,
      dentistId: activeDentist,
      clinicId,
      cabinetId: 'g-1',
      treatmentId: bookTreatmentId,
      date,
      time: bookTime,
      notes: '',
      status: 'pendiente'
    });
    if (!result.ok) {
      setNotice({ type: 'error', message: result.message ?? 'Horario ocupado.' });
      return;
    }
    commit(result.state);
    setNotice({ type: 'ok', message: 'Cita creada. Visible en el PdP del paciente.' });
  }

  return (
    <div className="agenda-page">
      <header className="agenda-toolbar">
        <div className="agenda-toolbar__modes">
          {(['dia', 'semana', 'mes'] as const).map((m) => (
            <button
              key={m}
              type="button"
              className={`agenda-toolbar__mode ${mode === m ? 'agenda-toolbar__mode--active' : ''}`}
              onClick={() => setMode(m)}
            >
              {m === 'dia' ? 'Día' : m === 'semana' ? 'Semana' : 'Mes'}
            </button>
          ))}
        </div>
        <Input type="date" className="agenda-toolbar__date field-control" value={date} onChange={(e) => setDate(e.target.value)} />
        <Select className="agenda-toolbar__select field-control" value={clinicId} onChange={(e) => setClinicId(e.target.value)}>
          {scope.clinics.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select
          className="agenda-toolbar__select field-control"
          value={dentistId}
          disabled={ownAgenda}
          onChange={(e) => setDentistId(e.target.value)}
        >
          {ownAgenda ? (
            <option value={staff?.dentistId ?? ''}>Mi agenda</option>
          ) : (
            <>
              <option value="">Todos los dentistas</option>
              {dentistsForClinic(state, clinicId).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.fullName}
                </option>
              ))}
            </>
          )}
        </Select>
      </header>

      <div className="agenda-layout">
        <aside className="agenda-sidebar">
          <section className="agenda-panel agenda-panel--primary">
            <header className="agenda-panel__head">
              <CalendarClock className="h-5 w-5" aria-hidden />
              <div>
                <h2 className="agenda-panel__title">Nueva cita</h2>
                <p className="agenda-panel__sub">Busca por número NHC. La cita se publica en el portal del paciente.</p>
              </div>
            </header>
            <PatientLookup
              state={state}
              patientId={bookPatientId}
              onPatientId={setBookPatientId}
              label="Número NHC"
              nhcPrimary
            />
            <div className="agenda-panel__fields">
              <Field label="Hora">
                <Input type="time" value={bookTime} onChange={(e) => setBookTime(e.target.value)} />
              </Field>
              <Field label="Tratamiento">
                <Select value={bookTreatmentId} onChange={(e) => setBookTreatmentId(e.target.value)}>
                  {scope.treatments.map((tr) => (
                    <option key={tr.id} value={tr.id}>
                      {tr.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Button className="agenda-panel__cta" onClick={() => void createAppointment()}>
              Crear cita en agenda
            </Button>
          </section>

          <section className="agenda-panel agenda-panel--secondary">
            <header className="agenda-panel__head agenda-panel__head--compact">
              <Lock className="h-4 w-4" aria-hidden />
              <div>
                <h2 className="agenda-panel__title">Bloquear horario</h2>
                <p className="agenda-panel__sub">Marca huecos no disponibles en la agenda.</p>
              </div>
            </header>
            <div className="agenda-panel__fields agenda-panel__fields--inline">
              <Field label="Hora">
                <Input type="time" value={blockTime} onChange={(e) => setBlockTime(e.target.value)} />
              </Field>
              <Field label="Motivo">
                <Input value={blockReason} onChange={(e) => setBlockReason(e.target.value)} placeholder="Ej. Comida" />
              </Field>
            </div>
            <Button
              tone="secondary"
              className="w-full"
              onClick={() => {
                if (!blockReason.trim()) {
                  setNotice({ type: 'error', message: 'Indica un motivo.' });
                  return;
                }
                commit(
                  addBlockedSlot(state, {
                    clinicId,
                    dentistId: dentistId || (scope.dentists[0]?.id ?? ''),
                    cabinetId: 'g-1',
                    date,
                    time: blockTime.slice(0, 5),
                    reason: blockReason
                  })
                );
                setBlockReason('');
                setNotice({ type: 'ok', message: 'Horario bloqueado.' });
              }}
            >
              Bloquear franja
            </Button>
            {blockedForDay.length ? (
              <ul className="agenda-blocks">
                {blockedForDay.map((b) => (
                  <li key={b.id} className="agenda-blocks__item">
                    <span>
                      {b.time} — {b.reason}
                    </span>
                    <button type="button" onClick={() => commit(removeBlockedSlot(state, b.id))}>
                      Quitar
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        </aside>

        <section className="agenda-main">
          <header className="agenda-main__head">
            <h2 className="agenda-main__title">Citas {MODE_LABEL[mode]}</h2>
            <span className="agenda-main__count">{filtered.length}</span>
          </header>
          <div className="agenda-main__body">
            {filtered.length ? (
              filtered.map((a) => (
                <AgendaRow key={a.id} a={a} onAction={(msg) => setNotice({ type: 'ok', message: msg })} />
              ))
            ) : (
              <Empty title="Sin citas" text="No hay citas en este periodo. Crea una desde el panel izquierdo." />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

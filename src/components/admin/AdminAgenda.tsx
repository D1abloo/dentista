import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  Calendar,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Lock,
  MoreHorizontal,
  Plus,
  Search,
  Users
} from 'lucide-react';
import { dentistsForClinic, getPrimaryClinic } from '@/lib/clinic';
import { isClientDemoMode } from '@/lib/appMode';
import { appointmentsInRange, monthPrefix, weekRange } from '@/lib/appointments';
import { addBlockedSlot, removeBlockedSlot, rescheduleAppointment } from '@/lib/demoStore';
import { createAdminAppointment, updateAdminAppointmentStatus } from '@/lib/adminAppointments';
import { createScheduleBlockLive, deleteScheduleBlockLive } from '@/lib/clinicApi';
import { consumeBookingPatientPrefill } from '@/lib/patientAdmin';
import { patientsForClinic } from '@/lib/tenant';
import { fmtDate, statusLabel, todayIso } from '@/lib/format';
import { patientName } from '@/lib/selectors';
import { required } from '@/lib/validation';
import { useCountUp } from '@/hooks/useCountUp';
import { useDemoStore } from '@/hooks/useDemoStore';
import { useNotice } from '@/hooks/useNotice';
import { useStaffContext } from '@/hooks/useStaffContext';
import { useTenant } from '@/hooks/useTenant';
import { useLogout } from '@/components/auth/RoleGate';
import type { Appointment, AppointmentStatus, BlockedSlot } from '@/types/demo';
import { Button, Field, Input, Select, Textarea } from '@/components/ui';
import { PatientLookup } from './PatientLookup';

const TIMELINE_HOURS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'] as const;
const DURATIONS = [15, 30, 45, 60] as const;

function shiftDate(iso: string, days: number) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function hourOf(time: string) {
  return time.slice(0, 2);
}

function appointmentAtHour(appts: Appointment[], hour: string) {
  const h = hour.slice(0, 2);
  return appts.find((a) => hourOf(a.time) === h);
}

function blockAtHour(blocks: BlockedSlot[], hour: string, dentistId: string) {
  const h = hour.slice(0, 2);
  return blocks.find((b) => hourOf(b.time) === h && (!dentistId || b.dentistId === dentistId));
}

function nextFreeHour(appts: Appointment[], blocks: BlockedSlot[], dentistId: string) {
  for (const hour of TIMELINE_HOURS) {
    const h = hour.slice(0, 2);
    const taken = appts.some((a) => hourOf(a.time) === h);
    const blocked = blocks.some((b) => hourOf(b.time) === h && (!dentistId || b.dentistId === dentistId));
    if (!taken && !blocked) return hour;
  }
  return '—';
}

function statusPillClass(status: AppointmentStatus) {
  if (status === 'confirmada' || status === 'completada') return 'agd-pill agd-pill--ok';
  if (status === 'pendiente') return 'agd-pill agd-pill--warn';
  return 'agd-pill agd-pill--muted';
}

function AgdKpi({
  label,
  value,
  icon: Icon,
  tone,
  delay = 0,
  slotLabel
}: {
  label: string;
  value: number | string;
  icon: typeof Calendar;
  tone: 'teal' | 'amber' | 'green' | 'blue' | 'purple';
  delay?: number;
  slotLabel?: boolean;
}) {
  const num = typeof value === 'number' ? value : 0;
  const animated = useCountUp(num, 700);
  const display = typeof value === 'string' ? value : animated;
  return (
    <div className={`agd-kpi${slotLabel ? ' agd-kpi--slot' : ''}`} style={{ animationDelay: `${delay}ms` }}>
      <span className={`agd-kpi__icon agd-kpi__icon--${tone}`}>
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div>
        <p className="agd-kpi__label">{label}</p>
        <p className="agd-kpi__value">{display}</p>
      </div>
    </div>
  );
}

function AppointmentMenu({
  appointment,
  onReschedule,
  onCancel,
  onConfirm
}: {
  appointment: Appointment;
  onReschedule: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function close(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div className="agd-menu-wrap" ref={ref}>
      <button type="button" className="agd-menu-btn" aria-label="Acciones" onClick={() => setOpen((v) => !v)}>
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open ? (
        <ul className="agd-menu" role="menu">
          {appointment.status === 'pendiente' ? (
            <li>
              <button type="button" role="menuitem" onClick={() => { onConfirm(); setOpen(false); }}>
                Confirmar
              </button>
            </li>
          ) : null}
          <li>
            <button type="button" role="menuitem" onClick={() => { onReschedule(); setOpen(false); }}>
              Reprogramar
            </button>
          </li>
          <li>
            <button type="button" role="menuitem" onClick={() => { onCancel(); setOpen(false); }}>
              Cancelar
            </button>
          </li>
        </ul>
      ) : null}
    </div>
  );
}

export function AdminAgenda() {
  const { state, commit, refresh, dataSource } = useDemoStore();
  const scope = useTenant();
  const { setNotice } = useNotice();
  const { staff, loading: staffLoading } = useStaffContext();
  const logout = useLogout();
  const loading = dataSource === 'loading';
  const formRef = useRef<HTMLDivElement>(null);

  const [mode, setMode] = useState<'dia' | 'semana' | 'mes'>('dia');
  const [date, setDate] = useState(todayIso());
  const primaryClinic = getPrimaryClinic(state, scope.tenantId);
  const [clinicId, setClinicId] = useState(primaryClinic.id);
  const [dentistId, setDentistId] = useState('');
  const ownAgenda = staff?.agendaScope === 'own' && Boolean(staff.dentistId);
  const [timelineView, setTimelineView] = useState<'hora' | 'dentista'>('hora');
  const [leftTab, setLeftTab] = useState<'book' | 'block'>('book');
  const [clinicOpen, setClinicOpen] = useState(false);
  const [dentistOpen, setDentistOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [userLabel, setUserLabel] = useState('Usuario conectado');
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('10:00');

  const [bookPatientId, setBookPatientId] = useState('');
  const [bookTime, setBookTime] = useState('10:00');
  const [bookDuration, setBookDuration] = useState<number>(30);
  const [bookDentistId, setBookDentistId] = useState('');
  const [bookTreatmentId, setBookTreatmentId] = useState(scope.treatments[0]?.id ?? '');
  const [bookNotes, setBookNotes] = useState('');
  const [blockTime, setBlockTime] = useState('13:00');
  const [blockReason, setBlockReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const clinicRef = useRef<HTMLDivElement>(null);
  const dentistRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!staffLoading && ownAgenda && staff?.dentistId) setDentistId(staff.dentistId);
  }, [staffLoading, ownAgenda, staff?.dentistId]);

  useEffect(() => {
    const pre = consumeBookingPatientPrefill();
    if (pre) {
      setBookPatientId(pre);
      setLeftTab('book');
    }
  }, []);

  useEffect(() => {
    void fetch('/api/auth/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((j: { data?: { name?: string; email?: string } }) => {
        if (j.data?.name) setUserLabel(j.data.name);
        else if (j.data?.email) setUserLabel(j.data.email);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (!clinicRef.current?.contains(t)) setClinicOpen(false);
      if (!dentistRef.current?.contains(t)) setDentistOpen(false);
      if (!profileRef.current?.contains(t)) setProfileOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const activeClinic = scope.clinics.find((c) => c.id === clinicId) ?? primaryClinic;
  const clinicDentists = dentistsForClinic(state, clinicId);
  const clinicPatients = useMemo(() => patientsForClinic(state, clinicId), [state, clinicId]);

  const dayAppts = useMemo(() => {
    let list = scope.appointments.filter((a) => a.clinicId === clinicId && a.date === date);
    if (dentistId) list = list.filter((a) => a.dentistId === dentistId);
    return list.filter((a) => a.status !== 'cancelada');
  }, [scope.appointments, clinicId, date, dentistId]);

  const blockedForDay = useMemo(() => {
    let list = scope.blockedSlots.filter((b) => b.clinicId === clinicId && b.date === date);
    if (dentistId) list = list.filter((b) => b.dentistId === dentistId);
    return list;
  }, [scope.blockedSlots, clinicId, date, dentistId]);

  const rangeAppts = useMemo(() => {
    let list = scope.appointments.filter((a) => a.clinicId === clinicId);
    if (dentistId) list = list.filter((a) => a.dentistId === dentistId);
    if (mode === 'semana') {
      const { from, to } = weekRange(date);
      return appointmentsInRange(list, from, to).filter((a) => a.status !== 'cancelada');
    }
    if (mode === 'mes') {
      return list.filter((a) => a.date.startsWith(monthPrefix(date)) && a.status !== 'cancelada');
    }
    return dayAppts;
  }, [scope.appointments, clinicId, dentistId, mode, date, dayAppts]);

  const kpi = useMemo(() => {
    const citas = dayAppts.length;
    const pendientes = dayAppts.filter((a) => a.status === 'pendiente').length;
    const confirmadas = dayAppts.filter((a) => a.status === 'confirmada' || a.status === 'completada').length;
    const pacientes = new Set(dayAppts.map((a) => a.patientId)).size;
    const bloqueos = blockedForDay.length;
    const libre = nextFreeHour(dayAppts, blockedForDay, dentistId);
    return { citas, pendientes, confirmadas, pacientes, bloqueos, libre };
  }, [dayAppts, blockedForDay, dentistId]);

  const distribution = useMemo(() => {
    const total = Math.max(dayAppts.length + blockedForDay.length, 1);
    const confirmadas = dayAppts.filter((a) => a.status === 'confirmada' || a.status === 'completada').length;
    const pendientes = dayAppts.filter((a) => a.status === 'pendiente').length;
    const canceladas = scope.appointments.filter(
      (a) => a.clinicId === clinicId && a.date === date && a.status === 'cancelada'
    ).length;
    const bloqueos = blockedForDay.length;
    const pct = (n: number) => Math.round((n / total) * 100);
    const cPct = pct(confirmadas);
    const pPct = pct(pendientes);
    const xPct = pct(canceladas);
    const bPct = pct(bloqueos);
    const rest = Math.max(0, 100 - cPct - pPct - xPct - bPct);
    const gradient =
      total === 1 && !dayAppts.length && !blockedForDay.length
        ? '#e2e8f0'
        : `conic-gradient(
          #16a34a 0 ${cPct}%,
          #f59e0b ${cPct}% ${cPct + pPct}%,
          #ef4444 ${cPct + pPct}% ${cPct + pPct + xPct}%,
          #8b5cf6 ${cPct + pPct + xPct}% ${cPct + pPct + xPct + bPct}%,
          #e2e8f0 ${cPct + pPct + xPct + bPct}% 100%
        )`;
    return { confirmadas, pendientes, canceladas, bloqueos, cPct, pPct, xPct, bPct, gradient, rest };
  }, [dayAppts, blockedForDay, scope.appointments, clinicId, date]);

  const initials = userLabel
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  function focusForm(tab: 'book' | 'block' = 'book') {
    setLeftTab(tab);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function pickSlot(hour: string) {
    setBookTime(hour);
    setLeftTab('book');
    focusForm('book');
  }

  async function setStatus(appt: Appointment, status: AppointmentStatus, patch?: { date?: string; time?: string }) {
    const result = await updateAdminAppointmentStatus(state, appt, status, patch);
    if (!result.ok) {
      setNotice({ type: 'error', message: result.message });
      return;
    }
    if (result.demoState) commit(result.demoState);
    else await refresh();
    setNotice({ type: 'ok', message: `Cita ${statusLabel(status).toLowerCase()}.` });
  }

  async function submitReschedule() {
    if (!rescheduleTarget) return;
    const err = required(rescheduleDate, 'Fecha') || required(rescheduleTime, 'Hora');
    if (err) {
      setNotice({ type: 'error', message: err });
      return;
    }
    if (isClientDemoMode()) {
      commit(rescheduleAppointment(state, rescheduleTarget.id, rescheduleDate, rescheduleTime));
    } else {
      const result = await updateAdminAppointmentStatus(state, rescheduleTarget, 'reprogramada', {
        date: rescheduleDate,
        time: rescheduleTime
      });
      if (!result.ok) {
        setNotice({ type: 'error', message: result.message });
        return;
      }
      await refresh();
    }
    setNotice({ type: 'ok', message: 'Cita reprogramada.' });
    setRescheduleTarget(null);
  }

  async function createAppointment() {
    const err =
      required(bookPatientId, 'Paciente') ||
      required(bookTime, 'Hora') ||
      required(bookTreatmentId, 'Tratamiento');
    if (err) {
      setNotice({ type: 'error', message: err });
      return;
    }
    const activeDentist = bookDentistId || dentistId || clinicDentists[0]?.id;
    if (!activeDentist) {
      setNotice({ type: 'error', message: 'Selecciona un dentista.' });
      return;
    }
    const patient = clinicPatients.find((p) => p.id === bookPatientId) ?? state.patients.find((p) => p.id === bookPatientId);
    if (!patient) {
      setNotice({ type: 'error', message: 'Selecciona un paciente registrado en la clínica.' });
      return;
    }
    setSubmitting(true);
    try {
      const result = await createAdminAppointment({
        state,
        clinicId,
        cabinetId: activeClinic.cabinets[0]?.id ?? 'g-1',
        patientId: bookPatientId,
        patientName: patient.fullName,
        patientEmail: patient.email,
        patientPhone: patient.phone,
        dentistId: activeDentist,
        treatmentId: bookTreatmentId,
        roomName: activeClinic.cabinets[0]?.name ?? 'Gabinete 1',
        date,
        time: bookTime,
        notes: bookNotes,
        status: 'pendiente'
      });
      if (!result.ok) {
        setNotice({ type: 'error', message: result.message });
        return;
      }
      if (result.demoState) commit(result.demoState);
      else await refresh();
      setNotice({ type: 'ok', message: 'Cita creada. Visible en el portal del paciente.' });
      setBookNotes('');
    } finally {
      setSubmitting(false);
    }
  }

  async function submitBlock() {
    if (!blockReason.trim()) {
      setNotice({ type: 'error', message: 'Indica un motivo.' });
      return;
    }
    const dId = dentistId || bookDentistId || (clinicDentists[0]?.id ?? '');
    if (!dId) {
      setNotice({ type: 'error', message: 'Selecciona un dentista.' });
      return;
    }
    if (!isClientDemoMode()) {
      const live = await createScheduleBlockLive({
        dentistId: dId,
        date,
        time: blockTime.slice(0, 5),
        reason: blockReason,
        durationMinutes: bookDuration
      });
      if (!live.ok) {
        setNotice({ type: 'error', message: live.message });
        return;
      }
      await refresh();
    } else {
      commit(
        addBlockedSlot(state, {
          clinicId,
          dentistId: dId,
          cabinetId: activeClinic.cabinets[0]?.id ?? 'g-1',
          date,
          time: blockTime.slice(0, 5),
          reason: blockReason
        })
      );
    }
    setBlockReason('');
    setNotice({ type: 'ok', message: 'Horario bloqueado.' });
  }

  async function removeBlock(blockId: string) {
    if (!isClientDemoMode()) {
      const live = await deleteScheduleBlockLive(blockId);
      if (!live.ok) {
        setNotice({ type: 'error', message: live.message });
        return;
      }
      await refresh();
    } else {
      commit(removeBlockedSlot(state, blockId));
    }
    setNotice({ type: 'ok', message: 'Bloqueo eliminado.' });
  }

  const selectedTreatment = scope.treatments.find((t) => t.id === bookTreatmentId);

  return (
    <div className={`agd-module${loading ? ' agd-module--loading' : ''}`}>
      <header className="agd-toolbar">
        <div className="agd-segment" role="tablist" aria-label="Vista de agenda">
          {(['dia', 'semana', 'mes'] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              className={`agd-segment__btn${mode === m ? ' agd-segment__btn--active' : ''}`}
              onClick={() => setMode(m)}
            >
              {m === 'dia' ? 'Día' : m === 'semana' ? 'Semana' : 'Mes'}
            </button>
          ))}
        </div>

        <div className="agd-nav-date">
          <button type="button" className="agd-icon-btn" aria-label="Día anterior" onClick={() => setDate(shiftDate(date, -1))}>
            <ChevronLeft className="h-4 w-4" />
          </button>
          <Input
            type="date"
            className="agd-date-input field-control"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-label="Fecha"
          />
          <button type="button" className="agd-icon-btn" aria-label="Día siguiente" onClick={() => setDate(shiftDate(date, 1))}>
            <ChevronRight className="h-4 w-4" />
          </button>
          <button type="button" className="agd-btn-today" onClick={() => setDate(todayIso())}>
            Hoy
          </button>
        </div>

        <div className={`agd-dropdown${clinicOpen ? ' is-open' : ''}`} ref={clinicRef}>
          <button type="button" className="agd-chip" aria-expanded={clinicOpen} onClick={() => setClinicOpen((v) => !v)}>
            {activeClinic.name}
            <ChevronDown className="h-4 w-4 agd-chip__chev" aria-hidden />
          </button>
          {clinicOpen ? (
            <ul className="agd-dropdown__menu" role="listbox">
              {scope.clinics.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={c.id === clinicId}
                    onClick={() => {
                      setClinicId(c.id);
                      setClinicOpen(false);
                    }}
                  >
                    {c.name}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className={`agd-dropdown${dentistOpen ? ' is-open' : ''}`} ref={dentistRef}>
          <button
            type="button"
            className="agd-chip"
            aria-expanded={dentistOpen}
            disabled={ownAgenda}
            onClick={() => setDentistOpen((v) => !v)}
          >
            {dentistId ? clinicDentists.find((d) => d.id === dentistId)?.fullName ?? 'Dentista' : 'Todos los dentistas'}
            <ChevronDown className="h-4 w-4 agd-chip__chev" aria-hidden />
          </button>
          {dentistOpen && !ownAgenda ? (
            <ul className="agd-dropdown__menu" role="listbox">
              <li>
                <button type="button" role="option" aria-selected={!dentistId} onClick={() => { setDentistId(''); setDentistOpen(false); }}>
                  Todos los dentistas
                </button>
              </li>
              {clinicDentists.map((d) => (
                <li key={d.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={d.id === dentistId}
                    onClick={() => {
                      setDentistId(d.id);
                      setDentistOpen(false);
                    }}
                  >
                    {d.fullName}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <span className="agd-toolbar__spacer" />

        <button type="button" className="agd-btn-primary" onClick={() => focusForm('book')}>
          <Plus className="h-4 w-4" aria-hidden />
          Nueva cita
        </button>

        <a href="/admin/notificaciones" className="agd-bell" aria-label="Notificaciones">
          <Bell className="h-4 w-4" />
          <span className="agd-bell__dot" aria-hidden />
        </a>

        <div className={`agd-dropdown${profileOpen ? ' is-open' : ''}`} ref={profileRef}>
          <button type="button" className="agd-avatar" aria-expanded={profileOpen} onClick={() => setProfileOpen((v) => !v)}>
            <span>{initials || 'EM'}</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-500" aria-hidden />
          </button>
          {profileOpen ? (
            <ul className="agd-dropdown__menu agd-dropdown__menu--right" role="menu">
              <li>
                <span className="block px-2 py-1 text-xs font-bold text-slate-500">{userLabel}</span>
              </li>
              <li>
                <a href="/admin/configuracion" role="menuitem">
                  Mi perfil
                </a>
              </li>
              <li>
                <a href="/ayuda#panel-admin" role="menuitem">
                  Guía de uso
                </a>
              </li>
              <li>
                <button type="button" role="menuitem" onClick={logout}>
                  Cerrar sesión
                </button>
              </li>
            </ul>
          ) : null}
        </div>
      </header>

      <div className="agd-kpis">
        <AgdKpi label="Citas del día" value={kpi.citas} icon={Calendar} tone="teal" delay={0} />
        <AgdKpi label="Pendientes" value={kpi.pendientes} icon={Clock} tone="amber" delay={40} />
        <AgdKpi label="Confirmadas" value={kpi.confirmadas} icon={CheckCircle2} tone="green" delay={80} />
        <AgdKpi label="Pacientes" value={kpi.pacientes} icon={Users} tone="blue" delay={120} />
        <AgdKpi label="Bloqueos" value={kpi.bloqueos} icon={Lock} tone="purple" delay={160} />
        <AgdKpi label="Próximo hueco libre" value={kpi.libre} icon={CalendarClock} tone="green" delay={200} slotLabel />
      </div>

      <div className="agd-layout">
        <div className="agd-form-card" ref={formRef}>
          <div className="agd-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={leftTab === 'book'}
              className={`agd-tabs__btn${leftTab === 'book' ? ' agd-tabs__btn--active' : ''}`}
              onClick={() => setLeftTab('book')}
            >
              Nueva cita
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={leftTab === 'block'}
              className={`agd-tabs__btn${leftTab === 'block' ? ' agd-tabs__btn--active' : ''}`}
              onClick={() => setLeftTab('block')}
            >
              Bloquear horario
            </button>
          </div>

          {leftTab === 'book' ? (
            <div className="agd-form-body">
              <PatientLookup
                state={state}
                patientId={bookPatientId}
                onPatientId={setBookPatientId}
                label="Paciente"
                placeholder="Buscar por NHC, nombre o teléfono…"
                candidates={clinicPatients}
              />
              <p className="text-xs font-semibold text-slate-500">
                La administración puede agendar citas para pacientes ya registrados. Busca por NHC, nombre o teléfono.
              </p>
              <div className="agd-form-row">
                <Field label="Fecha">
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </Field>
                <Field label="Hora">
                  <Input type="time" value={bookTime} onChange={(e) => setBookTime(e.target.value)} />
                </Field>
              </div>
              <div className="agd-form-row">
                <Field label="Duración">
                  <Select value={String(bookDuration)} onChange={(e) => setBookDuration(Number(e.target.value))}>
                    {DURATIONS.map((m) => (
                      <option key={m} value={m}>
                        {m} min
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Dentista">
                  <Select value={bookDentistId} onChange={(e) => setBookDentistId(e.target.value)} disabled={ownAgenda}>
                    <option value="">Todos los dentistas</option>
                    {clinicDentists.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.fullName}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <Field label="Tratamiento">
                <Select value={bookTreatmentId} onChange={(e) => setBookTreatmentId(e.target.value)}>
                  {scope.treatments.map((tr) => (
                    <option key={tr.id} value={tr.id}>
                      {tr.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Observaciones internas">
                <Textarea
                  className="agd-textarea field-control"
                  placeholder="Ej. Detalles adicionales de la cita…"
                  value={bookNotes}
                  onChange={(e) => setBookNotes(e.target.value)}
                />
              </Field>
              <Button className="agd-submit" onClick={() => void createAppointment()} disabled={submitting}>
                {submitting ? 'Guardando…' : 'Crear cita'}
              </Button>
              <p className="agd-helper">
                <Calendar className="h-4 w-4" aria-hidden />
                La cita se publicará automáticamente en el portal del paciente.
                {selectedTreatment ? ` Duración estimada: ${bookDuration || selectedTreatment.durationMinutes} min.` : null}
              </p>
            </div>
          ) : (
            <div className="agd-form-body">
              <div className="agd-form-row">
                <Field label="Fecha">
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </Field>
                <Field label="Hora">
                  <Input type="time" value={blockTime} onChange={(e) => setBlockTime(e.target.value)} />
                </Field>
              </div>
              <Field label="Motivo">
                <Input value={blockReason} onChange={(e) => setBlockReason(e.target.value)} placeholder="Ej. Comida" />
              </Field>
              <Button tone="secondary" className="agd-submit" onClick={submitBlock}>
                Bloquear franja
              </Button>
              {blockedForDay.length ? (
                <ul className="agenda-blocks">
                  {blockedForDay.map((b) => (
                    <li key={b.id} className="agenda-blocks__item">
                      <span>
                        {b.time} — {b.reason}
                      </span>
                      <button type="button" onClick={() => void removeBlock(b.id)}>
                        Quitar
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          )}
        </div>

        <section className="agd-timeline-card">
          <header className="agd-timeline-head">
            <h2>{mode === 'dia' ? 'Agenda del día' : mode === 'semana' ? 'Agenda de la semana' : 'Agenda del mes'}</h2>
            {mode === 'dia' ? (
              <div className="agd-segment" role="tablist" aria-label="Vista timeline">
                <button
                  type="button"
                  role="tab"
                  aria-selected={timelineView === 'hora'}
                  className={`agd-segment__btn${timelineView === 'hora' ? ' agd-segment__btn--active' : ''}`}
                  onClick={() => setTimelineView('hora')}
                >
                  Por hora
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={timelineView === 'dentista'}
                  className={`agd-segment__btn${timelineView === 'dentista' ? ' agd-segment__btn--active' : ''}`}
                  onClick={() => setTimelineView('dentista')}
                >
                  Por dentista
                </button>
              </div>
            ) : null}
          </header>

          <div className="agd-timeline-body">
            {mode !== 'dia' ? (
              <div className="agd-week-list">
                {rangeAppts.length ? (
                  Object.entries(
                    rangeAppts.reduce<Record<string, Appointment[]>>((acc, a) => {
                      (acc[a.date] ??= []).push(a);
                      return acc;
                    }, {})
                  ).map(([d, list]) => (
                    <div key={d} className="agd-week-day">
                      <h4>
                        {fmtDate(d)} · {list.length} cita{list.length === 1 ? '' : 's'}
                      </h4>
                      {list.map((a) => (
                        <p key={a.id} className="text-xs font-semibold text-slate-600">
                          {a.time} — {patientName(state, a.patientId)} ({statusLabel(a.status)})
                        </p>
                      ))}
                    </div>
                  ))
                ) : (
                  <p className="text-sm font-semibold text-slate-500">Sin citas en este periodo.</p>
                )}
              </div>
            ) : timelineView === 'hora' ? (
              <>
                {TIMELINE_HOURS.map((hour, i) => {
                  const appt = appointmentAtHour(dayAppts, hour);
                  const block = blockAtHour(blockedForDay, hour, dentistId);
                  if (appt) {
                    const treatment = scope.treatments.find((t) => t.id === appt.treatmentId)?.name ?? 'Consulta';
                    const dentist = scope.dentists.find((d) => d.id === appt.dentistId)?.fullName ?? 'Profesional';
                    const tone = appt.status === 'pendiente' ? 'warn' : 'ok';
                    return (
                      <div key={hour} className="agd-slot" style={{ animationDelay: `${i * 30}ms` }}>
                        <span className="agd-slot__time">{hour}</span>
                        <div className={`agd-slot__cell agd-appt agd-appt--${tone}`}>
                          <span className="agd-appt__badge">{hour}</span>
                          <div className="agd-appt__main">
                            <strong>{patientName(state, appt.patientId)}</strong>
                            <span>
                              {treatment} · {dentist}
                            </span>
                          </div>
                          <span className={statusPillClass(appt.status)}>{statusLabel(appt.status)}</span>
                          <AppointmentMenu
                            appointment={appt}
                            onConfirm={() => void setStatus(appt, 'confirmada')}
                            onReschedule={() => {
                              setRescheduleTarget(appt);
                              setRescheduleDate(appt.date);
                              setRescheduleTime(appt.time);
                            }}
                            onCancel={() => void setStatus(appt, 'cancelada')}
                          />
                        </div>
                      </div>
                    );
                  }
                  if (block) {
                    return (
                      <div key={hour} className="agd-slot" style={{ animationDelay: `${i * 30}ms` }}>
                        <span className="agd-slot__time">{hour}</span>
                        <div className="agd-slot__cell agd-appt agd-block">
                          <span className="agd-appt__badge">{hour}</span>
                          <div className="agd-appt__main">
                            <strong>Bloqueo: {block.reason}</strong>
                          </div>
                          <span className="agd-pill agd-pill--block">Bloqueado</span>
                          <button
                            type="button"
                            className="agd-menu-btn"
                            aria-label="Quitar bloqueo"
                            onClick={() => void removeBlock(block.id)}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={hour} className="agd-slot agd-slot--free" style={{ animationDelay: `${i * 30}ms` }}>
                      <span className="agd-slot__time">{hour}</span>
                      <button type="button" className="agd-slot__cell" onClick={() => pickSlot(hour)}>
                        Disponible
                      </button>
                    </div>
                  );
                })}
                <p className="agd-dropzone">Haz clic en un horario disponible para crear una cita</p>
              </>
            ) : (
              <div className="agd-dentist-grid">
                {(dentistId ? clinicDentists.filter((d) => d.id === dentistId) : clinicDentists).map((dentist) => {
                  const dAppts = dayAppts.filter((a) => a.dentistId === dentist.id);
                  const dBlocks = blockedForDay.filter((b) => b.dentistId === dentist.id);
                  return (
                    <div key={dentist.id} className="agd-dentist-col">
                      <h3>{dentist.fullName}</h3>
                      {dAppts.length || dBlocks.length ? (
                        <>
                          {dAppts.map((a) => (
                            <p key={a.id} className="mb-1 text-xs font-semibold text-slate-700">
                              {a.time} — {patientName(state, a.patientId)} ({statusLabel(a.status)})
                            </p>
                          ))}
                          {dBlocks.map((b) => (
                            <p key={b.id} className="mb-1 text-xs font-semibold text-violet-700">
                              {b.time} — Bloqueo: {b.reason}
                            </p>
                          ))}
                        </>
                      ) : (
                        <p className="text-xs text-slate-500">Sin citas este día.</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <aside className="agd-aside">
          <div className="agd-summary-card">
            <h3>Resumen del día</h3>
            <ul className="agd-metrics">
              <li>
                <span>Citas</span>
                <strong>{kpi.citas}</strong>
              </li>
              <li>
                <span>Confirmadas</span>
                <strong>{kpi.confirmadas}</strong>
              </li>
              <li>
                <span>Pendientes</span>
                <strong>{kpi.pendientes}</strong>
              </li>
              <li>
                <span>Canceladas</span>
                <strong>{distribution.canceladas}</strong>
              </li>
              <li>
                <span>Bloqueos</span>
                <strong>{kpi.bloqueos}</strong>
              </li>
              <li>
                <span>Pacientes únicos</span>
                <strong>{kpi.pacientes}</strong>
              </li>
            </ul>
          </div>

          <div className="agd-summary-card">
            <h3>Distribución del día</h3>
            <div className="agd-donut" style={{ background: distribution.gradient }} aria-hidden />
            <ul className="agd-legend">
              <li>
                <span className="agd-legend__dot" style={{ background: '#16a34a' }} />
                Confirmadas {distribution.cPct}%
              </li>
              <li>
                <span className="agd-legend__dot" style={{ background: '#f59e0b' }} />
                Pendientes {distribution.pPct}%
              </li>
              <li>
                <span className="agd-legend__dot" style={{ background: '#ef4444' }} />
                Canceladas {distribution.xPct}%
              </li>
              <li>
                <span className="agd-legend__dot" style={{ background: '#8b5cf6' }} />
                Bloqueos {distribution.bPct}%
              </li>
            </ul>
          </div>

          <div className="agd-summary-card">
            <h3>Acciones rápidas</h3>
            <div className="agd-quick-actions">
              <button type="button" className="agd-quick-btn" onClick={() => focusForm('block')}>
                <Lock className="h-4 w-4 text-violet-600" aria-hidden />
                Bloquear franja horaria
              </button>
              <button type="button" className="agd-quick-btn" onClick={() => setMode('semana')}>
                <Calendar className="h-4 w-4 text-teal-600" aria-hidden />
                Ver agenda semanal
              </button>
              <button type="button" className="agd-quick-btn" onClick={() => focusForm('book')}>
                <Search className="h-4 w-4 text-slate-600" aria-hidden />
                Buscar paciente
              </button>
            </div>
          </div>
        </aside>
      </div>

      {rescheduleTarget ? (
        <div className="agd-modal-backdrop" role="presentation" onClick={() => setRescheduleTarget(null)}>
          <div className="agd-modal" role="dialog" aria-labelledby="agd-reschedule-title" onClick={(e) => e.stopPropagation()}>
            <h3 id="agd-reschedule-title">Reprogramar cita</h3>
            <p className="mb-3 text-sm font-semibold text-slate-600">{patientName(state, rescheduleTarget.patientId)}</p>
            <div className="agd-form-row">
              <Field label="Nueva fecha">
                <Input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} />
              </Field>
              <Field label="Nueva hora">
                <Input type="time" value={rescheduleTime} onChange={(e) => setRescheduleTime(e.target.value)} />
              </Field>
            </div>
            <div className="agd-modal__actions">
              <Button tone="ghost" onClick={() => setRescheduleTarget(null)}>
                Cancelar
              </Button>
              <Button onClick={() => void submitReschedule()}>Guardar</Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Calendar,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Lock,
  Plus,
  Search,
  Users
} from 'lucide-react';
import { dentistsForClinic, getPrimaryClinic } from '@/lib/clinic';
import { isClientDemoMode, isClientLiveMode } from '@/lib/appMode';
import { appointmentsInRange, monthPrefix, weekRange } from '@/lib/appointments';
import {
  confirmAppointmentAttendance,
  removeBlockedSlot,
  removeScheduleBlockGroup,
  rescheduleAppointment,
  saveScheduleBlocks
} from '@/lib/demoStore';
import { blockTargetLabel } from '@/lib/agenda/availability';
import { canDeleteScheduleBlock } from '@/lib/agenda/blockPermissions';
import { expandScheduleBlocks, type ScheduleBlockInput } from '@/lib/agenda/scheduleBlockExpand';
import { useActiveClinic } from '@/hooks/useActiveClinic';
import { createAdminAppointment, updateAdminAppointmentStatus } from '@/lib/adminAppointments';
import { AdminNotificationBell } from './AdminNotificationBell';
import { createScheduleBlockLive, deleteScheduleBlockLive } from '@/lib/clinicApi';
import { consumeBookingPatientPrefill } from '@/lib/patientAdmin';
import { patientsForClinic } from '@/lib/tenant';
import { statusLabel, todayIso } from '@/lib/format';
import { patientName } from '@/lib/selectors';
import { required } from '@/lib/validation';
import { useCountUp } from '@/hooks/useCountUp';
import { useDemoStore } from '@/hooks/useDemoStore';
import { useNotice } from '@/hooks/useNotice';
import { useStaffContext } from '@/hooks/useStaffContext';
import { useTenant } from '@/hooks/useTenant';
import { useLogout } from '@/components/auth/RoleGate';
import type { Appointment, AppointmentStatus, BlockedSlot } from '@/types/demo';
import { blockCoversHour, blocksForDay } from '@/lib/agenda/availability';
import { Button, Field, Input } from '@/components/ui';
import { AGENDA_HOURS, AgendaDayCalendar, AgendaWeekMonthCalendar } from './AgendaCalendarViews';
import {
  AgendaApptDetailDrawer,
  AgendaBlockDetailDrawer,
  AgendaBlockDrawer,
  AgendaBookDrawer,
  validateAppointmentSlot
} from './agenda/AgendaDrawers';

const TIMELINE_HOURS = AGENDA_HOURS;
function shiftDate(iso: string, days: number) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function hourOf(time: string) {
  return time.slice(0, 2);
}

function nextFreeHour(appts: Appointment[], blocks: BlockedSlot[], dentistId: string) {
  for (const hour of TIMELINE_HOURS) {
    const h = hour.slice(0, 2);
    const taken = appts.some((a) => hourOf(a.time) === h);
    const blocked = blocks.some((b) => blockCoversHour(b, hour, dentistId || b.dentistId));
    if (!taken && !blocked) return hour;
  }
  return '—';
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

export function AdminAgenda() {
  const { state, commit, refresh, dataSource } = useDemoStore();
  const scope = useTenant();
  const { setNotice } = useNotice();
  const { staff, loading: staffLoading } = useStaffContext();
  const logout = useLogout();
  const loading = dataSource === 'loading';

  const [mode, setMode] = useState<'dia' | 'semana' | 'mes'>('dia');
  const [date, setDate] = useState(todayIso());
  const primaryClinic = getPrimaryClinic(state, scope.tenantId);
  const manageableClinics = useMemo(() => {
    const list = scope.clinics;
    if (staff?.assignedClinicIds?.length) {
      return list.filter((c) => staff.assignedClinicIds.includes(c.id));
    }
    return list;
  }, [scope.clinics, staff?.assignedClinicIds]);
  const { clinicId, setClinicId, activeClinic } = useActiveClinic(
    scope.tenantId,
    manageableClinics.length ? manageableClinics : scope.clinics,
    primaryClinic.id
  );
  const [dentistId, setDentistId] = useState('');
  const ownAgenda = staff?.agendaScope === 'own' && Boolean(staff.dentistId);
  const [timelineView, setTimelineView] = useState<'hora' | 'dentista'>('hora');
  const [bookOpen, setBookOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [bookPrefillTime, setBookPrefillTime] = useState('10:00');
  const [blockPrefillTime, setBlockPrefillTime] = useState('13:00');
  const [detailBlock, setDetailBlock] = useState<BlockedSlot | null>(null);
  const [clinicOpen, setClinicOpen] = useState(false);
  const [dentistOpen, setDentistOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [userLabel, setUserLabel] = useState('Usuario conectado');
  const [detailAppt, setDetailAppt] = useState<Appointment | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('10:00');

  const [submitting, setSubmitting] = useState(false);

  const clinicRef = useRef<HTMLDivElement>(null);
  const dentistRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!staffLoading && ownAgenda && staff?.dentistId) setDentistId(staff.dentistId);
  }, [staffLoading, ownAgenda, staff?.dentistId]);

  useEffect(() => {
    if (typeof window === 'undefined' || ownAgenda) return;
    const id = new URLSearchParams(window.location.search).get('dentist');
    if (id) setDentistId(id);
  }, [ownAgenda]);

  useEffect(() => {
    const pre = consumeBookingPatientPrefill();
    if (pre) {
      setBookOpen(true);
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

  const clinicDentists = dentistsForClinic(state, clinicId);
  const clinicPatients = useMemo(() => patientsForClinic(state, clinicId), [state, clinicId]);

  const dayAppts = useMemo(() => {
    let list = scope.appointments.filter((a) => a.clinicId === clinicId && a.date === date);
    if (dentistId) list = list.filter((a) => a.dentistId === dentistId);
    return list.filter((a) => a.status !== 'cancelada');
  }, [scope.appointments, clinicId, date, dentistId]);

  const blockedForDay = useMemo(
    () => blocksForDay(state, { clinicId, date, dentistId: dentistId || undefined }),
    [state, clinicId, date, dentistId]
  );

  const allBlocksForDay = useMemo(
    () => scope.blockedSlots.filter((b) => b.clinicId === clinicId && b.date === date),
    [scope.blockedSlots, clinicId, date]
  );

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

  function openBookDrawer(hour?: string) {
    if (hour) setBookPrefillTime(hour.length <= 5 ? hour : `${hour.slice(0, 2)}:00`);
    setBookOpen(true);
  }

  function openBlockDrawer(hour?: string) {
    if (hour) setBlockPrefillTime(hour.length <= 5 ? hour : `${hour.slice(0, 2)}:00`);
    setBlockOpen(true);
  }

  function pickSlot(hour: string) {
    openBookDrawer(hour);
  }

  function openDay(iso: string) {
    setDate(iso);
    setMode('dia');
  }

  function startReschedule(appt: Appointment) {
    setRescheduleTarget(appt);
    setRescheduleDate(appt.date);
    setRescheduleTime(appt.time);
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

  async function createAppointmentFromDrawer(data: {
    patientId: string;
    date: string;
    time: string;
    duration: number;
    dentistId: string;
    treatmentId: string;
    notes: string;
    visibleToPatient: boolean;
  }) {
    const err =
      required(data.patientId, 'Paciente') ||
      required(data.time, 'Hora') ||
      required(data.treatmentId, 'Tratamiento');
    if (err) {
      setNotice({ type: 'error', message: err });
      return;
    }
    const activeDentist = data.dentistId || dentistId || clinicDentists[0]?.id;
    if (!activeDentist) {
      setNotice({ type: 'error', message: 'Selecciona un dentista.' });
      return;
    }
    const slotErr = validateAppointmentSlot(state, {
      clinicId,
      dentistId: activeDentist,
      date: data.date,
      time: data.time
    });
    if (slotErr) {
      setNotice({ type: 'error', message: slotErr });
      return;
    }
    const patient =
      clinicPatients.find((p) => p.id === data.patientId) ?? state.patients.find((p) => p.id === data.patientId);
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
        patientId: data.patientId,
        patientName: patient.fullName,
        patientEmail: patient.email,
        patientPhone: patient.phone,
        dentistId: activeDentist,
        treatmentId: data.treatmentId,
        roomName: activeClinic.cabinets[0]?.name ?? 'Gabinete 1',
        date: data.date,
        time: data.time,
        notes: data.notes,
        status: 'pendiente'
      });
      if (!result.ok) {
        setNotice({ type: 'error', message: result.message });
        return;
      }
      if (result.demoState) commit(result.demoState);
      else await refresh();
      setNotice({ type: 'ok', message: 'Cita creada correctamente.' });
      setBookOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  async function submitBlockFromDrawer(data: Omit<ScheduleBlockInput, 'clinicId' | 'cabinetId' | 'tenantId'>) {
    if (!data.reason.trim()) {
      setNotice({ type: 'error', message: 'Indica un motivo.' });
      return;
    }
    if (!data.dentistIds.length) {
      setNotice({ type: 'error', message: 'Selecciona al menos un Dr. o Dra.' });
      return;
    }
    if (!data.consecutive && !data.selectedDates.length) {
      setNotice({ type: 'error', message: 'Selecciona al menos un día.' });
      return;
    }

    const input: ScheduleBlockInput = {
      ...data,
      clinicId,
      cabinetId: activeClinic.cabinets[0]?.id ?? 'g-1',
      startTime: data.startTime.slice(0, 5),
      endTime: data.endTime.slice(0, 5)
    };
    const slots = expandScheduleBlocks(input);
    if (!slots.length) {
      setNotice({ type: 'error', message: 'No se generaron bloqueos para el rango indicado.' });
      return;
    }

    const groupId = slots[0]?.blockGroupId;

    if (!isClientDemoMode()) {
      for (const slot of slots) {
        const ids = slot.dentistIds?.length ? slot.dentistIds : [slot.dentistId];
        for (const dId of ids) {
          const live = await createScheduleBlockLive({
            clinicId,
            dentistId: dId,
            dentistIds: slot.dentistIds,
            date: slot.date,
            time: slot.time,
            endTime: slot.endTime,
            reason: slot.reason,
            durationMinutes: 60,
            blockGroupId: groupId,
            notes: slot.notes
          });
          if (!live.ok) {
            setNotice({ type: 'error', message: live.message });
            return;
          }
        }
      }
      await refresh();
    } else {
      commit(saveScheduleBlocks(state, slots));
    }
    setBlockOpen(false);
    const days = new Set(slots.map((s) => s.date)).size;
    setNotice({
      type: 'ok',
      message: `Horario bloqueado: ${days} día${days === 1 ? '' : 's'}, ${data.dentistIds.length} profesional${data.dentistIds.length === 1 ? '' : 'es'}.`
    });
  }

  async function removeBlock(block: BlockedSlot) {
    const allowed = canDeleteScheduleBlock(staff, block, {
      ownAgenda,
      dentistId: staff?.dentistId ?? dentistId,
      assignedClinicIds: staff?.assignedClinicIds
    });
    if (!allowed) {
      setNotice({ type: 'error', message: 'No tienes permiso para eliminar este bloqueo en esta sede.' });
      return;
    }

    if (!isClientDemoMode()) {
      const live = await deleteScheduleBlockLive({
        clinicId: block.clinicId,
        blockGroupId: block.blockGroupId,
        blockId: block.blockGroupId ? undefined : block.id
      });
      if (!live.ok) {
        setNotice({ type: 'error', message: live.message });
        return;
      }
      await refresh();
    } else if (block.blockGroupId) {
      commit(removeScheduleBlockGroup(state, block.blockGroupId));
    } else {
      commit(removeBlockedSlot(state, block.id));
    }
    setDetailBlock(null);
    setNotice({ type: 'ok', message: 'Bloqueo eliminado.' });
  }

  const canRemoveDetailBlock = detailBlock
    ? canDeleteScheduleBlock(staff, detailBlock, {
        ownAgenda,
        dentistId: staff?.dentistId ?? dentistId,
        assignedClinicIds: staff?.assignedClinicIds
      })
    : false;

  function selectClinic(nextId: string) {
    setClinicId(nextId);
    if (isClientLiveMode()) void refresh();
  }

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

        {manageableClinics.length > 1 ? (
          <div className={`agd-dropdown${clinicOpen ? ' is-open' : ''}`} ref={clinicRef}>
            <button type="button" className="agd-chip" aria-expanded={clinicOpen} onClick={() => setClinicOpen((v) => !v)}>
              {activeClinic?.name ?? 'Sede'}
              <ChevronDown className="h-4 w-4 agd-chip__chev" aria-hidden />
            </button>
            {clinicOpen ? (
              <ul className="agd-dropdown__menu" role="listbox" aria-label="Seleccionar sede">
                {manageableClinics.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={c.id === clinicId}
                      onClick={() => {
                        selectClinic(c.id);
                        setClinicOpen(false);
                      }}
                    >
                      {c.name}
                      {c.isMainBranch ? ' (principal)' : ''}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

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

        <button type="button" className="agd-btn-primary" onClick={() => openBookDrawer()}>
          <Plus className="h-4 w-4" aria-hidden />
          Nueva cita
        </button>

        <button type="button" className="agd-btn-block" onClick={() => openBlockDrawer()}>
          <Lock className="h-4 w-4" aria-hidden />
          Bloquear horario
        </button>

        <div className="agd-bell-wrap">
          <AdminNotificationBell />
        </div>

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

      <div className="agd-layout agd-layout--pro">
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

          <div className="agd-timeline-body agd-timeline-body--cal">
            {mode === 'dia' ? (
              <AgendaDayCalendar
                state={state}
                date={date}
                appointments={dayAppts}
                blocks={allBlocksForDay}
                dentistId={dentistId}
                dentists={clinicDentists.map((d) => ({
                  id: d.id,
                  fullName: d.fullName,
                  visibleTitle: d.visibleTitle
                }))}
                treatments={scope.treatments.map((t) => ({ id: t.id, name: t.name }))}
                multiDentist={timelineView === 'dentista'}
                onPickSlot={pickSlot}
                onConfirm={(appt) => void setStatus(appt, 'confirmada')}
                onCancel={(appt) => void setStatus(appt, 'cancelada')}
                onReschedule={startReschedule}
                onOpenAppointment={setDetailAppt}
                onOpenBlock={setDetailBlock}
              />
            ) : (
              <AgendaWeekMonthCalendar
                state={state}
                mode={mode}
                anchorDate={date}
                appointments={rangeAppts}
                onSelectDay={openDay}
              />
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
              <button type="button" className="agd-quick-btn" onClick={() => openBlockDrawer()}>
                <Lock className="h-4 w-4 text-violet-600" aria-hidden />
                Bloquear franja horaria
              </button>
              <button type="button" className="agd-quick-btn" onClick={() => setMode('semana')}>
                <Calendar className="h-4 w-4 text-teal-600" aria-hidden />
                Ver agenda semanal
              </button>
              <button type="button" className="agd-quick-btn" onClick={() => openBookDrawer()}>
                <Search className="h-4 w-4 text-slate-600" aria-hidden />
                Buscar paciente
              </button>
            </div>
          </div>
        </aside>
      </div>

      <AgendaBookDrawer
        open={bookOpen}
        state={state}
        clinicId={clinicId}
        cabinetId={activeClinic.cabinets[0]?.id ?? 'g-1'}
        patients={clinicPatients}
        dentists={clinicDentists.map((d) => ({
          id: d.id,
          fullName: d.fullName,
          visibleTitle: d.visibleTitle
        }))}
        treatments={scope.treatments.map((t) => ({ id: t.id, name: t.name }))}
        date={date}
        initialTime={bookPrefillTime}
        ownAgenda={ownAgenda}
        defaultDentistId={(dentistId || clinicDentists[0]?.id) ?? ''}
        submitting={submitting}
        onClose={() => setBookOpen(false)}
        onSubmit={(data) => void createAppointmentFromDrawer(data)}
      />

      <AgendaBlockDrawer
        open={blockOpen}
        dentists={clinicDentists.map((d) => ({
          id: d.id,
          fullName: d.fullName,
          visibleTitle: d.visibleTitle
        }))}
        date={date}
        initialTime={blockPrefillTime}
        defaultDentistId={(dentistId || clinicDentists[0]?.id) ?? ''}
        ownAgenda={ownAgenda}
        onClose={() => setBlockOpen(false)}
        onSubmit={(data) => void submitBlockFromDrawer(data)}
      />

      <AgendaApptDetailDrawer
        open={Boolean(detailAppt)}
        state={state}
        appointment={detailAppt}
        treatmentName={
          detailAppt
            ? (scope.treatments.find((t) => t.id === detailAppt.treatmentId)?.name ?? 'Consulta')
            : ''
        }
        dentistName={
          detailAppt
            ? (scope.dentists.find((d) => d.id === detailAppt.dentistId)?.fullName ?? 'Profesional')
            : ''
        }
        onClose={() => setDetailAppt(null)}
        onConfirm={() => {
          if (!detailAppt) return;
          void setStatus(detailAppt, 'confirmada');
          setDetailAppt(null);
        }}
        onCancel={() => {
          if (!detailAppt) return;
          void setStatus(detailAppt, 'cancelada');
          setDetailAppt(null);
        }}
        onConfirmAttendance={() => {
          if (!detailAppt) return;
          commit(confirmAppointmentAttendance(state, detailAppt.id));
          setNotice({ type: 'ok', message: 'Asistencia confirmada. El paciente puede descargar el justificante.' });
          setDetailAppt(null);
        }}
        onReschedule={() => {
          if (!detailAppt) return;
          startReschedule(detailAppt);
          setDetailAppt(null);
        }}
      />

      <AgendaBlockDetailDrawer
        open={Boolean(detailBlock)}
        block={detailBlock}
        groupDayCount={
          detailBlock?.blockGroupId
            ? state.blockedSlots.filter((b) => b.blockGroupId === detailBlock.blockGroupId).length
            : undefined
        }
        targetLabel={
          detailBlock
            ? blockTargetLabel(
                detailBlock,
                clinicDentists.map((d) => ({
                  id: d.id,
                  fullName: d.fullName,
                  visibleTitle: d.visibleTitle
                }))
              )
            : ''
        }
        canRemove={canRemoveDetailBlock}
        onClose={() => setDetailBlock(null)}
        onRemove={() => {
          if (!detailBlock) return;
          void removeBlock(detailBlock);
        }}
      />

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

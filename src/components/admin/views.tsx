import { useMemo, useState } from 'react';
import { dentistsForClinic, PRIMARY_CLINIC_ID } from '@/lib/clinic';
import {
  appointmentsInRange,
  filterAppointments,
  monthPrefix,
  weekRange,
  appointmentPrice,
  isActiveStatus
} from '@/lib/appointments';
import {
  addBlockedSlot,
  createAppointment,
  createDentist,
  createPatient,
  createTreatment,
  deleteAppointment,
  getStoredTenantId,
  normativeFor,
  removeBlockedSlot,
  saveCabinet,
  saveClinic,
  saveDentist,
  saveNormative,
  savePatient,
  saveSettings,
  saveTreatment,
  settingsFor,
  updateAppointmentStatus
} from '@/lib/demoStore';
import { clinicTenantId } from '@/lib/clinic';
import { useTenant } from '@/hooks/useTenant';
import { patientsForTenant } from '@/lib/tenant';
import { fmtDate, fmtDateTime, money, statusLabel, todayIso, uid } from '@/lib/format';
import { findPatientsByQuery } from '@/lib/patientSearch';
import { patientName, pendingInvoicesForPatient, recordsForPatient } from '@/lib/selectors';
import { recentPatientActivity } from '@/lib/selectors';
import { email, phone, required } from '@/lib/validation';
import { modeCopy } from '@/lib/appMode';
import { useDemoStore } from '@/hooks/useDemoStore';
import { useNotice } from '@/hooks/useNotice';
import type { Appointment, AppointmentStatus, Dentist, Patient, Treatment } from '@/types/demo';
import { IdBadge } from '@/components/ui/IdBadge';
import { PatientSelect } from './shared';
import {
  AdminClinicalReports,
  AdminDocuments,
  AdminInvoices,
  AdminPatientDetail,
  AdminPayments
} from './records';
import {
  Badge,
  Button,
  Card,
  ConfirmModal,
  Empty,
  Field,
  FilterTabs,
  Input,
  SearchInput,
  Select,
  StatCard,
  Textarea
} from '@/components/ui';

export { AdminClinicalReports, AdminDocuments, AdminInvoices, AdminPatientDetail, AdminPayments };

export function AdminDashboard() {
  const { state } = useDemoStore();
  const scope = useTenant();
  const today = todayIso();
  const appts = scope.appointments;
  const income = scope.payments.filter((p) => p.status === 'completado').reduce((s, p) => s + p.amount, 0);
  const pending = appts.filter((a) => a.status === 'pendiente').length;
  const confirmed = appts.filter((a) => a.status === 'confirmada').length;
  const activity = recentPatientActivity(state, 8, scope.tenantId);
  const occupancy = scope.dentists.length
    ? Math.min(100, Math.round((appts.filter((a) => a.date === today).length / (scope.dentists.length * 8)) * 100))
    : 0;

  return (
    <div className="space-y-5">
      <p className="admin-intro">
        {modeCopy(
          'Vista demo: datos aislados por clínica en este navegador.',
          'Modo LIVE: sesión por cookie. Registros de'
        )}{' '}
        <strong>{scope.tenantId}</strong>
        {modeCopy('', ' · con Supabase los cambios se guardan en servidor.')}
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Citas hoy" value={appts.filter((a) => a.date === today).length} tone="accent" />
        <StatCard label="Citas pendientes" value={pending} tone="warn" />
        <StatCard label="Citas confirmadas" value={confirmed} tone="success" />
        <StatCard label="Pacientes en clínica" value={patientsForTenant(state, scope.tenantId).length} />
        <StatCard label="Informes emitidos" value={scope.reports.length} />
        <StatCard label="Documentos subidos" value={scope.documents.length} />
        <StatCard label="Facturas pendientes" value={scope.invoices.filter((i) => i.status === 'pendiente').length} tone="warn" />
        <StatCard label="Pagos completados" value={scope.payments.filter((p) => p.status === 'completado').length} />
        <StatCard label={modeCopy('Ingresos demo', 'Ingresos')} value={money(income)} />
        <StatCard label="Ocupación agenda hoy" value={`${occupancy}%`} hint={modeCopy('estimación demo', 'hoy')} />
        <StatCard label="Alertas" value={scope.invoices.filter((i) => i.status === 'vencida').length} tone="warn" hint="facturas vencidas" />
      </div>

      

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Próximas citas">
          <ul className="space-y-2 text-sm">
            {[...appts]
              .filter((a) => a.date >= today && isActiveStatus(a.status))
              .slice(0, 5)
              .map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2">
                  <span>
                    <IdBadge id={a.id} kind="cita" /> {patientName(state, a.patientId)} · {fmtDateTime(a.date, a.time)}
                  </span>
                  <Badge status={a.status} label={statusLabel(a.status)} />
                </li>
              ))}
          </ul>
        </Card>
        <Card title="Actividad reciente">
          <ul className="feed">
            {activity.map((a) => (
              <li key={`${a.kind}-${a.id}`} className="feed__item">
                <IdBadge id={a.id} kind={a.kind === 'factura' ? 'factura' : a.kind === 'informe' ? 'informe' : a.kind === 'pago' ? 'pago' : 'documento'} />
                <span className="text-sm font-semibold">{a.label}</span>
              </li>
            ))}
          </ul>
          {!activity.length ? <Empty title="Sin actividad" text="Crea registros para ver el historial." /> : null}
        </Card>
      </div>
</div>
  );
}

export function AdminAgenda() {
  const { state, commit } = useDemoStore();
  const scope = useTenant();
  const { setNotice } = useNotice();
  const [mode, setMode] = useState<'dia' | 'semana' | 'mes'>('dia');
  const [date, setDate] = useState(todayIso());
  const [clinicId, setClinicId] = useState(PRIMARY_CLINIC_ID);
  const [dentistId, setDentistId] = useState('');
  const [cabinetId, setCabinetId] = useState('');
  const [blockTime, setBlockTime] = useState('13:00');
  const [blockReason, setBlockReason] = useState('');

  const filtered = useMemo(() => {
    let list = scope.appointments.filter((a) => a.clinicId === clinicId);
    if (dentistId) list = list.filter((a) => a.dentistId === dentistId);
    if (cabinetId) list = list.filter((a) => a.cabinetId === cabinetId);
    if (mode === 'dia') return list.filter((a) => a.date === date);
    if (mode === 'semana') {
      const { from, to } = weekRange(date);
      return appointmentsInRange(list, from, to);
    }
    const m = monthPrefix(date);
    return list.filter((a) => a.date.startsWith(m));
  }, [scope.appointments, mode, date, clinicId, dentistId, cabinetId]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(['dia', 'semana', 'mes'] as const).map((m) => (
          <Button key={m} tone={mode === m ? 'primary' : 'secondary'} onClick={() => setMode(m)}>
            {m === 'dia' ? 'Día' : m === 'semana' ? 'Semana' : 'Mes'}
          </Button>
        ))}
        <Input type="date" className="field-control !w-auto" value={date} onChange={(e) => setDate(e.target.value)} />
        <Select className="field-control !w-auto" value={clinicId} onChange={(e) => setClinicId(e.target.value)}>
          {state.clinics.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <Select className="field-control !w-auto" value={dentistId} onChange={(e) => setDentistId(e.target.value)}>
          <option value="">Todos dentistas</option>
          {dentistsForClinic(state, clinicId).map((d) => <option key={d.id} value={d.id}>{d.fullName}</option>)}
        </Select>
      </div>
      <Card title={`Citas (${filtered.length})`}>
        <div className="table-cards">
          {filtered.map((a) => (
            <AgendaRow key={a.id} a={a} onAction={(msg) => setNotice({ type: 'ok', message: msg })} />
          ))}
        </div>
        {!filtered.length ? <Empty title="Sin citas" text="No hay citas en este periodo." /> : null}
      </Card>
      <Card title="Bloquear horario">
        <div className="grid gap-3 md:grid-cols-4">
          <Field label="Hora"><Input type="time" value={blockTime} onChange={(e) => setBlockTime(e.target.value)} /></Field>
          <Field label="Motivo"><Input value={blockReason} onChange={(e) => setBlockReason(e.target.value)} /></Field>
          <div className="flex items-end">
            <Button onClick={() => {
              if (!blockReason.trim()) return;
              commit(addBlockedSlot(state, { clinicId, dentistId: dentistId || (scope.dentists[0]?.id ?? ''), cabinetId: cabinetId || 'g-1', date, time: blockTime.slice(0, 5), reason: blockReason }));
              setNotice({ type: 'ok', message: 'Horario bloqueado.' });
            }}>Bloquear</Button>
          </div>
        </div>
        <ul className="mt-3 space-y-1 text-sm">
          {state.blockedSlots.map((b) => (
            <li key={b.id} className="flex justify-between rounded-lg bg-rose-50 px-3 py-2">
              <span>{fmtDate(b.date)} {b.time} — {b.reason}</span>
              <button type="button" className="font-bold text-rose-700" onClick={() => commit(removeBlockedSlot(state, b.id))}>Quitar</button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function AgendaRow({ a, onAction }: { a: Appointment; onAction: (m: string) => void }) {
  const { state, commit } = useDemoStore();
  const setStatus = (status: AppointmentStatus) => {
    commit(updateAppointmentStatus(state, a.id, status));
    onAction(`Cita ${statusLabel(status).toLowerCase()}.`);
  };
  return (
    <div className="table-cards__row">
      <div>
        <p className="font-bold flex flex-wrap items-center gap-2"><IdBadge id={a.id} kind="cita" /> {patientName(state, a.patientId)}</p>
        <p className="text-sm text-slate-600">{fmtDateTime(a.date, a.time)}</p>
      </div>
      <Badge status={a.status} label={statusLabel(a.status)} />
      <div className="flex flex-wrap gap-1">
        <Button tone="ghost" className="!py-1 !text-xs" onClick={() => setStatus('confirmada')}>Confirmar</Button>
        <Button tone="ghost" className="!py-1 !text-xs" onClick={() => setStatus('completada')}>Completar</Button>
        <Button tone="ghost" className="!py-1 !text-xs" onClick={() => setStatus('no_asistio')}>No asistió</Button>
        <Button tone="ghost" className="!py-1 !text-xs" onClick={() => setStatus('cancelada')}>Cancelar</Button>
      </div>
    </div>
  );
}

export function AdminAppointments() {
  const { state, commit } = useDemoStore();
  const scope = useTenant();
  const { setNotice } = useNotice();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('todos');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const list = filterAppointments(state, scope.appointments, { q, status });
  const [form, setForm] = useState({
    patientId: state.patients[0]?.id ?? '',
    dentistId: scope.dentists[0]?.id ?? '',
    treatmentId: scope.treatments[0]?.id ?? '',
    cabinetId: 'g-1',
    date: todayIso(),
    time: '10:00'
  });

  function create() {
    const err =
      required(form.patientId, 'Paciente') ||
      required(form.dentistId, 'Dentista') ||
      required(form.treatmentId, 'Tratamiento') ||
      required(form.date, 'Fecha') ||
      required(form.time, 'Hora');
    if (err) {
      setNotice({ type: 'error', message: err });
      return;
    }
    commit(
      createAppointment(state, {
        patientId: form.patientId,
        dentistId: form.dentistId,
        clinicId: PRIMARY_CLINIC_ID,
        cabinetId: form.cabinetId,
        treatmentId: form.treatmentId,
        date: form.date,
        time: form.time,
        notes: '',
        status: 'pendiente'
      })
    );
    setNotice({ type: 'ok', message: 'Cita creada.' });
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <SearchInput value={q} onChange={setQ} placeholder="Buscar ID, paciente o fecha…" />
        <FilterTabs value={status as 'todos'} onChange={setStatus} options={[
          { id: 'todos', label: 'Todas' },
          { id: 'pendiente', label: 'Pendientes' },
          { id: 'confirmada', label: 'Confirmadas' },
          { id: 'completada', label: 'Completadas' },
          { id: 'cancelada', label: 'Canceladas' }
        ]} />
        <div className="table-cards">
          {list.map((a) => (
            <div key={a.id} className="table-cards__row">
              <div>
                <p className="font-bold flex flex-wrap items-center gap-2"><IdBadge id={a.id} kind="cita" /> {patientName(state, a.patientId)}</p>
                <p className="text-sm text-slate-600">{fmtDateTime(a.date, a.time)} · {money(appointmentPrice(state, a.treatmentId))}</p>
              </div>
              <Badge status={a.status} label={statusLabel(a.status)} />
              <div className="flex flex-wrap gap-1">
                <Button tone="ghost" className="!text-xs" onClick={() => commit(updateAppointmentStatus(state, a.id, 'confirmada'))}>Confirmar</Button>
                <Button tone="ghost" className="!text-xs" onClick={() => commit(updateAppointmentStatus(state, a.id, 'completada'))}>Completar</Button>
                <Button tone="ghost" className="!text-xs" onClick={() => setDeleteId(a.id)}>Eliminar</Button>
              </div>
            </div>
          ))}
        </div>
        <ConfirmModal open={Boolean(deleteId)} title="Eliminar cita" message={modeCopy('¿Eliminar esta cita del modo demo?', '¿Eliminar esta cita?')} confirmLabel="Eliminar"
          onConfirm={() => { if (deleteId) commit(deleteAppointment(state, deleteId)); setNotice({ type: 'ok', message: 'Cita eliminada.' }); }}
          onClose={() => setDeleteId(null)} />
      </div>
      <Card title="Nueva cita">
        <div className="grid gap-3">
          <PatientSelect state={state} value={form.patientId} onChange={(id) => setForm({ ...form, patientId: id })} required />
          <Field label="Dentista"><Select value={form.dentistId} onChange={(e) => setForm({ ...form, dentistId: e.target.value })}>{scope.dentists.map((d) => <option key={d.id} value={d.id}>{d.fullName}</option>)}</Select></Field>
          <Field label="Tratamiento"><Select value={form.treatmentId} onChange={(e) => setForm({ ...form, treatmentId: e.target.value })}>{scope.treatments.map((tr) => <option key={tr.id} value={tr.id}>{tr.name}</option>)}</Select></Field>
          <Field label="Fecha"><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
          <Field label="Hora"><Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></Field>
          <Button onClick={create}>Crear cita</Button>
        </div>
      </Card>
    </div>
  );
}

export function AdminPatients() {
  const { state, commit } = useDemoStore();
  const scope = useTenant();
  const { setNotice } = useNotice();
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<Patient | null>(null);
  const tenantPatientIds = patientsForTenant(state, scope.tenantId);
  const tenantPatients = state.patients.filter((p) => tenantPatientIds.includes(p.id));
  const list = q.trim() ? findPatientsByQuery(state, q).filter((p) => tenantPatientIds.includes(p.id)) : tenantPatients;

  function newPatient() {
    commit(
      createPatient(state, {
        fullName: 'Nuevo paciente',
        email: 'nuevo@example.com',
        phone: '+34 600 000 000',
        birthDate: '1990-01-01',
        allergies: 'Ninguna',
        medication: 'Ninguna',
        reminderChannels: ['email'],
        primaryDentistId: scope.dentists[0]?.id ?? '',
        preferredClinicId: PRIMARY_CLINIC_ID,
        emergencyContactName: '',
        emergencyContactPhone: '',
        notes: ''
      })
    );
    setNotice({ type: 'ok', message: 'Paciente creado con ID automático.' });
  }

  return (
    <div className="space-y-4">
<SearchInput value={q} onChange={setQ} placeholder="Buscar por DNI, PAT-XXXX, nombre o email…" />
      <Button onClick={newPatient}>Crear paciente</Button>
      <div className="table-cards">
        {list.map((p) => {
          const rec = recordsForPatient(state, p.id);
          const next = rec.appointments.filter((a) => isActiveStatus(a.status)).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))[0];
          const pending = pendingInvoicesForPatient(state, p.id).length;
          return (
            <article key={p.id} className="table-cards__row">
              <div>
                <p className="flex flex-wrap items-center gap-2 font-bold"><IdBadge id={p.id} kind="paciente" /> {p.fullName}</p>
                <p className="text-sm text-slate-600">{p.email} · {p.phone}{p.dni ? ` · DNI ${p.dni}` : ''}</p>
                <p className="text-xs text-slate-500">Próxima: {next ? fmtDateTime(next.date, next.time) : '—'} · Facturas pend.: {pending} · Informes: {rec.reports.length}</p>
              </div>
              <div className="flex flex-wrap gap-1">
                <a href={`/admin/pacientes/${p.id}`}><Button tone="secondary" className="!text-xs">Ver ficha</Button></a>
                <Button tone="ghost" className="!text-xs" onClick={() => setEditing(p)}>Editar</Button>
                <a href="/admin/citas"><Button tone="ghost" className="!text-xs">Cita</Button></a>
                <a href="/admin/informes"><Button tone="ghost" className="!text-xs">Informe</Button></a>
                <a href="/admin/documentos"><Button tone="ghost" className="!text-xs">Documento</Button></a>
                <a href="/admin/facturas"><Button tone="ghost" className="!text-xs">Factura</Button></a>
                <a href="/admin/pagos"><Button tone="ghost" className="!text-xs">Pago</Button></a>
              </div>
            </article>
          );
        })}
      </div>
      {editing ? (
        <Card title={`Editar ${editing.id}`}>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Nombre"><Input value={editing.fullName} onChange={(e) => setEditing({ ...editing, fullName: e.target.value })} /></Field>
            <Field label="Email"><Input value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} /></Field>
            <Field label="Teléfono"><Input value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} /></Field>
            <Field label="DNI"><Input value={editing.dni ?? ''} onChange={(e) => setEditing({ ...editing, dni: e.target.value })} /></Field>
            <div className="md:col-span-2"><Field label="Notas"><Textarea value={editing.notes ?? ''} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} /></Field></div>
            <Button onClick={() => {
              const err = required(editing.fullName, 'Nombre') || email(editing.email) || phone(editing.phone);
              if (err) { setNotice({ type: 'error', message: err }); return; }
              commit(savePatient(state, editing));
              setNotice({ type: 'ok', message: 'Paciente guardado.' });
            }}>Guardar</Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}

export function AdminDentists() {
  const { state, commit } = useDemoStore();
  const scope = useTenant();
  const [form, setForm] = useState<Dentist>({ ...state.dentists[0], id: uid('d'), active: true });
  return (
    <Card title="Dentistas">
      <ul className="mb-4 space-y-2">{scope.dentists.map((d) => (
        <li key={d.id} className="flex justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
          <span><strong>{d.fullName}</strong> — {d.specialty}</span>
          <button type="button" className="font-bold text-dental-700" onClick={() => commit(saveDentist(state, { ...d, active: !d.active }))}>{d.active ? 'Desactivar' : 'Activar'}</button>
        </li>
      ))}</ul>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Nombre"><Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></Field>
        <Field label="Especialidad"><Input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} /></Field>
        <Field label="Horario"><Input value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} /></Field>
        <Button onClick={() => commit(saveDentist(state, form))}>Guardar dentista</Button>
      </div>
    </Card>
  );
}

export function AdminTreatments() {
  const { state, commit } = useDemoStore();
  const scope = useTenant();
  const [form, setForm] = useState<Treatment>({ ...state.treatments[0], id: uid('t'), tenantId: getStoredTenantId(), active: true });
  return (
    <Card title="Tratamientos">
      <ul className="mb-4 space-y-2">{scope.treatments.map((t) => (
        <li key={t.id} className="flex justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
          <span>{t.name}</span>
          <span className="font-bold">{money(t.price)}</span>
        </li>
      ))}</ul>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Nombre"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Precio"><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></Field>
        <Field label="Duración (min)"><Input type="number" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })} /></Field>
        <Button onClick={() => commit(saveTreatment(state, { ...form, description: form.description || '' }))}>Guardar</Button>
      </div>
    </Card>
  );
}

export function AdminClinics() {
  const { state, commit } = useDemoStore();
  const clinic = state.clinics[0];
  const [cabinetName, setCabinetName] = useState('');
  return (
    <Card title="Clínicas y gabinetes">
      <Field label="Nombre"><Input value={clinic.name} onChange={(e) => commit(saveClinic(state, { ...clinic, name: e.target.value, active: clinic.active }))} /></Field>
      <Field label="Horarios"><Input value={clinic.openingHours} onChange={(e) => commit(saveClinic(state, { ...clinic, openingHours: e.target.value }))} /></Field>
      <label className="mt-2 flex items-center gap-2 text-sm font-bold">
        <input type="checkbox" checked={clinic.active} onChange={(e) => commit(saveClinic(state, { ...clinic, active: e.target.checked }))} /> Clínica activa
      </label>
      <ul className="mt-4 space-y-2">{clinic.cabinets.map((g) => (
        <li key={g.id} className="flex justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
          <span>{g.name}</span>
          <button type="button" className="font-bold" onClick={() => commit(saveCabinet(state, clinic.id, { ...g, active: !g.active }))}>{g.active ? 'Desactivar' : 'Activar'}</button>
        </li>
      ))}</ul>
      <div className="mt-3 flex gap-2">
        <Input placeholder="Nuevo gabinete" value={cabinetName} onChange={(e) => setCabinetName(e.target.value)} />
        <Button onClick={() => { if (!cabinetName.trim()) return; commit(saveCabinet(state, clinic.id, { id: uid('g'), name: cabinetName, equipment: 'General', active: true })); setCabinetName(''); }}>Añadir</Button>
      </div>
    </Card>
  );
}

export function AdminReports() {
  const { state } = useDemoStore();
  const scope = useTenant();
  const byStatus = ['pendiente', 'confirmada', 'completada', 'cancelada', 'no_asistio'] as const;
  const max = Math.max(1, ...byStatus.map((s) => scope.appointments.filter((a) => a.status === s).length));
  const top = [...state.treatments].map((t) => ({
    t,
    n: scope.appointments.filter((a) => a.treatmentId === t.id).length
  })).sort((a, b) => b.n - a.n).slice(0, 3);
  const income = scope.payments.filter((p) => p.status === 'completado').reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-4">
      <Card title="Citas por estado">
        <div className="bar-chart">
          {byStatus.map((s) => {
            const n = scope.appointments.filter((a) => a.status === s).length;
            return (
              <div key={s} className="flex flex-1 flex-col items-center gap-1">
                <div className="bar-chart__bar w-full" style={{ height: `${(n / max) * 100}%` }} title={`${n}`} />
                <span className="text-[10px] font-bold text-slate-500">{statusLabel(s)}</span>
              </div>
            );
          })}
        </div>
      </Card>
      <Card title="Tratamientos más reservados">
        <ul className="space-y-2">{top.map(({ t, n }) => (
          <li key={t.id} className="flex justify-between text-sm font-semibold"><span>{t.name}</span><span>{n} citas</span></li>
        ))}</ul>
      </Card>
      <StatCard label={modeCopy('Ingresos demo', 'Ingresos')} value={money(income)} />
    </div>
  );
}

export function AdminNormativa() {
  const { state, commit } = useDemoStore();
  return (
    <div className="grid gap-4">
      {normativeFor(state, getStoredTenantId()).map((n) => (
        <Card key={n.id} title={n.title}>
          <Textarea value={n.body} onChange={(e) => commit(saveNormative(state, getStoredTenantId(), { ...n, body: e.target.value }))} />
        </Card>
      ))}
    </div>
  );
}

export function AdminConfig() {
  const { state, commit } = useDemoStore();
  const { setNotice } = useNotice();
  const tenantId = getStoredTenantId();
  const [s, setS] = useState(settingsFor(state, tenantId));
  return (
    <Card title="Configuración">
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Nombre clínica"><Input value={s.clinicName} onChange={(e) => setS({ ...s, clinicName: e.target.value })} /></Field>
        <Field label="Teléfono"><Input value={s.phone} onChange={(e) => setS({ ...s, phone: e.target.value })} /></Field>
        <Field label="WhatsApp"><Input value={s.whatsapp} onChange={(e) => setS({ ...s, whatsapp: e.target.value })} /></Field>
        <Field label="Intervalo (min)"><Input type="number" value={s.slotIntervalMinutes} onChange={(e) => setS({ ...s, slotIntervalMinutes: Number(e.target.value) })} /></Field>
        <Field label="Mensaje bienvenida"><Textarea value={s.welcomeMessage} onChange={(e) => setS({ ...s, welcomeMessage: e.target.value })} /></Field>
        <Field label="Mensaje confirmación cita"><Textarea value={s.appointmentConfirmMessage} onChange={(e) => setS({ ...s, appointmentConfirmMessage: e.target.value })} /></Field>
        <label className="flex items-center gap-2 text-sm font-bold md:col-span-2">
          <input type="checkbox" checked={s.remindersEnabled} onChange={(e) => setS({ ...s, remindersEnabled: e.target.checked })} /> Recordatorios activos
        </label>
        <Button onClick={() => { commit(saveSettings(state, tenantId, s)); setNotice({ type: 'ok', message: 'Configuración guardada.' }); }}>Guardar</Button>
      </div>
    </Card>
  );
}

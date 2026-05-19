import { useMemo, useState } from 'react';
import { CalendarPlus, CreditCard, MessageSquare, Sparkles } from 'lucide-react';
import { dentistsForClinic, PRIMARY_CLINIC_ID } from '@/lib/clinic';
import {
  appointmentPrice,
  filterAppointments,
  hasSlotConflict,
  isActiveStatus
} from '@/lib/appointments';
import {
  createAppointment,
  downloadDemoFile,
  normativeFor,
  rescheduleAppointment,
  savePatient,
  settingsFor,
  updateAppointmentStatus
} from '@/lib/demoStore';
import { clinicTenantId } from '@/lib/clinic';
import {
  patientPortalNews,
  pendingInvoicesForPatient,
  visibleDocumentsForPatient,
  visibleReportsForPatient
} from '@/lib/selectors';
import { tenantName } from '@/lib/tenant';
import { fmtDate, fmtDateTime, money, statusLabel, todayIso, uid } from '@/lib/format';
import { availableSlots } from '@/lib/slots';
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
  StatCard,
  Stepper,
  Textarea
} from '@/components/ui';
import { IdBadge } from '@/components/ui/IdBadge';
export { PatientDocuments, PatientInvoices, PatientPayments, PatientReports } from './records';

const bookSteps = ['Clínica', 'Tratamiento', 'Dentista', 'Fecha', 'Hora', 'Resumen', 'Confirmar'];

function useApptMeta(state: ReturnType<typeof useDemoStore>['state'], a: Appointment) {
  const t = state.treatments.find((x) => x.id === a.treatmentId);
  const d = state.dentists.find((x) => x.id === a.dentistId);
  const c = state.clinics.find((x) => x.id === a.clinicId);
  return { treatment: t?.name ?? '—', dentist: d?.fullName ?? '—', clinic: c?.name ?? '—', price: t?.price ?? 0 };
}

export function PatientDashboard() {
  const { state } = useDemoStore();
  const patient = usePatient();
  const mine = state.appointments.filter((a) => a.patientId === patient.id);
  const upcoming = mine.filter((a) => isActiveStatus(a.status)).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  const next = upcoming[0];
  const pendingInv = pendingInvoicesForPatient(state, patient.id);
  const lastReport = visibleReportsForPatient(state, patient.id)[0];
  const newDocs = visibleDocumentsForPatient(state, patient.id).slice(0, 2);
  const news = patientPortalNews(state, patient.id);
  const recentPay = state.payments.filter((p) => p.patientId === patient.id).slice(0, 1);
  const unread = state.messages.filter((m) => m.patientId === patient.id && !m.read);

  const alerts: string[] = [];
  if (pendingInv.length) alerts.push(`${pendingInv.length} factura(s) pendiente(s)`);
  if (unread.length) alerts.push(`${unread.length} mensaje(s) sin leer`);
  if (!next) alerts.push('Sin cita próxima — puedes reservar ahora');

  return (
    <div className="space-y-5">
      <PageHeader title="Inicio" subtitle={patient.fullName} />
      {alerts.length ? <div className="banner-alert">{alerts.join(' · ')}</div> : null}

      <section className="highlight-panel mb-2">
        <h2>Toda tu información dental en un solo lugar</h2>
        <p>
          Aunque visites varias clínicas, tu portal agrupa citas, informes, facturas y pagos por tu ID{' '}
          <strong>{patient.id}</strong>. Solo ves tus propios registros.
        </p>
      </section>

      {next ? (
        <section className="next-appointment">
          <p className="text-xs font-bold uppercase tracking-wide text-white/80">Próxima cita</p>
          <p className="mt-2 font-display text-2xl">{fmtDateTime(next.date, next.time)}</p>
          <p className="mt-1 text-sm text-white/90">{useApptMeta(state, next).treatment} · {statusLabel(next.status)}</p>
          <a href="/paciente/citas" className="mt-4 inline-block rounded-xl bg-white/20 px-4 py-2 text-sm font-bold text-white">
            Ver detalle
          </a>
        </section>
      ) : (
        <Card title="Sin citas próximas">
          <Empty title="Agenda libre" text="Reserva tu próxima visita en un minuto." />
          <a href="/paciente/reservar" className="mt-4 inline-block"><Button>Reservar cita</Button></a>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Citas activas" value={upcoming.length} icon={CalendarPlus} tone="accent" />
        <StatCard label="Facturas pendientes" value={money(pendingInv.reduce((s, i) => s + i.amount, 0))} icon={CreditCard} tone="warn" />
        <StatCard label="Mensajes" value={unread.length} hint="sin leer" icon={MessageSquare} />
        <StatCard label="Recordatorios" value={(patient.reminderChannels ?? []).join(', ') || '—'} hint="canales activos" icon={Sparkles} tone="success" />
      </div>

      <Card title="Novedades en tu portal">
        <ul className="space-y-2 text-sm">
          {news.map((n) => (
            <li key={n.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-dental-50 px-3 py-2 font-semibold text-dental-900">
              <IdBadge id={n.id} kind={n.kind === 'factura' ? 'factura' : n.kind === 'informe' ? 'informe' : n.kind === 'pago' ? 'pago' : 'documento'} />
              {n.label}
            </li>
          ))}
        </ul>
        {!news.length ? <p className="text-sm text-slate-500">Sin novedades recientes.</p> : null}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Accesos rápidos">
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { href: '/paciente/reservar', label: 'Reservar cita' },
              { href: '/paciente/citas', label: 'Mis citas' },
              { href: '/paciente/informes', label: 'Informes' },
              { href: '/paciente/documentos', label: 'Documentos' },
              { href: '/paciente/facturas', label: 'Facturas' },
              { href: '/paciente/pagos', label: 'Pagos' },
              { href: '/paciente/mensajes', label: 'Mensajes' }
            ].map((l) => (
              <a key={l.href} href={l.href} className="portal-quick-link">
                {l.label}
              </a>
            ))}
          </div>
        </Card>
        <Card title="Resumen clínico">
          <ul className="space-y-2 text-sm text-slate-600">
            <li>Último informe: {lastReport ? <strong>{lastReport.id} · {lastReport.title}</strong> : '—'}</li>
            <li>Documentos nuevos: {newDocs.length ? newDocs.map((d) => d.id).join(', ') : '—'}</li>
            <li>Pago reciente: {recentPay[0] ? `${recentPay[0].id} · ${money(recentPay[0].amount)}` : '—'}</li>
          </ul>
        </Card>
        <Card title="Antes de tu cita">
          <ul className="space-y-2 text-sm font-medium text-slate-600">
            <li>· Llega 10 minutos antes.</li>
            <li>· Trae tu documentación si es primera visita.</li>
            <li>· Avísanos de alergias actualizadas en Perfil.</li>
          </ul>
          <p className="mt-4 text-xs text-slate-500">
            {normativeFor(state).find((n) => n.id === 'condiciones')?.body}
          </p>
        </Card>
        <Card title="Recordatorios y mensajes">
          <p className="text-sm text-slate-600">
            Canales: {(patient.reminderChannels ?? []).join(', ') || 'ninguno configurado'}.
          </p>
          <a href="/paciente/mensajes" className="mt-3 inline-block text-sm font-bold text-dental-700 underline">
            Ver bandeja ({unread.length} sin leer)
          </a>
        </Card>
      </div>

    </div>
  );
}

export function PatientBook() {
  const { state, commit } = useDemoStore();
  const patient = usePatient();
  const { setNotice } = useNotice();
  const [step, setStep] = useState(1);
  const [clinicId, setClinicId] = useState(patient.preferredClinicId || PRIMARY_CLINIC_ID);
  const [treatmentId, setTreatmentId] = useState('');
  const [dentistId, setDentistId] = useState('');
  const [cabinetId, setCabinetId] = useState('g-1');
  const [date, setDate] = useState(todayIso());
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clinic = state.clinics.find((c) => c.id === clinicId);
  const treatment = state.treatments.find((t) => t.id === treatmentId);
  const dentists = dentistsForClinic(state, clinicId);
  const slots = useMemo(
    () => (date && treatmentId && dentistId ? availableSlots(state, { clinicId, dentistId, cabinetId, date, treatmentId }) : []),
    [state, clinicId, dentistId, cabinetId, date, treatmentId]
  );

  function validateStep() {
    const e: Record<string, string> = {};
    if (step === 1) { const err = required(clinicId, 'Clínica'); if (err) e.clinicId = err; }
    if (step === 2) { const err = required(treatmentId, 'Tratamiento'); if (err) e.treatmentId = err; }
    if (step === 3) { const err = required(dentistId, 'Dentista'); if (err) e.dentistId = err; }
    if (step === 4) { const err = required(date, 'Fecha'); if (err) e.date = err; }
    if (step === 5) { const err = required(time, 'Hora'); if (err) e.time = err; }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function confirm() {
    if (hasSlotConflict(state, { dentistId, cabinetId, date, time })) {
      setNotice({ type: 'error', message: 'Ese horario ya no está disponible. Elige otra hora.' });
      setStep(5);
      return;
    }
    commit(
      createAppointment(state, {
        patientId: patient.id,
        tenantId: clinicTenantId(state, clinicId),
        dentistId,
        clinicId,
        cabinetId,
        treatmentId,
        date,
        time,
        notes,
        status: 'pendiente'
      })
    );
    setNotice({ type: 'ok', message: settingsFor(state).appointmentConfirmMessage });
    window.location.href = '/paciente/citas';
  }

  const cancelPolicy = normativeFor(state).find((n) => n.id === 'cancelacion')?.body;

  return (
    <Card>
      <PageHeader title="Reservar cita" subtitle="Flujo guiado en 7 pasos · CIT-XXXX al confirmar" />
      <Stepper steps={bookSteps} current={step} />
      {step === 1 && (
        <Field label="Clínica" error={errors.clinicId}>
          <Select value={clinicId} onChange={(e) => setClinicId(e.target.value)}>
            {state.clinics.filter((c) => c.active).map((c) => (
              <option key={c.id} value={c.id}>{c.name} — {tenantName(state, c.tenantId)}</option>
            ))}
          </Select>
        </Field>
      )}
      {step === 2 && (
        <Field label="Tratamiento" error={errors.treatmentId}>
          <Select value={treatmentId} onChange={(e) => setTreatmentId(e.target.value)}>
            <option value="">Selecciona…</option>
            {state.treatments.filter((t) => t.active).map((t) => (
              <option key={t.id} value={t.id}>{t.name} · {money(t.price)} · {t.durationMinutes} min</option>
            ))}
          </Select>
        </Field>
      )}
      {step === 3 && (
        <Field label="Dentista" error={errors.dentistId}>
          <Select value={dentistId} onChange={(e) => setDentistId(e.target.value)}>
            <option value="">Selecciona…</option>
            {dentists.map((d) => (
              <option key={d.id} value={d.id}>{d.fullName} — {d.specialty}</option>
            ))}
          </Select>
        </Field>
      )}
      {step === 4 && (
        <Field label="Fecha" error={errors.date}>
          <Input type="date" min={todayIso()} value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
      )}
      {step === 5 && (
        <Field label="Hora disponible" error={errors.time}>
          <Select value={time} onChange={(e) => setTime(e.target.value)}>
            <option value="">Selecciona…</option>
            {slots.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
          {!slots.length ? <p className="text-xs font-semibold text-amber-700">No hay huecos ese día. Prueba otra fecha.</p> : null}
        </Field>
      )}
      {step === 6 && treatment && (
        <ul className="space-y-2 rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-700">
          <li>Clínica: {clinic?.name}</li>
          <li>Tratamiento: {treatment.name} ({money(treatment.price)})</li>
          <li>Dentista: {dentists.find((d) => d.id === dentistId)?.fullName}</li>
          <li>Fecha: {fmtDate(date)} · {time}</li>
          <li>Duración: {treatment.durationMinutes} min</li>
        </ul>
      )}
      {step === 7 && (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">Confirma tu reserva. Podrás cancelar o reprogramar desde Mis citas.</p>
          <Field label="Notas (opcional)"><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
        </div>
      )}
      <div className="mt-6 flex flex-wrap gap-2">
        {step > 1 ? <Button tone="secondary" onClick={() => setStep((s) => s - 1)}>Atrás</Button> : null}
        {step < 7 ? (
          <Button onClick={() => { if (validateStep()) setStep((s) => s + 1); }}>Continuar</Button>
        ) : (
          <Button onClick={confirm}>Confirmar cita</Button>
        )}
      </div>
    </Card>
  );
}

function AppointmentRow({ a }: { a: Appointment }) {
  const { state, commit } = useDemoStore();
  const { setNotice } = useNotice();
  const meta = useApptMeta(state, a);
  const [showCancel, setShowCancel] = useState(false);
  const [showResched, setShowResched] = useState(false);
  const [date, setDate] = useState(a.date);
  const [time, setTime] = useState(a.time);

  return (
    <article className="table-cards__row">
      <IdBadge id={a.id} kind="cita" />
      <div>
        <p className="font-bold text-dental-950">{meta.treatment}</p>
        <p className="text-sm text-slate-600">{meta.dentist} · {meta.clinic}</p>
        <p className="text-sm font-semibold text-dental-800">{fmtDateTime(a.date, a.time)} · {money(meta.price)}</p>
        <p className="text-xs text-slate-500">Gabinete {a.cabinetId ?? '—'}</p>
      </div>
      <Badge status={a.status} label={statusLabel(a.status)} />
      {isActiveStatus(a.status) ? (
        <div className="flex flex-wrap gap-2">
          <Button tone="secondary" className="!py-2 !text-xs" onClick={() => setShowCancel(true)}>Cancelar</Button>
          <Button className="!py-2 !text-xs" onClick={() => setShowResched(true)}>Reprogramar</Button>
        </div>
      ) : null}
      <ConfirmModal open={showCancel} title="Cancelar cita" message="¿Seguro que deseas cancelar esta cita?" confirmLabel="Sí, cancelar"
        onConfirm={() => { commit(updateAppointmentStatus(state, a.id, 'cancelada')); setNotice({ type: 'ok', message: 'Cita cancelada.' }); }}
        onClose={() => setShowCancel(false)} />
      <ConfirmModal open={showResched} title="Reprogramar cita" message="Indica nueva fecha y hora en el formulario al cerrar." confirmLabel="Guardar"
        onConfirm={() => {
          if (hasSlotConflict(state, { dentistId: a.dentistId, cabinetId: a.cabinetId ?? 'g-1', date, time, excludeId: a.id })) {
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
        <div className="md:col-span-2 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500">ID paciente:</span>
          <IdBadge id={form.id} kind="paciente" />
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
    </div>
  );
}

export function PatientMessages() {
  const { state, commit } = useDemoStore();
  const patient = usePatient();
  const [filter, setFilter] = useState<'todos' | 'recordatorio' | 'confirmacion' | 'clinica'>('todos');
  const list = state.messages.filter((m) => m.patientId === patient.id && (filter === 'todos' || m.type === filter));

  return (
    <div className="space-y-4">
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
  const { state } = useDemoStore();
  return (
    <div className="space-y-4">
      <PageHeader title="Ayuda" subtitle="Preguntas frecuentes y normativa" />
      <Card title="Preguntas frecuentes">
        <dl className="space-y-3 text-sm">
          <div><dt className="font-bold text-dental-900">¿Cómo cancelo?</dt><dd className="text-slate-600">Desde Mis citas, con al menos 24 h de antelación.</dd></div>
          <div><dt className="font-bold text-dental-900">¿Puedo reprogramar?</dt><dd className="text-slate-600">Sí, elige nueva fecha y hora si hay disponibilidad.</dd></div>
        </dl>
      </Card>
      <Card title="Normativa">
        <ul className="space-y-2">
          {normativeFor(state).map((n) => (
            <li key={n.id} className="rounded-xl bg-slate-50 p-3 text-sm"><strong>{n.title}</strong><p className="mt-1 text-slate-600">{n.body}</p></li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

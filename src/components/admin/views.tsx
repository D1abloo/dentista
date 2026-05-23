import { useEffect, useMemo, useState } from 'react';
import { getActiveClinicId, setActiveClinicId } from '@/lib/activeClinic';
import { dentistsForClinic, getPrimaryClinic } from '@/lib/clinic';
import {
  appointmentsInRange,
  filterAppointments,
  monthPrefix,
  weekRange,
  appointmentPrice,
  isActiveStatus
} from '@/lib/appointments';
import { createAdminAppointment, updateAdminAppointmentStatus } from '@/lib/adminAppointments';
import {
  addBlockedSlot,
  addBranchToOrganization,
  registerOrganization,
  setDemoSession,
  createDentist,
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
import { patientsForClinic } from '@/lib/tenant';
import { clinicTenantId } from '@/lib/clinic';
import { useTenant } from '@/hooks/useTenant';
import { patientsForTenant } from '@/lib/tenant';
import { fmtDate, fmtDateTime, money, statusLabel, todayIso, uid } from '@/lib/format';
import { findPatientsByQuery } from '@/lib/patientSearch';
import { patientName, pendingInvoicesForPatient, recordsForPatient } from '@/lib/selectors';
import { recentPatientActivity } from '@/lib/selectors';
import { email, phone, required } from '@/lib/validation';
import { isClientDemoMode, isClientLiveMode, modeCopy } from '@/lib/appMode';
import { useDemoStore } from '@/hooks/useDemoStore';
import { useNotice } from '@/hooks/useNotice';
import { useStaffContext } from '@/hooks/useStaffContext';
import type { Appointment, AppointmentStatus, Dentist, Patient, Treatment } from '@/types/demo';
import { IdBadge } from '@/components/ui/IdBadge';
import { PatientSelect } from './shared';
import { PatientLookup } from './PatientLookup';
import { AdminStaffPortalProfile } from './portalAccess';
export { AdminAgenda } from './AdminAgenda';
import { ClinicLogoUpload } from './ClinicLogoUpload';
import { AdminClinicalReports } from './AdminClinicalReports';
import { AdminPatientDetail } from './records';
import { AdminDocuments, AdminInvoices } from './uploadViews';
import { AdminPayments } from './AdminPayments';
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
export { AdminNotifications } from './AdminNotifications';

export { AdminDashboard } from './AdminDashboard';

export function AdminAppointments() {
  const { state, commit, refresh } = useDemoStore();
  const scope = useTenant();
  const { setNotice } = useNotice();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('todos');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const clinic = getPrimaryClinic(state, scope.tenantId);
  const clinicPatients = useMemo(() => patientsForClinic(state, clinic.id), [state, clinic.id]);
  const list = filterAppointments(state, scope.appointments, { q, status });
  const [form, setForm] = useState({
    patientId: clinicPatients[0]?.id ?? '',
    dentistId: scope.dentists[0]?.id ?? '',
    treatmentId: scope.treatments[0]?.id ?? '',
    cabinetId: clinic.cabinets[0]?.id ?? 'g-1',
    date: todayIso(),
    time: '10:00'
  });

  async function patchStatus(a: Appointment, next: AppointmentStatus) {
    const result = await updateAdminAppointmentStatus(state, a, next);
    if (!result.ok) {
      setNotice({ type: 'error', message: result.message });
      return;
    }
    if (result.demoState) commit(result.demoState);
    else await refresh();
    setNotice({ type: 'ok', message: `Cita ${statusLabel(next).toLowerCase()}.` });
  }

  async function create() {
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
    const patient = clinicPatients.find((p) => p.id === form.patientId);
    if (!patient) {
      setNotice({ type: 'error', message: 'Selecciona un paciente registrado.' });
      return;
    }
    const result = await createAdminAppointment({
      state,
      clinicId: clinic.id,
      cabinetId: form.cabinetId,
      patientId: form.patientId,
      patientName: patient.fullName,
      patientEmail: patient.email,
      patientPhone: patient.phone,
      dentistId: form.dentistId,
      treatmentId: form.treatmentId,
      roomName: clinic.cabinets.find((c) => c.id === form.cabinetId)?.name ?? 'Gabinete 1',
      date: form.date,
      time: form.time,
      status: 'pendiente'
    });
    if (!result.ok) {
      setNotice({ type: 'error', message: result.message });
      return;
    }
    if (result.demoState) commit(result.demoState);
    else await refresh();
    setNotice({ type: 'ok', message: 'Cita creada correctamente.' });
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
                <Button tone="ghost" className="!text-xs" onClick={() => void patchStatus(a, 'confirmada')}>Confirmar</Button>
                <Button tone="ghost" className="!text-xs" onClick={() => void patchStatus(a, 'completada')}>Completar</Button>
                <Button tone="ghost" className="!text-xs" onClick={() => setDeleteId(a.id)}>Cancelar</Button>
              </div>
            </div>
          ))}
        </div>
        <ConfirmModal
          open={Boolean(deleteId)}
          title="Cancelar cita"
          message={modeCopy('¿Cancelar esta cita?', '¿Cancelar esta cita? El paciente dejará de tenerla activa.')}
          confirmLabel="Cancelar cita"
          onConfirm={() => {
            const appt = list.find((x) => x.id === deleteId);
            if (appt) void patchStatus(appt, 'cancelada');
            setDeleteId(null);
          }}
          onClose={() => setDeleteId(null)}
        />
      </div>
      <Card title="Nueva cita">
        <div className="grid gap-3">
          <PatientLookup
            state={state}
            patientId={form.patientId}
            onPatientId={(id) => setForm({ ...form, patientId: id })}
            label="Paciente (NHC / DNI)"
            placeholder="Buscar por NHC, nombre o teléfono…"
            candidates={clinicPatients}
          />
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

export { AdminPatients } from './AdminPatients';

export function AdminDentists() {
  const { state, commit } = useDemoStore();
  const { setNotice } = useNotice();
  const scope = useTenant();
  const emptyDentist: Dentist = {
    id: uid('d'),
    tenantId: scope.tenantId,
    fullName: '',
    specialty: '',
    email: '',
    phone: '',
    collegiateNumber: '',
    schedule: 'Lun–Vie 09:00–17:00',
    active: true
  };
  const [form, setForm] = useState<Dentist>(scope.dentists[0] ?? emptyDentist);

  function saveDentistForm() {
    if (!form.fullName.trim()) {
      setNotice({ type: 'error', message: 'Indica el nombre del profesional.' });
      return;
    }
    if (!form.collegiateNumber?.trim()) {
      setNotice({
        type: 'error',
        message: 'El número de colegiado es obligatorio. Aparece en el pie de los informes clínicos.'
      });
      return;
    }
    commit(saveDentist(state, { ...form, collegiateNumber: form.collegiateNumber.trim() }));
    setNotice({ type: 'ok', message: 'Dentista guardado.' });
  }

  return (
    <Card title="Dentistas">
      <p className="mb-3 text-xs text-slate-600">
        El nº de colegiado es obligatorio y se muestra en el pie de página de los informes generados por el profesional.
      </p>
      <ul className="mb-4 space-y-2">{scope.dentists.map((d) => (
        <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm">
          <span>
            <strong>{d.fullName}</strong> — {d.specialty}
            {d.collegiateNumber ? (
              <span className="ml-2 text-xs text-slate-600">Col. {d.collegiateNumber}</span>
            ) : (
              <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-950">Sin nº colegiado</span>
            )}
            {d.profileId ? (
              <span className="ml-2 rounded bg-teal-100 px-2 py-0.5 text-xs font-semibold text-teal-900">Usuario vinculado</span>
            ) : (
              <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-950">Sin usuario — dar de alta en Usuarios clínica</span>
            )}
          </span>
          <div className="flex gap-2">
            <button type="button" className="text-xs font-bold text-teal-800" onClick={() => setForm(d)}>Editar</button>
            <button type="button" className="font-bold text-dental-700" onClick={() => commit(saveDentist(state, { ...d, active: !d.active }))}>{d.active ? 'Desactivar' : 'Activar'}</button>
          </div>
        </li>
      ))}</ul>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Nombre completo (Dr./Dra.)">
          <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Dra. Ana López" />
        </Field>
        <Field label="Nº colegiado (obligatorio)">
          <Input
            value={form.collegiateNumber ?? ''}
            onChange={(e) => setForm({ ...form, collegiateNumber: e.target.value })}
            placeholder="Ej. 29/4521"
            required
          />
        </Field>
        <Field label="Especialidad">
          <Input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} />
        </Field>
        <Field label="Email">
          <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="Teléfono">
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </Field>
        <Field label="Horario">
          <Input value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} />
        </Field>
        <Button className="md:col-span-2" onClick={saveDentistForm}>Guardar dentista</Button>
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
  const { state, commit, refresh } = useDemoStore();
  const scope = useTenant();
  const { setNotice } = useNotice();
  const live = isClientLiveMode();
  const activeClinicId = getActiveClinicId(state, scope.tenantId);
  const clinic = state.clinics.find((c) => c.id === activeClinicId) ?? getPrimaryClinic(state, scope.tenantId);
  const branches = scope.clinics;
  const orgName = scope.tenant?.name ?? clinic.name;
  const [cabinetName, setCabinetName] = useState('');
  const [newBranch, setNewBranch] = useState({ name: '', address: '', city: 'Madrid', phone: '', email: '' });
  const [newOrg, setNewOrg] = useState({
    centerName: '',
    ownerName: '',
    email: '',
    phone: '',
    address: '',
    city: 'Madrid'
  });

  async function addBranch() {
    const err = required(newBranch.name, 'Nombre de la sede');
    if (err) {
      setNotice({ type: 'error', message: err });
      return;
    }
    if (live) {
      const res = await fetch('/api/clinic/branches', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: newBranch.name.trim(),
          address: newBranch.address.trim() || undefined,
          city: newBranch.city.trim() || undefined,
          phone: newBranch.phone.trim() || undefined,
          email: newBranch.email.trim() || undefined
        })
      });
      const json = (await res.json()) as { error?: { message?: string }; data?: { id?: string } };
      if (!res.ok) {
        setNotice({ type: 'error', message: json.error?.message ?? 'No se pudo crear la sede.' });
        return;
      }
      const branchLabel = newBranch.name.trim();
      if (json.data?.id) setActiveClinicId(json.data.id);
      await refresh();
      setNewBranch({ name: '', address: '', city: 'Madrid', phone: '', email: '' });
      setNotice({ type: 'ok', message: `Sede «${branchLabel}» añadida a tu organización.` });
      return;
    }
    const branchLabel = newBranch.name.trim();
    const { state: next, clinicId } = addBranchToOrganization(state, scope.tenantId, newBranch);
    commit(next);
    setActiveClinicId(clinicId);
    setNewBranch({ name: '', address: '', city: 'Madrid', phone: '', email: '' });
    setNotice({ type: 'ok', message: `Sede «${branchLabel}» añadida.` });
  }

  function registerCenter() {
    if (live) {
      setNotice({ type: 'error', message: 'En producción solicita una nueva organización desde registro de clínica o contacto.' });
      return;
    }
    const err =
      required(newOrg.centerName, 'Nombre del centro') ||
      required(newOrg.ownerName, 'Responsable') ||
      required(newOrg.email, 'Email') ||
      required(newOrg.phone, 'Teléfono');
    if (err) {
      setNotice({ type: 'error', message: err });
      return;
    }
    const { state: next, tenantId } = registerOrganization(state, newOrg);
    commit(next);
    setDemoSession({ role: 'admin', tenantId });
    setNotice({ type: 'ok', message: `Organización «${newOrg.centerName}» registrada.` });
    window.location.href = '/admin/clinicas';
  }

  return (
    <div className="space-y-4">
      <Card title={`Organización · ${orgName}`}>
        <p className="text-sm text-[var(--muted)]">
          Tu cuenta gestiona <strong>{branches.length}</strong> sede{branches.length === 1 ? '' : 's'} bajo la misma
          organización. Pacientes e informes compartidos por tenant; citas y gabinetes por sede.
        </p>
        <ul className="org-branch-list mt-4">
          {branches.map((b) => (
            <li key={b.id} className={b.id === activeClinicId ? 'org-branch-list__item org-branch-list__item--active' : 'org-branch-list__item'}>
              <button type="button" className="org-branch-list__btn" onClick={() => { setActiveClinicId(b.id); if (live) void refresh(); else window.location.reload(); }}>
                <span className="font-bold">{b.name}</span>
                {b.isMainBranch ? <span className="org-branch-list__badge">Principal</span> : null}
                <span className="text-xs text-[var(--muted)]">{b.city} · {b.address || 'Sin dirección'}</span>
              </button>
            </li>
          ))}
        </ul>
      </Card>

      <Card title={`Sede activa · ${clinic.name}`}>
        <Field label="Nombre de la sede">
          <Input value={clinic.name} onChange={(e) => commit(saveClinic(state, { ...clinic, name: e.target.value, active: clinic.active }))} />
        </Field>
        <Field label="Horarios">
          <Input value={clinic.openingHours} onChange={(e) => commit(saveClinic(state, { ...clinic, openingHours: e.target.value }))} />
        </Field>
        <label className="mt-2 flex items-center gap-2 text-sm font-bold">
          <input type="checkbox" checked={clinic.active} onChange={(e) => commit(saveClinic(state, { ...clinic, active: e.target.checked }))} /> Sede activa
        </label>
        <ul className="mt-4 space-y-2">
          {clinic.cabinets.map((g) => (
            <li key={g.id} className="flex justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
              <span>{g.name}</span>
              <button type="button" className="font-bold" onClick={() => commit(saveCabinet(state, clinic.id, { ...g, active: !g.active }))}>
                {g.active ? 'Desactivar' : 'Activar'}
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex gap-2">
          <Input placeholder="Nuevo gabinete" value={cabinetName} onChange={(e) => setCabinetName(e.target.value)} />
          <Button
            onClick={() => {
              if (!cabinetName.trim()) return;
              commit(saveCabinet(state, clinic.id, { id: uid('g'), name: cabinetName, equipment: 'General', active: true }));
              setCabinetName('');
            }}
          >
            Añadir gabinete
          </Button>
        </div>
      </Card>

      <Card title="Añadir nueva sede">
        <p className="mb-3 text-sm text-[var(--muted)]">
          Crea otra ubicación de la misma organización (mismo tenant). Comparte pacientes e informes; agenda y gabinetes por sede.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Nombre de la sede">
            <Input value={newBranch.name} onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })} placeholder="Ej. Sede Norte" />
          </Field>
          <Field label="Ciudad">
            <Input value={newBranch.city} onChange={(e) => setNewBranch({ ...newBranch, city: e.target.value })} />
          </Field>
          <Field label="Dirección">
            <Input value={newBranch.address} onChange={(e) => setNewBranch({ ...newBranch, address: e.target.value })} />
          </Field>
          <Field label="Teléfono">
            <Input value={newBranch.phone} onChange={(e) => setNewBranch({ ...newBranch, phone: e.target.value })} />
          </Field>
          <Field label="Email sede" className="md:col-span-2">
            <Input type="email" value={newBranch.email} onChange={(e) => setNewBranch({ ...newBranch, email: e.target.value })} />
          </Field>
          <Button className="md:col-span-2" onClick={() => void addBranch()}>
            Añadir sede a la organización
          </Button>
        </div>
      </Card>

      {!live ? (
        <Card title="Nueva organización (solo demo)">
          <p className="mb-3 text-sm text-[var(--muted)]">En demo puedes simular otra organización independiente con su propio tenant.</p>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Nombre organización">
              <Input value={newOrg.centerName} onChange={(e) => setNewOrg({ ...newOrg, centerName: e.target.value })} />
            </Field>
            <Field label="Responsable">
              <Input value={newOrg.ownerName} onChange={(e) => setNewOrg({ ...newOrg, ownerName: e.target.value })} />
            </Field>
            <Field label="Email">
              <Input type="email" value={newOrg.email} onChange={(e) => setNewOrg({ ...newOrg, email: e.target.value })} />
            </Field>
            <Field label="Teléfono">
              <Input value={newOrg.phone} onChange={(e) => setNewOrg({ ...newOrg, phone: e.target.value })} />
            </Field>
            <Button className="md:col-span-2" onClick={registerCenter}>
              Registrar organización demo
            </Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}

export { AdminReports } from './AdminReports';
export { AdminSettings } from './AdminSettings';

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


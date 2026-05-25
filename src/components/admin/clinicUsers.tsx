import { useEffect, useMemo, useState } from 'react';
import { Building2, Link2, Unlink, UserPlus } from 'lucide-react';
import { Badge, Button, Card, Field, Input, PageHeader, Select } from '@/components/ui';
import { useNotice } from '@/hooks/useNotice';
import type { AssignableClinic, StaffUserAccessRow } from '@/lib/services/staffClinicAccess';

type ClinicUser = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
};

const STAFF_ROLES = [
  { value: 'clinic_admin', label: 'Administrador de clínica', hint: 'Acceso completo: usuarios, ajustes y facturación.' },
  { value: 'admin', label: 'Administrador', hint: 'Gestión operativa del panel clínica.' },
  { value: 'owner', label: 'Propietario', hint: 'Control total del tenant y sedes.' },
  { value: 'dentist', label: 'Dentista', hint: 'Agenda propia, pacientes e informes clínicos.' },
  { value: 'receptionist', label: 'Recepción', hint: 'Citas, pacientes y cobros básicos.' }
] as const;

const ROLE_LABELS: Record<string, string> = {
  clinic_admin: 'Admin. clínica',
  admin: 'Administrador',
  owner: 'Propietario',
  dentist: 'Dentista',
  receptionist: 'Recepción',
  patient: 'Paciente'
};

type Tab = 'alta' | 'accesos';

export function AdminClinicUsers() {
  const { setNotice } = useNotice();
  const [tab, setTab] = useState<Tab>('alta');
  const [users, setUsers] = useState<ClinicUser[]>([]);
  const [staffAccess, setStaffAccess] = useState<StaffUserAccessRow[]>([]);
  const [assignableClinics, setAssignableClinics] = useState<AssignableClinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    role: 'dentist',
    specialty: 'General',
    collegiateNumber: '',
    permission: 'write',
    sendEmail: true
  });
  const [assignForm, setAssignForm] = useState({
    authUserId: '',
    clinicId: '',
    role: 'receptionist',
    specialty: 'General',
    collegiateNumber: ''
  });

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/clinic/users', { credentials: 'include', cache: 'no-store' });
      const json = (await res.json()) as {
        data?: {
          users?: ClinicUser[];
          staffAccess?: StaffUserAccessRow[];
          assignableClinics?: AssignableClinic[];
        };
        error?: { message?: string };
      };
      if (!res.ok) throw new Error(json.error?.message ?? 'Error al cargar');
      setUsers(json.data?.users ?? []);
      setStaffAccess(json.data?.staffAccess ?? []);
      setAssignableClinics(json.data?.assignableClinics ?? []);
    } catch (e) {
      setNotice({ type: 'error', message: e instanceof Error ? e.message : 'No se pudo cargar.' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const staffOnly = users.filter((u) => u.role !== 'patient');
    const q = filter.trim().toLowerCase();
    if (!q) return staffOnly;
    return staffOnly.filter(
      (u) =>
        u.full_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (ROLE_LABELS[u.role] ?? u.role).toLowerCase().includes(q)
    );
  }, [users, filter]);

  const staffOptions = useMemo(
    () =>
      staffAccess.map((s) => ({
        id: s.authUserId,
        label: `${s.fullName} (${s.email})`
      })),
    [staffAccess]
  );

  const clinicsForAssign = useMemo(() => {
    if (!assignForm.authUserId) return assignableClinics;
    return assignableClinics.map((c) => ({
      ...c,
      disabled: c.alreadyAssigned
    }));
  }, [assignableClinics, assignForm.authUserId]);

  async function createUser() {
    if (!form.fullName.trim() || !form.email.trim()) {
      setNotice({ type: 'error', message: 'Completa nombre y email.' });
      return;
    }
    if (form.role === 'dentist' && !form.collegiateNumber.trim()) {
      setNotice({ type: 'error', message: 'El número de colegiado es obligatorio para dentistas.' });
      return;
    }
    try {
      const res = await fetch('/api/clinic/users', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          accessType: 'clinic',
          role: form.role,
          permission: form.permission,
          specialty: form.role === 'dentist' ? form.specialty : undefined,
          collegiateNumber: form.role === 'dentist' ? form.collegiateNumber.trim() : undefined,
          sendEmail: form.sendEmail
        })
      });
      const json = (await res.json()) as {
        data?: { temporaryPassword?: string; emailSent?: boolean };
        error?: { message?: string };
        meta?: { message?: string };
      };
      if (!res.ok) throw new Error(json.error?.message ?? 'No se pudo crear');
      setNotice({
        type: 'ok',
        message:
          json.meta?.message ??
          (json.data?.temporaryPassword
            ? `Usuario creado. Contraseña temporal: ${json.data.temporaryPassword}`
            : 'Usuario creado.')
      });
      setForm((f) => ({ ...f, fullName: '', email: '', collegiateNumber: '' }));
      await load();
    } catch (e) {
      setNotice({ type: 'error', message: e instanceof Error ? e.message : 'Error al crear.' });
    }
  }

  async function assignAccess() {
    if (!assignForm.authUserId || !assignForm.clinicId) {
      setNotice({ type: 'error', message: 'Selecciona usuario y clínica.' });
      return;
    }
    if (assignForm.role === 'dentist' && !assignForm.collegiateNumber.trim()) {
      setNotice({ type: 'error', message: 'Nº de colegiado obligatorio para dentistas.' });
      return;
    }
    try {
      const res = await fetch('/api/clinic/users/assign-access', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          authUserId: assignForm.authUserId,
          clinicId: assignForm.clinicId,
          role: assignForm.role,
          specialty: assignForm.role === 'dentist' ? assignForm.specialty : undefined,
          collegiateNumber: assignForm.role === 'dentist' ? assignForm.collegiateNumber.trim() : undefined
        })
      });
      const json = (await res.json()) as { error?: { message?: string }; meta?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message ?? 'No se pudo asignar');
      setNotice({ type: 'ok', message: json.meta?.message ?? 'Acceso asignado.' });
      setAssignForm((f) => ({ ...f, clinicId: '', collegiateNumber: '' }));
      await load();
    } catch (e) {
      setNotice({ type: 'error', message: e instanceof Error ? e.message : 'Error al asignar.' });
    }
  }

  async function revokeAccess(profileId: string) {
    if (!window.confirm('¿Quitar el acceso a esta clínica?')) return;
    try {
      const res = await fetch('/api/clinic/users/revoke-access', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ profileId })
      });
      const json = (await res.json()) as { error?: { message?: string }; meta?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message ?? 'No se pudo revocar');
      setNotice({ type: 'ok', message: json.meta?.message ?? 'Acceso revocado.' });
      await load();
    } catch (e) {
      setNotice({ type: 'error', message: e instanceof Error ? e.message : 'Error al revocar.' });
    }
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === 'alta' ? 'bg-dental-800 text-white' : 'bg-slate-100 text-slate-700'}`}
          onClick={() => setTab('alta')}
        >
          Alta de usuarios
        </button>
        <button
          type="button"
          className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === 'accesos' ? 'bg-dental-800 text-white' : 'bg-slate-100 text-slate-700'}`}
          onClick={() => setTab('accesos')}
        >
          Accesos multi-clínica
        </button>
      </div>

      {tab === 'alta' ? (
        <Card>
          <PageHeader
            title="Usuarios del panel"
            subtitle="Crea cuentas de personal. En organizaciones multi-sede puedes asignar el mismo usuario a varias clínicas en la pestaña Accesos."
          />
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Nombre completo">
              <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            </Field>
            <Field label="Email">
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="Rol en el panel">
              <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {STAFF_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </Select>
              <p className="mt-1 text-xs text-slate-500">
                {STAFF_ROLES.find((r) => r.value === form.role)?.hint}
              </p>
            </Field>
            {(form.role === 'clinic_admin' || form.role === 'admin' || form.role === 'owner') ? (
              <Field label="Nivel de permisos">
                <Select value={form.permission} onChange={(e) => setForm({ ...form, permission: e.target.value })}>
                  <option value="execute">Completo (administración)</option>
                  <option value="write">Operativo (lectura y escritura)</option>
                  <option value="read">Solo lectura</option>
                </Select>
              </Field>
            ) : null}
            {form.role === 'dentist' ? (
              <>
                <Field label="Especialidad">
                  <Input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} />
                </Field>
                <Field label="Nº colegiado (obligatorio)">
                  <Input
                    value={form.collegiateNumber}
                    onChange={(e) => setForm({ ...form, collegiateNumber: e.target.value })}
                    placeholder="Ej. 29/4521"
                    required
                  />
                </Field>
              </>
            ) : null}
            <Button className="md:col-span-2" onClick={() => void createUser()}>
              <UserPlus className="h-4 w-4" /> Dar de alta usuario
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <Card>
            <PageHeader
              title="Asignar acceso a otra clínica"
              subtitle={`${assignableClinics.length} clínicas disponibles para asignar (incluye multi-sede y red de centros).`}
            />
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Usuario existente">
                <Select
                  value={assignForm.authUserId}
                  onChange={(e) => setAssignForm({ ...assignForm, authUserId: e.target.value, clinicId: '' })}
                >
                  <option value="">— Seleccionar —</option>
                  {staffOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Clínica destino">
                <Select
                  value={assignForm.clinicId}
                  onChange={(e) => setAssignForm({ ...assignForm, clinicId: e.target.value })}
                  disabled={!assignForm.authUserId}
                >
                  <option value="">— Seleccionar clínica —</option>
                  {clinicsForAssign.map((c) => (
                    <option key={c.id} value={c.id} disabled={c.alreadyAssigned}>
                      {c.name}
                      {c.city ? ` · ${c.city}` : ''}
                      {c.organizationName ? ` (${c.organizationName})` : ''}
                      {c.alreadyAssigned ? ' — ya asignada' : ''}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Rol en esa clínica">
                <Select value={assignForm.role} onChange={(e) => setAssignForm({ ...assignForm, role: e.target.value })}>
                  {STAFF_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </Select>
              </Field>
              {assignForm.role === 'dentist' ? (
                <>
                  <Field label="Especialidad">
                    <Input
                      value={assignForm.specialty}
                      onChange={(e) => setAssignForm({ ...assignForm, specialty: e.target.value })}
                    />
                  </Field>
                  <Field label="Nº colegiado">
                    <Input
                      value={assignForm.collegiateNumber}
                      onChange={(e) => setAssignForm({ ...assignForm, collegiateNumber: e.target.value })}
                    />
                  </Field>
                </>
              ) : null}
              <Button className="md:col-span-2" onClick={() => void assignAccess()}>
                <Link2 className="h-4 w-4" /> Asignar acceso
              </Button>
            </div>
          </Card>

          <Card title={loading ? 'Cargando…' : `Accesos por usuario (${staffAccess.length})`}>
            {staffAccess.length === 0 ? (
              <p className="text-sm text-slate-600">No hay usuarios con accesos registrados.</p>
            ) : (
              <ul className="grid gap-4">
                {staffAccess.map((row) => (
                  <li key={row.authUserId} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-dental-950">{row.fullName}</p>
                        <p className="text-xs text-slate-600">{row.email}</p>
                      </div>
                      <Badge status="info" label={`${row.clinics.length} clínica(s)`} />
                    </div>
                    <ul className="org-branch-list mt-3">
                      {row.clinics.map((c) => (
                        <li key={c.profileId} className="org-branch-list__item">
                          <div className="flex items-start gap-2">
                            <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" aria-hidden />
                            <div>
                              <p className="font-semibold">{c.clinicName}</p>
                              <p className="text-xs text-slate-500">
                                {[c.city, c.organizationName].filter(Boolean).join(' · ') || 'Clínica independiente'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge status="info" label={ROLE_LABELS[c.role] ?? c.role} />
                            {c.isCurrent ? <Badge status="ok" label="Activa" /> : null}
                            {!c.isCurrent ? (
                              <button
                                type="button"
                                className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
                                title="Quitar acceso"
                                onClick={() => void revokeAccess(c.profileId)}
                              >
                                <Unlink className="h-4 w-4" aria-hidden />
                              </button>
                            ) : null}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}

      <Card title={loading ? 'Cargando…' : `${filtered.length} usuarios en esta clínica`}>
        <Field label="Buscar">
          <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Nombre, email o rol" />
        </Field>
        <ul className="org-branch-list mt-4">
          {filtered.map((u) => (
            <li key={u.id} className="org-branch-list__item">
              <div>
                <p className="font-bold">{u.full_name}</p>
                <p className="text-xs text-slate-600">{u.email}</p>
              </div>
              <Badge status="info" label={ROLE_LABELS[u.role] ?? u.role} />
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

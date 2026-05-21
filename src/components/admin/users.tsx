import { useEffect, useMemo, useState } from 'react';
import { Shield, UserPlus, Users } from 'lucide-react';
import { getActiveClinicId } from '@/lib/activeClinic';
import { Badge, Button, Card, Field, Input, PageHeader, Select } from '@/components/ui';
import { useNotice } from '@/hooks/useNotice';
import { useDemoStore } from '@/hooks/useDemoStore';
import { useTenant } from '@/hooks/useTenant';

type UserRow = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  clinic_id: string;
  created_at: string;
};

const ACCESS_TYPES = [
  { value: 'clinic', label: 'Panel administrativo de clínica', hint: 'Acceso a /admin (personal y administradores)' },
  { value: 'patient', label: 'Portal del paciente', hint: 'Acceso a /paciente' }
] as const;

const STAFF_ROLES = [
  { value: 'clinic_admin', label: 'Administrador de clínica' },
  { value: 'admin', label: 'Administrador' },
  { value: 'owner', label: 'Propietario' },
  { value: 'dentist', label: 'Dentista / doctor' },
  { value: 'receptionist', label: 'Recepción' }
] as const;

const ROLE_LABELS: Record<string, string> = {
  clinic_admin: 'Admin. clínica',
  admin: 'Administrador',
  owner: 'Propietario',
  dentist: 'Dentista',
  receptionist: 'Recepción',
  patient: 'Paciente'
};

export function AdminUsers() {
  const { state, refresh } = useDemoStore();
  const scope = useTenant();
  const { setNotice } = useNotice();
  const branches = state.clinics.filter((c) => c.tenantId === scope.tenantId);

  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const defaultClinicId = getActiveClinicId(state, scope.tenantId);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    accessType: 'clinic' as 'clinic' | 'patient',
    role: 'receptionist',
    clinicId: defaultClinicId,
    permission: 'write',
    specialty: 'General'
  });

  const activeClinicId = form.clinicId || getActiveClinicId(state, scope.tenantId);

  const roleOptions = useMemo(() => {
    if (form.accessType === 'patient') return [{ value: 'patient', label: 'Paciente' }];
    return STAFF_ROLES;
  }, [form.accessType]);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/clinic/users', { credentials: 'include' });
      const json = (await res.json()) as { data?: { users?: UserRow[] }; error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message ?? 'Error al cargar');
      setUsers(json.data?.users ?? []);
    } catch (e) {
      setNotice({ type: 'error', message: e instanceof Error ? e.message : 'No se pudo cargar.' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (form.accessType === 'patient') {
      setForm((prev) => ({ ...prev, role: 'patient' }));
    } else {
      setForm((prev) => (prev.role === 'patient' ? { ...prev, role: 'receptionist' } : prev));
    }
  }, [form.accessType]);

  async function createUser() {
    if (!form.fullName.trim() || !form.email.trim() || !form.password) {
      setNotice({ type: 'error', message: 'Completa nombre, email y contraseña.' });
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
          password: form.password,
          accessType: form.accessType,
          role: form.accessType === 'patient' ? 'patient' : form.role,
          clinicId: activeClinicId,
          permission: form.permission,
          specialty: form.role === 'dentist' ? form.specialty : undefined
        })
      });
      const json = (await res.json()) as {
        data?: { loginPath?: string; accessLabel?: string };
        error?: { message?: string };
      };
      if (!res.ok) throw new Error(json.error?.message ?? 'No se pudo crear');
      setNotice({
        type: 'ok',
        message: `Usuario creado (${json.data?.accessLabel ?? 'acceso configurado'}). Inicio de sesión: ${json.data?.loginPath ?? '/login'}`
      });
      setForm((f) => ({ ...f, password: '', fullName: '', email: '' }));
      await load();
      await refresh();
    } catch (e) {
      setNotice({ type: 'error', message: e instanceof Error ? e.message : 'Error al crear usuario.' });
    }
  }

  const branchName = (id: string) => state.clinics.find((c) => c.id === id)?.name ?? id.slice(0, 8);

  return (
    <div className="grid gap-4">
      <Card>
        <PageHeader
          title="Crear usuario"
          subtitle="Define el destino (panel clínica o portal paciente), el rol y la sede."
        />
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Destino del acceso">
            <Select
              value={form.accessType}
              onChange={(e) => setForm({ ...form, accessType: e.target.value as 'clinic' | 'patient' })}
            >
              {ACCESS_TYPES.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </Select>
            <span className="text-xs font-normal text-slate-500">
              {ACCESS_TYPES.find((a) => a.value === form.accessType)?.hint}
            </span>
          </Field>
          <Field label="Rol">
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} disabled={form.accessType === 'patient'}>
              {roleOptions.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </Select>
          </Field>
          {branches.length > 1 ? (
            <Field label="Sede">
              <Select value={activeClinicId} onChange={(e) => setForm({ ...form, clinicId: e.target.value })}>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                    {b.isMainBranch ? ' (principal)' : ''}
                  </option>
                ))}
              </Select>
            </Field>
          ) : null}
          <Field label="Nombre completo">
            <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </Field>
          <Field label="Email">
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Contraseña inicial">
            <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={6} />
          </Field>
          {form.accessType === 'clinic' && form.role !== 'patient' ? (
            <Field label="Nivel de permisos">
              <Select value={form.permission} onChange={(e) => setForm({ ...form, permission: e.target.value })}>
                <option value="read">Lectura</option>
                <option value="write">Edición</option>
                <option value="execute">Administración completa</option>
              </Select>
            </Field>
          ) : null}
          {form.accessType === 'clinic' && form.role === 'dentist' ? (
            <Field label="Especialidad">
              <Input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} />
            </Field>
          ) : null}
          <Button className="md:col-span-2" onClick={() => void createUser()}>
            <UserPlus className="h-4 w-4" /> Crear usuario
          </Button>
        </div>
      </Card>

      <Card>
        <PageHeader title="Usuarios de la organización" subtitle={loading ? 'Cargando…' : `${users.length} cuentas`} />
        <div className="overflow-x-auto">
          <table className="data-table w-full text-sm">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Acceso</th>
                <th>Sede</th>
                <th>Alta</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="font-semibold">{u.full_name}</td>
                  <td>{u.email}</td>
                  <td>
                    <Badge status={u.role === 'patient' ? 'confirmada' : 'pendiente'} label={ROLE_LABELS[u.role] ?? u.role} />
                  </td>
                  <td>
                    {u.role === 'patient' ? (
                      <span className="text-xs">Portal paciente</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs">
                        <Shield className="h-3 w-3" /> Panel clínica
                      </span>
                    )}
                  </td>
                  <td>{branchName(u.clinic_id)}</td>
                  <td>{new Date(u.created_at).toLocaleDateString('es-ES')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && users.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">Aún no hay usuarios. Crea el primero con el formulario superior.</p>
        ) : null}
      </Card>
    </div>
  );
}

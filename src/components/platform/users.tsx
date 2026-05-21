import { useEffect, useMemo, useState } from 'react';
import { Shield, UserPlus } from 'lucide-react';
import { Badge, Button, Card, Field, Input, PageHeader, Select } from '@/components/ui';
import type { PlatformClinic, PlatformClinicUser } from '@/lib/platform/types';
import { PlatformShell } from './PlatformShell';

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    credentials: 'include',
    headers: { 'content-type': 'application/json', ...init?.headers }
  });
  const json = (await res.json()) as { data?: T; error?: { message?: string }; meta?: { message?: string } };
  if (!res.ok) throw new Error(json.error?.message ?? 'Error de servidor');
  return json.data as T;
}

const ACCESS_TYPES = [
  { value: 'clinic', label: 'Panel administrativo de clínica', hint: 'Acceso a /admin' },
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

export function PlatformUsers() {
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'error'; message: string } | null>(null);
  const [clinics, setClinics] = useState<PlatformClinic[]>([]);
  const [users, setUsers] = useState<PlatformClinicUser[]>([]);
  const [filter, setFilter] = useState('');
  const [clinicFilter, setClinicFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    accessType: 'clinic' as 'clinic' | 'patient',
    role: 'receptionist',
    clinicId: '',
    permission: 'write',
    specialty: 'General',
    sendEmail: true
  });

  const activeClinics = useMemo(() => clinics.filter((c) => c.status === 'active'), [clinics]);

  const roleOptions = useMemo(() => {
    if (form.accessType === 'patient') return [{ value: 'patient', label: 'Paciente' }];
    return STAFF_ROLES;
  }, [form.accessType]);

  async function loadUsers(clinicId?: string) {
    setLoading(true);
    try {
      const q = clinicId ? `?clinicId=${encodeURIComponent(clinicId)}` : '';
      const list = await api<PlatformClinicUser[]>(`/api/platform/users${q}`);
      setUsers(list);
    } catch (e) {
      setFeedback({ type: 'error', message: e instanceof Error ? e.message : 'No se pudo cargar.' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void api<PlatformClinic[]>('/api/platform/clinics')
      .then((list) => {
        setClinics(list);
        const firstActive = list.find((c) => c.status === 'active');
        if (firstActive) setForm((f) => ({ ...f, clinicId: f.clinicId || firstActive.id }));
      })
      .catch(() => undefined);
    void loadUsers();
  }, []);

  useEffect(() => {
    void loadUsers(clinicFilter || undefined);
  }, [clinicFilter]);

  useEffect(() => {
    if (form.accessType === 'patient') {
      setForm((prev) => ({ ...prev, role: 'patient' }));
    } else {
      setForm((prev) => (prev.role === 'patient' ? { ...prev, role: 'receptionist' } : prev));
    }
  }, [form.accessType]);

  async function createUser() {
    if (!form.fullName.trim() || !form.email.trim() || !form.clinicId) {
      setFeedback({ type: 'error', message: 'Completa nombre, email y clínica.' });
      return;
    }
    try {
      const res = await fetch('/api/platform/users', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          accessType: form.accessType,
          role: form.accessType === 'patient' ? 'patient' : form.role,
          clinicId: form.clinicId,
          permission: form.permission,
          specialty: form.role === 'dentist' ? form.specialty : undefined,
          sendEmail: form.sendEmail
        })
      });
      const json = (await res.json()) as {
        data?: { emailSent?: boolean };
        error?: { message?: string };
        meta?: { message?: string };
      };
      if (!res.ok) throw new Error(json.error?.message ?? 'No se pudo crear');
      setFeedback({
        type: 'ok',
        message:
          json.meta?.message ??
          `Usuario creado. ${json.data?.emailSent ? 'Credenciales enviadas por email.' : 'No se pudo enviar el correo; revisa la configuración de envío.'}`
      });
      setForm((f) => ({ ...f, fullName: '', email: '' }));
      await loadUsers(clinicFilter || undefined);
    } catch (e) {
      setFeedback({ type: 'error', message: e instanceof Error ? e.message : 'Error al crear usuario.' });
    }
  }

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.full_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.clinic_name.toLowerCase().includes(q)
    );
  }, [users, filter]);

  return (
    <PlatformShell
      title="Usuarios y accesos"
      subtitle="Solo el administrador de plataforma puede crear cuentas de personal y pacientes"
    >
      {feedback ? (
        <p
          className={`mb-4 rounded-xl px-4 py-3 text-sm font-semibold ${
            feedback.type === 'ok' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
          }`}
          role="status"
        >
          {feedback.message}
        </p>
      ) : null}
      <Card className="mb-4">
        <PageHeader
          title="Crear usuario"
          subtitle="Asigna rol, clínica y destino (panel clínica o portal paciente). Se envían credenciales por correo."
        />
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Clínica / sede">
            <Select
              value={form.clinicId}
              onChange={(e) => setForm({ ...form, clinicId: e.target.value })}
              disabled={!activeClinics.length}
            >
              <option value="">Selecciona clínica activa</option>
              {activeClinics.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.slug})
                </option>
              ))}
            </Select>
          </Field>
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
            <span className="text-xs font-normal text-[var(--muted)]">
              {ACCESS_TYPES.find((a) => a.value === form.accessType)?.hint}
            </span>
          </Field>
          <Field label="Rol">
            <Select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              disabled={form.accessType === 'patient'}
            >
              {roleOptions.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Nombre completo">
            <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </Field>
          <Field label="Email">
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
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
          <label className="flex items-center gap-2 text-sm font-semibold md:col-span-2">
            <input
              type="checkbox"
              checked={form.sendEmail}
              onChange={(e) => setForm({ ...form, sendEmail: e.target.checked })}
            />
            Enviar credenciales por email
          </label>
          <Button className="md:col-span-2" onClick={() => void createUser()} disabled={!form.clinicId}>
            <UserPlus className="h-4 w-4" /> Crear usuario
          </Button>
        </div>
      </Card>

      <div className="mb-4 flex flex-wrap gap-3">
        <Input
          className="max-w-md flex-1"
          placeholder="Buscar por nombre, email o clínica…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <div className="max-w-xs">
        <Select
          value={clinicFilter}
          onChange={(e) => setClinicFilter(e.target.value)}
          aria-label="Filtrar por clínica"
        >
          <option value="">Todas las clínicas</option>
          {clinics.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        </div>
      </div>

      <Card>
        <PageHeader title="Cuentas registradas" subtitle={loading ? 'Cargando…' : `${filtered.length} usuarios`} />
        <div className="overflow-x-auto">
          <table className="data-table w-full text-sm">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Acceso</th>
                <th>Clínica</th>
                <th>Alta</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td className="font-semibold">{u.full_name}</td>
                  <td>{u.email}</td>
                  <td>
                    <Badge
                      status={u.role === 'patient' ? 'confirmada' : 'pendiente'}
                      label={ROLE_LABELS[u.role] ?? u.role}
                    />
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
                  <td>
                    {u.clinic_name}
                    <span className="block text-xs text-[var(--muted)]">{u.clinic_slug}</span>
                  </td>
                  <td>{new Date(u.created_at).toLocaleDateString('es-ES')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && !filtered.length ? (
          <p className="mt-4 text-sm text-[var(--muted)]">
            No hay usuarios con este filtro. Crea el primero con el formulario superior.
          </p>
        ) : null}
      </Card>
    </PlatformShell>
  );
}

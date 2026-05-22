import { useEffect, useMemo, useState } from 'react';
import { UserPlus } from 'lucide-react';
import { Badge, Button, Card, Field, Input, PageHeader, Select } from '@/components/ui';
import { useNotice } from '@/hooks/useNotice';

type ClinicUser = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
};

const STAFF_ROLES = [
  { value: 'clinic_admin', label: 'Administrador de clínica' },
  { value: 'dentist', label: 'Dentista' },
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

export function AdminClinicUsers() {
  const { setNotice } = useNotice();
  const [users, setUsers] = useState<ClinicUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    role: 'dentist',
    specialty: 'General',
    permission: 'write',
    sendEmail: true
  });

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/clinic/users', { credentials: 'include' });
      const json = (await res.json()) as { data?: { users?: ClinicUser[] }; error?: { message?: string } };
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

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.full_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    );
  }, [users, filter]);

  async function createUser() {
    if (!form.fullName.trim() || !form.email.trim()) {
      setNotice({ type: 'error', message: 'Completa nombre y email.' });
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
      setForm((f) => ({ ...f, fullName: '', email: '' }));
      await load();
    } catch (e) {
      setNotice({ type: 'error', message: e instanceof Error ? e.message : 'Error al crear.' });
    }
  }

  return (
    <div className="grid gap-4">
      <Card>
        <PageHeader
          title="Usuarios de la clínica"
          subtitle="Asocia profesionales a la clínica. Los dentistas reciben ficha vinculada para agenda propia y acceso PdP."
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
          </Field>
          {form.role === 'dentist' ? (
            <Field label="Especialidad">
              <Input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} />
            </Field>
          ) : null}
          <Button className="md:col-span-2" onClick={() => void createUser()}>
            <UserPlus className="h-4 w-4" /> Dar de alta usuario
          </Button>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Solo personal de clínica (panel /admin). Los pacientes no se dan de alta aquí: entran por reserva online o proceso acordado.
          Al registrar un dentista se crea su ficha en Dentistas y agenda propia.
        </p>
      </Card>

      <Card title={loading ? 'Cargando…' : `${filtered.length} usuarios`}>
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

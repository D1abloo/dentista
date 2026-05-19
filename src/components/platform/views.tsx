import { useEffect, useState } from 'react';
import { ArrowRight, Building2, CheckCircle2, ClipboardList, LifeBuoy, Users } from 'lucide-react';
import { Button, Card, Empty, Field, Input, Select, Textarea } from '@/components/ui';
import { email, required } from '@/lib/validation';
import type { ClinicRegistration, PlatformClinic, PlatformOverview, SupportRequest } from '@/lib/platform/types';
import { PlatformShell } from './PlatformShell';

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, credentials: 'include', headers: { 'content-type': 'application/json', ...init?.headers } });
  const json = (await res.json()) as { data?: T; error?: { message?: string } };
  if (!res.ok) throw new Error(json.error?.message ?? 'Error de servidor');
  return json.data as T;
}

export function PlatformLoginPage() {
  const [emailVal, setEmailVal] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ role: 'super_admin', email: emailVal, password })
    });
    const json = (await res.json()) as { error?: { message?: string } };
    if (!res.ok) {
      setError(json.error?.message ?? 'Acceso denegado');
      return;
    }
    window.location.href = '/platform';
  }

  return (
    <main className="login-portal login-portal--ready min-h-screen grid place-items-center p-4">
      <Card className="w-full max-w-md p-8">
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--teal)]">Dentista+ Platform</p>
        <h1 className="mt-2 font-[family-name:var(--display)] text-2xl font-semibold text-[var(--ink)]">Super Admin</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Acceso restringido al equipo de plataforma.</p>
        <form onSubmit={submit} className="mt-6 grid gap-4">
          <Field label="Email">
            <Input type="email" value={emailVal} onChange={(e) => setEmailVal(e.target.value)} required />
          </Field>
          <Field label="Contraseña">
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </Field>
          {error ? <p className="text-sm font-bold text-rose-600">{error}</p> : null}
          <Button type="submit" className="w-full">
            Entrar al panel
          </Button>
        </form>
      </Card>
    </main>
  );
}

export function PlatformDashboard() {
  const [overview, setOverview] = useState<PlatformOverview | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api<PlatformOverview>('/api/platform/overview')
      .then(setOverview)
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'));
  }, []);

  const stats = [
    { label: 'Clínicas totales', value: overview?.clinicsTotal ?? '—', icon: Building2 },
    { label: 'Clínicas activas', value: overview?.clinicsActive ?? '—', icon: CheckCircle2 },
    { label: 'Registros pendientes', value: overview?.registrationsPending ?? '—', icon: ClipboardList },
    { label: 'Soporte abierto', value: overview?.supportOpen ?? '—', icon: LifeBuoy }
  ];

  return (
    <PlatformShell title="Resumen de plataforma" subtitle="Vista global de clínicas y operaciones">
      {error ? <p className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">{error}</p> : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-5">
            <s.icon className="h-6 w-6 text-[var(--blue)]" aria-hidden />
            <p className="mt-3 text-2xl font-extrabold text-[var(--ink)]">{s.value}</p>
            <p className="text-sm text-[var(--muted)]">{s.label}</p>
          </Card>
        ))}
      </div>
      <Card className="mt-6 p-6" title="Acciones rápidas">
        <div className="flex flex-wrap gap-3">
          <a href="/platform/registros" className="btn btn--primary btn--sm">
            Revisar registros
          </a>
          <a href="/platform/clinicas" className="btn btn--outline btn--sm">
            Gestionar clínicas
          </a>
        </div>
      </Card>
    </PlatformShell>
  );
}

export function PlatformClinics() {
  const [list, setList] = useState<PlatformClinic[]>([]);
  const [msg, setMsg] = useState('');

  async function load() {
    setList(await api<PlatformClinic[]>('/api/platform/clinics'));
  }

  useEffect(() => {
    void load().catch(() => setMsg('No se pudieron cargar las clínicas.'));
  }, []);

  async function patchStatus(id: string, status: PlatformClinic['status']) {
    await api('/api/platform/clinics', { method: 'PATCH', body: JSON.stringify({ clinicId: id, status }) });
    setMsg('Estado actualizado.');
    await load();
  }

  async function patchPlan(id: string, plan: PlatformClinic['subscription_plan']) {
    await api('/api/platform/clinics', { method: 'PATCH', body: JSON.stringify({ clinicId: id, plan }) });
    setMsg('Plan actualizado.');
    await load();
  }

  return (
    <PlatformShell title="Clínicas registradas" subtitle="Activa, suspende o cambia el plan de cada tenant">
      {msg ? <p className="mb-4 text-sm font-bold text-emerald-700">{msg}</p> : null}
      <div className="table-cards">
        {list.map((c) => (
          <Card key={c.id} className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-[var(--ink)]">{c.name}</h3>
                <p className="text-sm text-[var(--muted)]">{c.email ?? '—'} · {c.slug}</p>
                <p className="mt-1 text-xs font-bold uppercase text-[var(--blue)]">{c.status} · plan {c.subscription_plan}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Select className="field-control !w-auto" value={c.status} onChange={(e) => void patchStatus(c.id, e.target.value as PlatformClinic['status'])}>
                  <option value="pending">pending</option>
                  <option value="active">active</option>
                  <option value="suspended">suspended</option>
                  <option value="rejected">rejected</option>
                </Select>
                <Select className="field-control !w-auto" value={c.subscription_plan} onChange={(e) => void patchPlan(c.id, e.target.value as PlatformClinic['subscription_plan'])}>
                  <option value="essential">essential</option>
                  <option value="professional">professional</option>
                  <option value="enterprise">enterprise</option>
                </Select>
              </div>
            </div>
          </Card>
        ))}
        {!list.length ? <Empty title="Sin clínicas" text="Aprueba registros para crear clínicas en producción." /> : null}
      </div>
    </PlatformShell>
  );
}

export function PlatformRegistrations() {
  const [list, setList] = useState<ClinicRegistration[]>([]);
  const [msg, setMsg] = useState('');

  async function load() {
    setList(await api<ClinicRegistration[]>('/api/platform/registrations?status=pending'));
  }

  useEffect(() => {
    void load().catch(() => setMsg('Error al cargar registros.'));
  }, []);

  async function review(id: string, decision: 'approved' | 'rejected') {
    await api('/api/platform/registrations', {
      method: 'POST',
      body: JSON.stringify({ id, decision })
    });
    setMsg(decision === 'approved' ? 'Clínica aprobada y creada.' : 'Solicitud rechazada.');
    await load();
  }

  return (
    <PlatformShell title="Registros de clínicas" subtitle="Aprueba o rechaza nuevas solicitudes">
      {msg ? <p className="mb-4 text-sm font-bold text-emerald-700">{msg}</p> : null}
      <div className="space-y-3">
        {list.map((r) => (
          <Card key={r.id} className="p-4">
            <h3 className="font-bold">{r.clinic_name}</h3>
            <p className="text-sm text-[var(--muted)]">
              {r.owner_name} · {r.email} · {r.phone}
            </p>
            {r.message ? <p className="mt-2 text-sm">{r.message}</p> : null}
            <div className="mt-3 flex gap-2">
              <Button onClick={() => void review(r.id, 'approved')}>Aprobar</Button>
              <Button tone="secondary" onClick={() => void review(r.id, 'rejected')}>
                Rechazar
              </Button>
            </div>
          </Card>
        ))}
        {!list.length ? <Empty title="Sin pendientes" text="No hay solicitudes por revisar." /> : null}
      </div>
    </PlatformShell>
  );
}

export function PlatformSupport() {
  const [list, setList] = useState<SupportRequest[]>([]);

  useEffect(() => {
    void api<SupportRequest[]>('/api/platform/support')
      .then(setList)
      .catch(() => undefined);
  }, []);

  return (
    <PlatformShell title="Soporte" subtitle="Solicitudes de ayuda de clínicas y pacientes">
      <div className="space-y-3">
        {list.map((s) => (
          <Card key={s.id} className="p-4">
            <p className="text-xs font-bold uppercase text-[var(--muted)]">{s.status} · {s.category}</p>
            <h3 className="font-bold">{s.subject}</h3>
            <p className="text-sm text-[var(--muted)]">
              {s.requester_name} · {s.requester_email}
            </p>
            <p className="mt-2 text-sm">{s.body}</p>
          </Card>
        ))}
        {!list.length ? <Empty title="Sin tickets" text="Las solicitudes de contacto aparecerán aquí." /> : null}
      </div>
    </PlatformShell>
  );
}

export function ClinicRegistrationPage() {
  const [form, setForm] = useState({
    clinic_name: '',
    owner_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    message: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    const e1 = required(form.clinic_name, 'Nombre del centro');
    const e2 = required(form.owner_name, 'Responsable');
    const e3 = email(form.email);
    const e4 = required(form.phone, 'Teléfono');
    if (e1) next.clinic_name = e1;
    if (e2) next.owner_name = e2;
    if (e3) next.email = e3;
    if (e4) next.phone = e4;
    setErrors(next);
    if (Object.keys(next).length) return;

    const res = await fetch('/api/public/clinic-registration', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(form)
    });
    const json = (await res.json()) as { error?: { message?: string } };
    if (!res.ok) {
      setErrors({ form: json.error?.message ?? 'No se pudo enviar.' });
      return;
    }
    setSent(true);
  }

  return (
    <main className="cp shell py-12">
      <Card className="mx-auto max-w-xl p-8">
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--teal)]">Alta de clínica</p>
        <h1 className="mt-2 font-[family-name:var(--display)] text-2xl font-semibold">Registra tu centro</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Solicita acceso a Dentista+. Revisamos cada alta manualmente para garantizar aislamiento y seguridad.
        </p>
        {sent ? (
          <p className="mt-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
            Solicitud enviada. Te contactaremos en menos de 24 horas.
          </p>
        ) : (
          <form onSubmit={submit} className="mt-6 grid gap-3">
            <Field label="Nombre del centro" error={errors.clinic_name}>
              <Input value={form.clinic_name} onChange={(e) => setForm({ ...form, clinic_name: e.target.value })} />
            </Field>
            <Field label="Responsable" error={errors.owner_name}>
              <Input value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} />
            </Field>
            <Field label="Email" error={errors.email}>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="Teléfono" error={errors.phone}>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field label="Dirección">
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </Field>
            <Field label="Ciudad">
              <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </Field>
            <Field label="Mensaje">
              <Textarea rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            </Field>
            {errors.form ? <p className="text-sm font-bold text-rose-600">{errors.form}</p> : null}
            <Button type="submit" className="w-full">
              Enviar solicitud
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        )}
      </Card>
    </main>
  );
}

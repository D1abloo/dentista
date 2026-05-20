import { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  LifeBuoy,
  Lock,
  ShieldCheck,
  Users
} from 'lucide-react';
import { Button, Card, Empty, Field, Input, Select, Textarea } from '@/components/ui';
import type {
  ClinicRegistration,
  PlatformClinic,
  PlatformClinicUser,
  PlatformIsolationReport,
  PlatformOverview,
  PlatformSettingRow,
  PlatformSubscription,
  PlatformUsageRow,
  SupportRequest,
  SupportStatus
} from '@/lib/platform/types';
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
    { label: 'Tenants vinculados', value: overview?.tenantsLinked ?? '—', icon: Lock },
    { label: 'Registros pendientes', value: overview?.registrationsPending ?? '—', icon: ClipboardList },
    { label: 'Usuarios staff', value: overview?.staffUsers ?? '—', icon: Users },
    { label: 'Soporte abierto', value: overview?.supportOpen ?? '—', icon: LifeBuoy }
  ];

  return (
    <PlatformShell title="Resumen de plataforma" subtitle="Operación global sin mezclar datos clínicos entre organizaciones">
      {error ? <p className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">{error}</p> : null}
      <Card className="mb-6 border border-[var(--teal)]/30 bg-[var(--teal)]/5 p-5">
        <div className="flex gap-3">
          <Lock className="h-6 w-6 shrink-0 text-[var(--teal)]" />
          <div>
            <p className="font-bold text-[var(--ink)]">Aislamiento por clínica</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Cada alta aprobada genera un tenant propio y credenciales para <strong>/admin</strong>. Los pacientes y el
              personal de una clínica no ven ni contactan a otras organizaciones. Revisa el estado en{' '}
              <a href="/platform/aislamiento" className="font-semibold text-[var(--blue)]">
                Aislamiento
              </a>
              .
            </p>
          </div>
        </div>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
          <a href="/platform/usuarios" className="btn btn--outline btn--sm">
            Usuarios por clínica
          </a>
          <a href="/platform/suscripciones" className="btn btn--outline btn--sm">
            Suscripciones
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
    <PlatformShell title="Clínicas registradas" subtitle="Cada fila es un tenant independiente con panel /admin propio">
      {msg ? <p className="mb-4 text-sm font-bold text-emerald-700">{msg}</p> : null}
      <div className="table-cards">
        {list.map((c) => (
          <Card key={c.id} className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-[var(--ink)]">{c.name}</h3>
                <p className="text-sm text-[var(--muted)]">{c.email ?? '—'} · {c.slug}</p>
                <p className="mt-1 text-xs font-bold uppercase text-[var(--blue)]">{c.status} · plan {c.subscription_plan}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Tenant: {c.tenant_id ? <span className="font-mono">{c.tenant_id.slice(0, 8)}…</span> : 'sin vincular'}
                  {' · '}
                  Panel aislado: <span className="font-semibold">/admin</span>
                </p>
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
    setMsg(
      decision === 'approved'
        ? 'Clínica aprobada. El responsable accede solo a su panel /admin (tenant aislado).'
        : 'Solicitud rechazada.'
    );
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

  async function load() {
    setList(await api<SupportRequest[]>('/api/platform/support'));
  }

  useEffect(() => {
    void load().catch(() => undefined);
  }, []);

  async function patchStatus(id: string, status: SupportStatus) {
    await api('/api/platform/support', { method: 'PATCH', body: JSON.stringify({ id, status }) });
    await load();
  }

  return (
    <PlatformShell title="Soporte" subtitle="Tickets por clínica; el equipo de plataforma responde sin exponer datos cruzados">
      <div className="space-y-3">
        {list.map((s) => (
          <Card key={s.id} className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="text-xs font-bold uppercase text-[var(--muted)]">{s.category}</p>
              <Select className="field-control !w-auto" value={s.status} onChange={(e) => void patchStatus(s.id, e.target.value as SupportStatus)}>
                <option value="open">open</option>
                <option value="in_progress">in_progress</option>
                <option value="resolved">resolved</option>
                <option value="closed">closed</option>
              </Select>
            </div>
            <h3 className="font-bold">{s.subject}</h3>
            <p className="text-sm text-[var(--muted)]">
              {s.requester_name} · {s.requester_email}
              {s.clinic_id ? ` · clínica ${s.clinic_id.slice(0, 8)}…` : ''}
            </p>
            <p className="mt-2 text-sm">{s.body}</p>
          </Card>
        ))}
        {!list.length ? <Empty title="Sin tickets" text="Las solicitudes de contacto aparecerán aquí." /> : null}
      </div>
    </PlatformShell>
  );
}

export function PlatformUsers() {
  const [list, setList] = useState<PlatformClinicUser[]>([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    void api<PlatformClinicUser[]>('/api/platform/users')
      .then(setList)
      .catch(() => undefined);
  }, []);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (u) =>
        u.full_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.clinic_name.toLowerCase().includes(q)
    );
  }, [list, filter]);

  return (
    <PlatformShell title="Usuarios por clínica" subtitle="Personal con acceso al panel; cada fila pertenece a un solo tenant">
      <div className="mb-4">
        <Input placeholder="Buscar por nombre, email o clínica…" value={filter} onChange={(e) => setFilter(e.target.value)} />
      </div>
      <div className="space-y-3">
        {filtered.map((u) => (
          <Card key={u.id} className="p-4">
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                <h3 className="font-bold">{u.full_name}</h3>
                <p className="text-sm text-[var(--muted)]">{u.email}</p>
              </div>
              <span className="rounded-lg bg-[var(--blue)]/10 px-2 py-1 text-xs font-bold uppercase text-[var(--blue)]">{u.role}</span>
            </div>
            <p className="mt-2 text-sm">
              <span className="font-semibold">{u.clinic_name}</span> · {u.clinic_slug} · {u.clinic_status}
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Acceso: /admin · tenant {u.tenant_id ? u.tenant_id.slice(0, 8) + '…' : 'pendiente de vincular'}
            </p>
          </Card>
        ))}
        {!filtered.length ? <Empty title="Sin usuarios staff" text="Aprueba registros para crear el primer administrador de clínica." /> : null}
      </div>
    </PlatformShell>
  );
}

export function PlatformRegistrationHistory() {
  const [list, setList] = useState<ClinicRegistration[]>([]);
  const [status, setStatus] = useState<'all' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    const q = status === 'all' ? '' : `?status=${status}`;
    void api<ClinicRegistration[]>(`/api/platform/registrations${q}`)
      .then(setList)
      .catch(() => undefined);
  }, [status]);

  return (
    <PlatformShell title="Historial de altas" subtitle="Solicitudes ya procesadas">
      <div className="mb-4 flex flex-wrap gap-2">
        {(['all', 'approved', 'rejected'] as const).map((s) => (
          <button
            key={s}
            type="button"
            className={`btn btn--sm ${status === s ? 'btn--primary' : 'btn--outline'}`}
            onClick={() => setStatus(s)}
          >
            {s === 'all' ? 'Todas' : s}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {list.map((r) => (
          <Card key={r.id} className="p-4">
            <p className="text-xs font-bold uppercase text-[var(--muted)]">{r.status}</p>
            <h3 className="font-bold">{r.clinic_name}</h3>
            <p className="text-sm text-[var(--muted)]">
              {r.owner_name} · {r.email}
              {r.clinic_id ? ` · clínica ${r.clinic_id.slice(0, 8)}…` : ''}
            </p>
          </Card>
        ))}
        {!list.length ? <Empty title="Sin registros" text="No hay solicitudes con este filtro." /> : null}
      </div>
    </PlatformShell>
  );
}

export function PlatformSubscriptions() {
  const [list, setList] = useState<PlatformSubscription[]>([]);

  useEffect(() => {
    void api<PlatformSubscription[]>('/api/platform/subscriptions')
      .then(setList)
      .catch(() => undefined);
  }, []);

  return (
    <PlatformShell title="Suscripciones SaaS" subtitle="Plan y estado de facturación por clínica (sin datos de pacientes)">
      <div className="space-y-3">
        {list.map((s) => (
          <Card key={s.id} className="p-4">
            <h3 className="font-bold">{s.clinic_name}</h3>
            <p className="text-sm text-[var(--muted)]">{s.clinic_slug}</p>
            <p className="mt-2 text-sm font-semibold">
              Plan {s.plan} · {s.status} · {s.seats} asientos
            </p>
          </Card>
        ))}
        {!list.length ? <Empty title="Sin suscripciones" text="Se crean al aprobar una clínica." /> : null}
      </div>
    </PlatformShell>
  );
}

export function PlatformIsolation() {
  const [report, setReport] = useState<PlatformIsolationReport | null>(null);

  useEffect(() => {
    void api<PlatformIsolationReport>('/api/platform/isolation')
      .then(setReport)
      .catch(() => undefined);
  }, []);

  return (
    <PlatformShell title="Aislamiento multi-tenant" subtitle="Garantía de que ninguna clínica contacta ni ve datos de otra">
      <Card className="mb-6 p-6" title="Política de plataforma">
        <ul className="list-disc space-y-2 pl-5 text-sm text-[var(--muted)]">
          {(report?.policy ?? []).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </Card>
      {report ? (
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <Card className="p-4 text-center">
            <p className="text-2xl font-extrabold">{report.clinicsWithTenant}</p>
            <p className="text-sm text-[var(--muted)]">Con tenant</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-extrabold text-amber-700">{report.clinicsWithoutTenant}</p>
            <p className="text-sm text-[var(--muted)]">Sin tenant (revisar)</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-extrabold">{report.totalStaff}</p>
            <p className="text-sm text-[var(--muted)]">Usuarios staff</p>
          </Card>
        </div>
      ) : null}
      <div className="space-y-3">
        {report?.clinics.map((c) => (
          <Card key={c.id} className="p-4">
            <div className="flex flex-wrap justify-between gap-2">
              <h3 className="font-bold">{c.name}</h3>
              <span className={`text-xs font-bold uppercase ${c.has_tenant ? 'text-emerald-700' : 'text-amber-700'}`}>
                {c.has_tenant ? 'Aislado' : 'Sin tenant'}
              </span>
            </div>
            <p className="text-sm text-[var(--muted)]">{c.slug} · {c.status}</p>
            <p className="mt-2 text-sm">
              Staff: {c.staff_count} · Perfiles paciente: {c.patient_profiles} · Panel: /admin
            </p>
          </Card>
        ))}
      </div>
    </PlatformShell>
  );
}

export function PlatformSettings() {
  const [rows, setRows] = useState<PlatformSettingRow[]>([]);
  const [msg, setMsg] = useState('');

  async function load() {
    setRows(await api<PlatformSettingRow[]>('/api/platform/settings'));
  }

  useEffect(() => {
    void load().catch(() => undefined);
  }, []);

  async function save(key: 'branding' | 'registration', patch: Record<string, unknown>) {
    const current = rows.find((r) => r.key === key)?.value ?? {};
    await api('/api/platform/settings', { method: 'PATCH', body: JSON.stringify({ key, value: { ...current, ...patch } }) });
    setMsg('Configuración guardada.');
    await load();
  }

  const branding = rows.find((r) => r.key === 'branding')?.value ?? {};
  const registration = rows.find((r) => r.key === 'registration')?.value ?? {};

  return (
    <PlatformShell title="Configuración de plataforma" subtitle="Branding global y reglas de alta de clínicas">
      {msg ? <p className="mb-4 text-sm font-bold text-emerald-700">{msg}</p> : null}
      <Card className="mb-4 p-6" title="Branding">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nombre de la app">
            <Input
              defaultValue={String(branding.appName ?? 'Dentista+')}
              onBlur={(e) => void save('branding', { appName: e.target.value })}
            />
          </Field>
          <Field label="Email de soporte">
            <Input
              type="email"
              defaultValue={String(branding.supportEmail ?? '')}
              onBlur={(e) => void save('branding', { supportEmail: e.target.value })}
            />
          </Field>
        </div>
      </Card>
      <Card className="p-6" title="Registro de clínicas">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            defaultChecked={Boolean(registration.autoApprove)}
            onChange={(e) => void save('registration', { autoApprove: e.target.checked })}
          />
          Aprobar automáticamente (no recomendado en producción)
        </label>
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            defaultChecked={registration.requireEmailVerification !== false}
            onChange={(e) => void save('registration', { requireEmailVerification: e.target.checked })}
          />
          Exigir verificación de email
        </label>
      </Card>
    </PlatformShell>
  );
}

export function PlatformMetrics() {
  const [rows, setRows] = useState<PlatformUsageRow[]>([]);

  useEffect(() => {
    void api<PlatformUsageRow[]>('/api/platform/metrics')
      .then(setRows)
      .catch(() => undefined);
  }, []);

  return (
    <PlatformShell title="Métricas de uso" subtitle="Contadores agregados por clínica y día (sin datos clínicos sensibles)">
      <div className="space-y-3">
        {rows.map((r) => (
          <Card key={`${r.clinic_id}-${r.day}`} className="p-4">
            <h3 className="font-bold">{r.clinic_name}</h3>
            <p className="text-sm text-[var(--muted)]">{r.day}</p>
            <p className="mt-2 text-sm">
              Citas: {r.appointments_count} · Pacientes: {r.patients_count} · Facturas: {r.invoices_count}
            </p>
          </Card>
        ))}
        {!rows.length ? (
          <Empty title="Sin métricas aún" text="Los contadores diarios se rellenan con el uso en producción." />
        ) : null}
      </div>
    </PlatformShell>
  );
}

export function PlatformSecurity() {
  return (
    <PlatformShell title="Seguridad y acceso" subtitle="Capas que impiden el contacto entre clínicas">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-6">
          <ShieldCheck className="h-8 w-8 text-[var(--blue)]" />
          <h3 className="mt-3 font-bold">RLS en Supabase</h3>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Citas, facturas, perfiles y mensajes filtran por <code className="text-xs">clinic_id</code> y{' '}
            <code className="text-xs">tenant_id</code>. Un usuario autenticado solo ve su organización.
          </p>
        </Card>
        <Card className="p-6">
          <Lock className="h-8 w-8 text-[var(--teal)]" />
          <h3 className="mt-3 font-bold">Sesión por rol</h3>
          <p className="mt-2 text-sm text-[var(--muted)]">
            <code className="text-xs">clinic_admin</code> entra a <strong>/admin</strong>.{' '}
            <code className="text-xs">super_admin</code> entra a <strong>/platform</strong>. No hay listados globales de
            pacientes en el panel de clínica.
          </p>
        </Card>
        <Card className="p-6">
          <Users className="h-8 w-8 text-[var(--blue)]" />
          <h3 className="mt-3 font-bold">Sin red social entre clínicas</h3>
          <p className="mt-2 text-sm text-[var(--muted)]">
            No existe buscador de otras clínicas ni mensajería entre tenants. El soporte pasa por tickets aislados por{' '}
            <code className="text-xs">clinic_id</code>.
          </p>
        </Card>
        <Card className="p-6">
          <CreditCard className="h-8 w-8 text-[var(--blue)]" />
          <h3 className="mt-3 font-bold">Alta manual</h3>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Cada solicitud en <a href="/platform/registros">Registros</a> crea tenant, clínica y un único administrador
            antes de activar el panel.
          </p>
        </Card>
      </div>
      <Card className="mt-6 p-6">
        <a href="/platform/aislamiento" className="btn btn--primary btn--sm">
          Ver informe de aislamiento
        </a>
      </Card>
    </PlatformShell>
  );
}


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
  PlatformIsolationReport,
  PlatformOrganization,
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
            Usuarios y accesos
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
    <PlatformShell title="Clínicas registradas" subtitle="Todas las sedes; agrupa por organización en Organizaciones">
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
                  {c.city ? `${c.city} · ` : ''}
                  {c.is_main_branch ? 'Sede principal · ' : 'Sede · '}
                  Tenant {c.tenant_id ? c.tenant_id.slice(0, 8) + '…' : '—'}
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
        ? 'Organización aprobada. Se ha enviado un correo al responsable con usuario y contraseña temporal (debe cambiarla en el primer acceso).'
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
          <h3 className="mt-3 font-bold">Aislamiento por clínica</h3>
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

type BranchDraft = { name: string; address: string; city: string };

export function PlatformOrganizations() {
  const [orgs, setOrgs] = useState<PlatformOrganization[]>([]);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    organizationName: '',
    ownerName: '',
    email: '',
    phone: '',
    address: ''
  });
  const [branches, setBranches] = useState<BranchDraft[]>([
    { name: 'Sede principal', address: '', city: 'Madrid' }
  ]);
  const [addBranch, setAddBranch] = useState<BranchDraft>({ name: '', address: '', city: '' });
  const [addTenantId, setAddTenantId] = useState('');

  async function load() {
    setOrgs(await api<PlatformOrganization[]>('/api/platform/organizations'));
  }

  useEffect(() => {
    void load().catch(() => setMsg('No se pudieron cargar las organizaciones.'));
  }, []);

  async function createOrganization() {
    setLoading(true);
    setMsg('');
    try {
      await api('/api/platform/organizations', {
        method: 'POST',
        body: JSON.stringify({ ...form, branches })
      });
      setMsg('Organización creada con todas sus sedes.');
      setForm({ organizationName: '', ownerName: '', email: '', phone: '', address: '' });
      setBranches([{ name: 'Sede principal', address: '', city: 'Madrid' }]);
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Error al crear.');
    } finally {
      setLoading(false);
    }
  }

  async function addSedeToOrg() {
    if (!addTenantId || !addBranch.name.trim()) return;
    setLoading(true);
    try {
      await api('/api/platform/organizations', {
        method: 'POST',
        body: JSON.stringify({ tenantId: addTenantId, ...addBranch })
      });
      setAddBranch({ name: '', address: '', city: '' });
      setMsg('Sede añadida.');
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Error.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <PlatformShell title="Organizaciones multi-sede" subtitle="Una organización (tenant) con varias clínicas bajo el mismo panel /admin">
      {msg ? <p className="mb-4 text-sm font-bold text-emerald-700">{msg}</p> : null}

      <Card className="mb-6 p-6" title="Crear organización con sedes">
        <p className="mb-4 text-sm text-[var(--muted)]">
          Define la organización y al menos una sede. Se crea un tenant compartido, credenciales de administrador y suscripción por sede.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Nombre organización">
            <Input value={form.organizationName} onChange={(e) => setForm({ ...form, organizationName: e.target.value })} />
          </Field>
          <Field label="Responsable">
            <Input value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} />
          </Field>
          <Field label="Email admin">
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Teléfono">
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field label="Dirección fiscal" className="md:col-span-2">
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Field>
        </div>
        <p className="mt-4 text-sm font-bold text-[var(--navy)]">Sedes iniciales</p>
        <ul className="mt-2 space-y-2">
          {branches.map((b, i) => (
            <li key={i} className="grid gap-2 rounded-xl border border-[var(--line)] p-3 md:grid-cols-3">
              <Input placeholder="Nombre sede" value={b.name} onChange={(e) => setBranches(branches.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
              <Input placeholder="Dirección" value={b.address} onChange={(e) => setBranches(branches.map((x, j) => (j === i ? { ...x, address: e.target.value } : x)))} />
              <Input placeholder="Ciudad" value={b.city} onChange={(e) => setBranches(branches.map((x, j) => (j === i ? { ...x, city: e.target.value } : x)))} />
            </li>
          ))}
        </ul>
        <Button tone="secondary" className="mt-2" onClick={() => setBranches([...branches, { name: `Sede ${branches.length + 1}`, address: '', city: '' }])}>
          + Añadir otra sede al formulario
        </Button>
        <Button className="mt-4" disabled={loading} onClick={() => void createOrganization()}>
          Crear organización
        </Button>
      </Card>

      <div className="space-y-4">
        {orgs.map((org) => (
          <Card key={org.tenant_id} className="p-4">
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                <h3 className="font-bold text-[var(--ink)]">{org.tenant_name}</h3>
                <p className="text-sm text-[var(--muted)]">
                  {org.branch_count} sede{org.branch_count === 1 ? '' : 's'}
                  {org.tenant_code ? ` · ${org.tenant_code}` : ''}
                </p>
              </div>
            </div>
            <ul className="org-branch-list mt-3">
              {org.branches.map((b) => (
                <li key={b.id} className="org-branch-list__item">
                  <div className="org-branch-list__btn" style={{ cursor: 'default' }}>
                    <span className="font-semibold">{b.name}</span>
                    {b.is_main_branch ? <span className="org-branch-list__badge">Principal</span> : null}
                    <span className="text-xs text-[var(--muted)]">
                      {b.city ?? '—'} · {b.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        ))}
        {!orgs.length ? <Empty title="Sin organizaciones" text="Crea la primera organización con el formulario superior." /> : null}
      </div>

      {orgs.length ? (
        <Card className="mt-6 p-6" title="Añadir sede a organización existente">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Organización">
              <Select value={addTenantId} onChange={(e) => setAddTenantId(e.target.value)}>
                <option value="">Selecciona…</option>
                {orgs.filter((o) => !o.tenant_id.startsWith('orphan-')).map((o) => (
                  <option key={o.tenant_id} value={o.tenant_id}>
                    {o.tenant_name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Nombre sede">
              <Input value={addBranch.name} onChange={(e) => setAddBranch({ ...addBranch, name: e.target.value })} />
            </Field>
            <Field label="Ciudad">
              <Input value={addBranch.city} onChange={(e) => setAddBranch({ ...addBranch, city: e.target.value })} />
            </Field>
            <Field label="Dirección">
              <Input value={addBranch.address} onChange={(e) => setAddBranch({ ...addBranch, address: e.target.value })} />
            </Field>
          </div>
          <Button className="mt-3" tone="secondary" disabled={loading || !addTenantId} onClick={() => void addSedeToOrg()}>
            Añadir sede
          </Button>
        </Card>
      ) : null}
    </PlatformShell>
  );
}


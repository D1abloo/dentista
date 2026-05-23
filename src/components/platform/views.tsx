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

export { PlatformDashboard } from './PlatformDashboard';

export { PlatformClinics } from './PlatformClinics';

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

export { PlatformIsolation } from './PlatformIsolation';

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

export { PlatformOrganizations } from './PlatformOrganizations';


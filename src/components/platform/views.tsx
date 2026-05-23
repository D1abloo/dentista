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

export { PlatformRegistrations } from './PlatformRegistrations';

export { PlatformSupport } from './PlatformSupport';

export { PlatformRegistrationHistory } from './PlatformRegistrationHistory';

export { PlatformSubscriptions } from './PlatformSubscriptions';

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

export { PlatformMetrics } from './PlatformMetrics';

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


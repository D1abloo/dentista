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

export { PlatformSettings } from './PlatformSettings';

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


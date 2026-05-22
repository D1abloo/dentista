import type { PlatformOrganization } from '@/lib/platform/types';
import type { PlatformClinic } from '@/lib/platform/types';

export type OrganizationRow = PlatformOrganization & {
  tenant_slug: string;
  admin_email: string;
  plan_label: string;
  status: 'active' | 'pending' | 'suspended';
  phone: string;
  last_activity: string;
  isolation_ok: boolean;
  pending_setup: boolean;
};

function clinic(
  id: string,
  tenantId: string,
  name: string,
  slug: string,
  city: string,
  address: string,
  main = false
): PlatformClinic {
  return {
    id,
    name,
    slug,
    email: 'admin@grupodentalnova.com',
    phone: '+34 910 200 100',
    address,
    city,
    status: 'active',
    subscription_plan: 'enterprise',
    tenant_id: tenantId,
    is_main_branch: main,
    created_at: '2025-01-10',
    approved_at: '2025-01-12'
  };
}

let demoStore: OrganizationRow[] = [
  {
    tenant_id: 'demo-tenant-nova',
    tenant_name: 'Grupo Dental Nova',
    tenant_code: 'TEN-NOVA',
    tenant_slug: 'grupo-nova',
    branch_count: 3,
    admin_email: 'admin@grupodentalnova.com',
    plan_label: 'PRO Multi-sede',
    status: 'active',
    phone: '+34 910 200 100',
    last_activity: 'Hoy, 10:35',
    isolation_ok: true,
    pending_setup: false,
    branches: [
      clinic('c1', 'demo-tenant-nova', 'Sede principal — Madrid', 'nova-madrid', 'Madrid', 'Calle Mayor 12', true),
      clinic('c2', 'demo-tenant-nova', 'Sede Barcelona', 'nova-bcn', 'Barcelona', 'Av. Diagonal 200'),
      clinic('c3', 'demo-tenant-nova', 'Sede Valencia', 'nova-val', 'Valencia', 'Calle Colón 8')
    ]
  },
  {
    tenant_id: 'demo-tenant-plus',
    tenant_name: 'Dental Plus Group',
    tenant_code: 'TEN-PLUS',
    tenant_slug: 'dental-plus',
    branch_count: 2,
    admin_email: 'contacto@dentalplus.com',
    plan_label: 'Básico',
    status: 'active',
    phone: '+34 910 300 200',
    last_activity: 'Ayer, 16:22',
    isolation_ok: true,
    pending_setup: false,
    branches: [
      clinic('c4', 'demo-tenant-plus', 'Sede central', 'plus-central', 'Madrid', 'Paseo de la Castellana 50', true),
      clinic('c5', 'demo-tenant-plus', 'Sede Sur', 'plus-sur', 'Sevilla', 'Av. de la Constitución 22')
    ]
  }
];

export function getOrganizationsDemo(): OrganizationRow[] {
  return demoStore.map((o) => ({ ...o, branches: [...o.branches] }));
}

export function getOrganizationsKpis(orgs: OrganizationRow[]) {
  const sedes = orgs.reduce((s, o) => s + o.branch_count, 0);
  const pending = orgs.filter((o) => o.pending_setup).length;
  return {
    organizations: orgs.length,
    sedes,
    tenantsActive: orgs.filter((o) => o.status === 'active').length,
    admins: orgs.length,
    pending
  };
}

export function addOrganizationDemo(row: OrganizationRow) {
  demoStore = [row, ...demoStore];
  return row;
}

export function planLabel(plan: string) {
  if (plan === 'enterprise') return 'PRO Multi-sede';
  if (plan === 'professional') return 'Pro';
  return 'Básico';
}

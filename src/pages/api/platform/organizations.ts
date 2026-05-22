import type { APIRoute } from 'astro';
import { requireSuperAdmin } from '@/lib/platform/auth';
import { listOrganizations } from '@/lib/platform/service';
import { createBranch, createOrganizationWithBranches } from '@/lib/services/branches';
import { fail, ok } from '@/lib/http';
import { logError } from '@/lib/logger';
import { organizationCreateSchema, platformBranchCreateSchema } from '@/lib/validators';
import { hasSupabaseConfig } from '@/lib/supabaseServer';
import {
  addOrganizationDemo,
  getOrganizationsDemo,
  planLabel,
  type OrganizationRow
} from '@/lib/platform/organizationsDemo';

export const prerender = false;

function mapLiveOrgs(orgs: Awaited<ReturnType<typeof listOrganizations>>): OrganizationRow[] {
  return orgs.map((o) => {
    const main = o.branches[0];
    const slug = (o.tenant_code ?? main?.slug ?? 'tenant').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return {
      ...o,
      tenant_slug: slug,
      admin_email: main?.email ?? '—',
      plan_label: planLabel(main?.subscription_plan ?? 'essential'),
      status: (main?.status === 'suspended' ? 'suspended' : main?.status === 'pending' ? 'pending' : 'active') as OrganizationRow['status'],
      phone: main?.phone ?? '—',
      last_activity: main?.approved_at?.slice(0, 10) ?? main?.created_at?.slice(0, 10) ?? '—',
      isolation_ok: !o.tenant_id.startsWith('orphan-'),
      pending_setup: o.branches.some((b) => b.status === 'pending')
    };
  });
}

export const GET: APIRoute = async (context) => {
  const gate = requireSuperAdmin(context);
  if (gate.response) return gate.response;
  if (!hasSupabaseConfig()) return ok(getOrganizationsDemo(), { demo: true });
  try {
    return ok(mapLiveOrgs(await listOrganizations()));
  } catch (error) {
    logError('platform.organizations.list', error);
    return fail('No se pudieron listar las organizaciones.', 500);
  }
};

export const POST: APIRoute = async (context) => {
  const gate = requireSuperAdmin(context);
  if (gate.response) return gate.response;
  if (!hasSupabaseConfig()) {
    try {
      const body = await context.request.json();
      const parsed = organizationCreateSchema.safeParse(body);
      if (!parsed.success) return fail('Payload inválido.', 422);
      const slug = (body.tenantSlug as string | undefined)?.trim() || 'org-' + Date.now().toString(36);
      const exists = getOrganizationsDemo().some((o) => o.tenant_slug === slug);
      if (exists) return fail('El identificador del tenant ya existe.', 409);
      const row: OrganizationRow = {
        tenant_id: 'demo-' + slug,
        tenant_name: parsed.data.organizationName,
        tenant_code: slug.toUpperCase(),
        tenant_slug: slug,
        branch_count: parsed.data.branches.length,
        admin_email: parsed.data.email,
        plan_label: planLabel((body.plan as string) ?? 'essential'),
        status: 'active',
        phone: parsed.data.phone,
        last_activity: 'Ahora',
        isolation_ok: Boolean(body.isolationEnabled ?? true),
        pending_setup: false,
        branches: parsed.data.branches.map((b, i) => ({
          id: `demo-${slug}-${i}`,
          name: b.name,
          slug: `${slug}-${i}`,
          email: parsed.data.email,
          phone: b.phone ?? parsed.data.phone,
          address: b.address ?? null,
          city: b.city ?? null,
          status: 'active',
          subscription_plan: ((body.plan as string) ?? 'essential') as 'essential' | 'professional' | 'enterprise',
          tenant_id: 'demo-' + slug,
          is_main_branch: i === 0,
          created_at: new Date().toISOString(),
          approved_at: new Date().toISOString()
        }))
      };
      addOrganizationDemo(row);
      return ok(row, { message: 'Organización creada (modo demo).' });
    } catch (error) {
      logError('platform.organizations.demo', error);
      return fail('No se pudo crear la organización.', 500);
    }
  }
  try {
    const body = await context.request.json();
    const orgParsed = organizationCreateSchema.safeParse(body);
    if (orgParsed.success) {
      const result = await createOrganizationWithBranches(orgParsed.data);
      return ok(result, { message: 'Organización creada con sus sedes.' });
    }
    const branchParsed = platformBranchCreateSchema.safeParse(body);
    if (branchParsed.success) {
      const branch = await createBranch(branchParsed.data.tenantId, branchParsed.data);
      return ok(branch, { message: 'Sede añadida a la organización.' });
    }
    return fail('Payload inválido.', 422);
  } catch (error) {
    logError('platform.organizations.create', error);
    return fail('No se pudo crear la organización o sede.', 500);
  }
};

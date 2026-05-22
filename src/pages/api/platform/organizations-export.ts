import type { APIRoute } from 'astro';
import { requireSuperAdmin } from '@/lib/platform/auth';
import { listOrganizations } from '@/lib/platform/service';
import { getOrganizationsDemo } from '@/lib/platform/organizationsDemo';
import { hasSupabaseConfig } from '@/lib/supabaseServer';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const gate = requireSuperAdmin(context);
  if (gate.response) return gate.response;

  const orgs = hasSupabaseConfig() ? await listOrganizations() : getOrganizationsDemo();
  const lines = [
    'Organización,Tenant,Sedes,Admin,Estado',
    ...orgs.map((o) => {
      const slug = 'tenant_slug' in o ? (o as { tenant_slug?: string }).tenant_slug : o.tenant_code ?? '';
      const email = 'admin_email' in o ? (o as { admin_email?: string }).admin_email : '';
      const status = 'status' in o ? (o as { status?: string }).status : 'active';
      return `"${o.tenant_name}","${slug}",${o.branch_count},"${email}",${status}`;
    })
  ];
  return new Response(lines.join('\n'), {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="organizaciones.csv"'
    }
  });
};

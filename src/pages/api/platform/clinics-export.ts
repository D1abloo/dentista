import type { APIRoute } from 'astro';
import { requireSuperAdmin } from '@/lib/platform/auth';
import { listClinics } from '@/lib/platform/service';
import { getClinicsDemo, planLabel } from '@/lib/platform/clinicsDemo';
import { hasSupabaseConfig } from '@/lib/supabaseServer';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const gate = requireSuperAdmin(context);
  if (gate.response) return gate.response;

  const raw = hasSupabaseConfig() ? await listClinics() : getClinicsDemo();
  const lines = [
    'Clínica,Email,Slug,Tenant,Plan,Estado,Ciudad',
    ...raw.map((c) => {
      const plan = 'plan_label' in c ? (c as { plan_label: string }).plan_label : planLabel(c.subscription_plan);
      const tenant = c.tenant_id ? c.tenant_id.slice(0, 8) + '…' : '—';
      return `"${c.name}","${c.email ?? ''}","${c.slug}","${tenant}","${plan}",${c.status},"${c.city ?? ''}"`;
    })
  ];
  return new Response(lines.join('\n'), {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="clinicas.csv"'
    }
  });
};

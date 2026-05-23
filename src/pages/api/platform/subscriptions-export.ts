import type { APIRoute } from 'astro';
import { requireSuperAdmin } from '@/lib/platform/auth';
import { getSubscriptionsDemo } from '@/lib/platform/subscriptionsDemo';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const gate = requireSuperAdmin(context);
  if (gate.response) return gate.response;

  const rows = getSubscriptionsDemo();
  const lines = [
    'Clínica,Tenant,Plan,Estado,Asientos,Renovación,Facturación,Email facturación',
    ...rows.map(
      (r) =>
        `"${r.clinic_name}","${r.tenant_slug}","${r.plan_label}","${r.status_label}","${r.seats_used}/${r.seats_contracted}","${r.renewal_label}","${r.billing_label}","${r.billing_email}"`
    )
  ];

  return new Response(lines.join('\n'), {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="suscripciones-saas.csv"'
    }
  });
};

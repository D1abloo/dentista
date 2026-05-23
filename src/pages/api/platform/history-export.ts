import type { APIRoute } from 'astro';
import { requireSuperAdmin } from '@/lib/platform/auth';
import { getHistoryDemo } from '@/lib/platform/historyDemo';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const gate = requireSuperAdmin(context);
  if (gate.response) return gate.response;

  const rows = getHistoryDemo();
  const lines = [
    'Clínica,Responsable,Decisión,Tenant,Plan,Procesado por,Fecha',
    ...rows.map(
      (r) =>
        `"${r.clinic_name}","${r.owner_name}","${r.decision_label}","${r.tenant_slug}","${r.plan_label}","${r.processed_by}","${r.decision_date_label}"`
    )
  ];

  return new Response(lines.join('\n'), {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="historial-altas.csv"'
    }
  });
};

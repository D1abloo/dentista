import type { APIRoute } from 'astro';
import { requireSuperAdmin } from '@/lib/platform/auth';
import { fetchPlatformOverview } from '@/lib/platform/service';
import { buildPlatformDashboard } from '@/lib/platform/buildDashboard';
import { hasSupabaseConfig } from '@/lib/supabaseServer';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const gate = requireSuperAdmin(context);
  if (gate.response) return gate.response;

  const range = context.url.searchParams.get('range') ?? '30';
  const overview = hasSupabaseConfig()
    ? await fetchPlatformOverview().catch(() => null)
    : null;
  const dash = buildPlatformDashboard(overview, { useDemo: !overview });

  const lines = [
    'Informe plataforma AgendaClinic',
    `Periodo: ultimos ${range} dias`,
    `Generado: ${new Date().toISOString()}`,
    '',
    'KPIs',
    `Clinicas totales,${dash.overview.clinicsTotal}`,
    `Clinicas activas,${dash.overview.clinicsActive}`,
    `Usuarios staff,${dash.overview.staffUsers}`,
    `Registros pendientes,${dash.overview.registrationsPending}`,
    `Tickets abiertos,${dash.overview.supportOpen}`,
    `MRR estimado,${dash.overview.mrr}`,
    `Tenants aislados,${dash.overview.tenantsLinked}/${dash.overview.tenantsTotal}`,
    '',
    'Actividad reciente',
    ...dash.activity.map((a) => `${a.at},${a.module},${a.title}`)
  ];

  const csv = lines.join('\n');
  return new Response(csv, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="informe-plataforma-${range}d.csv"`
    }
  });
};

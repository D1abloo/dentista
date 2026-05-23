import type { APIRoute } from 'astro';
import { requireSuperAdmin } from '@/lib/platform/auth';
import { getMetricsDemo } from '@/lib/platform/metricsDemo';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const gate = requireSuperAdmin(context);
  if (gate.response) return gate.response;

  const data = getMetricsDemo();
  const lines = [
    'Clínica,Tenant,Usuarios activos,Sesiones,Eventos,Última actividad,Estado,Módulo principal',
    ...data.clinics.map(
      (c) =>
        `"${c.clinic_name}","${c.tenant_slug}",${c.active_users},${c.sessions},${c.events},"${c.last_activity}","${c.status_label}","${c.top_module}"`
    ),
    '',
    'Módulo,Eventos',
    ...data.module_usage.map((m) => `"${m.label}",${m.events}`)
  ];

  return new Response(lines.join('\n'), {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="metricas-uso.csv"'
    }
  });
};

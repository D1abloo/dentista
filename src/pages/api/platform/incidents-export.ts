import type { APIRoute } from 'astro';
import { requireSuperAdmin } from '@/lib/platform/auth';
import { getIncidentsDemo } from '@/lib/platform/incidentsDemo';
import { hasSupabaseConfig } from '@/lib/supabaseServer';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const gate = requireSuperAdmin(context);
  if (gate.response) return gate.response;

  const rows = getIncidentsDemo();
  const lines = [
    'Fecha,Usuario,Clínica,Paciente,Modo,Evento,Riesgo,Estado,Ruta,IP',
    ...rows.map((r) =>
      `"${r.date_label}","${r.actor_name}","${r.clinic_name}","${r.patient_name ?? '—'}","${r.mode}","${r.event_label}","${r.risk}","${r.status}","${r.route}","${r.ip}"`
    )
  ];
  if (hasSupabaseConfig()) {
    try {
      const { listPlatformInspectAudit } = await import('@/lib/services/platformInspect');
      const audit = await listPlatformInspectAudit();
      for (const r of audit) {
        lines.push(`"${r.created_at}","${r.actor_email}","${r.clinic_id ?? ''}","${r.patient_id ?? ''}","${r.inspect_mode}","${r.event_type}","","","${r.page_path ?? ''}",""`);
      }
    } catch {
      /* demo rows already included */
    }
  }
  return new Response(lines.join('\n'), {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="auditoria-incidencias.csv"'
    }
  });
};

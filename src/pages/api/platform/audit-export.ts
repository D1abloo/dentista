import type { APIRoute } from 'astro';
import { requireSuperAdmin } from '@/lib/platform/auth';
import { getAuditDemo } from '@/lib/platform/auditDemo';
import { logPlatformAudit } from '@/lib/platform/platformAudit';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const gate = requireSuperAdmin(context);
  if (gate.response) return gate.response;

  await logPlatformAudit({ action: 'audit.exported', entity: 'audit_log', metadata: { format: 'csv' } });

  const data = getAuditDemo();
  const lines = [
    'Código,Fecha,Actor,Rol,Clínica,Tenant,Módulo,Acción,Recurso,Riesgo,Resultado,IP',
    ...data.events.map(
      (e) =>
        `"${e.event_code}","${e.date_label}","${e.actor_name}","${e.actor_role}","${e.clinic_name}","${e.tenant_masked}","${e.module}","${e.action}","${e.resource_masked}","${e.risk_label}","${e.result_label}","${e.ip}"`
    )
  ];

  return new Response(lines.join('\n'), {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="auditoria-plataforma.csv"'
    }
  });
};

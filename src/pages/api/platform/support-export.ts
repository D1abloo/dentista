import type { APIRoute } from 'astro';
import { requireSuperAdmin } from '@/lib/platform/auth';
import { getSupportTicketsDemo } from '@/lib/platform/supportDemo';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const gate = requireSuperAdmin(context);
  if (gate.response) return gate.response;

  const rows = getSupportTicketsDemo();
  const lines = [
    'Ticket,Asunto,Origen,Clínica,Solicitante,Email,Prioridad,Estado,Última actividad,Responsable',
    ...rows.map(
      (r) =>
        `"${r.ticket_code}","${r.subject}","${r.origin_label}","${r.clinic_name}","${r.requester_name}","${r.requester_email}","${r.priority_label}","${r.status_label}","${r.last_activity_label}","${r.assignee_name}"`
    )
  ];

  return new Response(lines.join('\n'), {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="soporte-plataforma.csv"'
    }
  });
};

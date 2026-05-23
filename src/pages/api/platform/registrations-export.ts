import type { APIRoute } from 'astro';
import { requireSuperAdmin } from '@/lib/platform/auth';
import { listRegistrations } from '@/lib/platform/service';
import { getRegistrationsDemo } from '@/lib/platform/registrationsDemo';
import { hasSupabaseConfig } from '@/lib/supabaseServer';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const gate = requireSuperAdmin(context);
  if (gate.response) return gate.response;

  const raw = hasSupabaseConfig()
    ? (await listRegistrations()).map((r) => ({
        clinic_name: r.clinic_name,
        owner_name: r.owner_name,
        email: r.email,
        phone: r.phone,
        city: r.city ?? '',
        status: r.status,
        date: r.created_at
      }))
    : getRegistrationsDemo();

  const lines = [
    'Clínica,Responsable,Email,Teléfono,Ciudad,Plan,Estado,Fecha',
    ...raw.map((r) => {
      const plan = 'requested_plan' in r ? (r as { requested_plan: string }).requested_plan : '—';
      const status = 'status_label' in r ? (r as { status_label: string }).status_label : r.status;
      const date = 'date_label' in r ? (r as { date_label: string }).date_label : r.date;
      return `"${r.clinic_name}","${r.owner_name}","${r.email}","${r.phone}","${r.city ?? ''}","${plan}","${status}","${date}"`;
    })
  ];

  return new Response(lines.join('\n'), {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="solicitudes-registro.csv"'
    }
  });
};

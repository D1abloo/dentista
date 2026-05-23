import type { APIRoute } from 'astro';
import { requireSuperAdmin } from '@/lib/platform/auth';
import { getIsolationDemo } from '@/lib/platform/isolationDemo';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const gate = requireSuperAdmin(context);
  if (gate.response) return gate.response;

  const data = getIsolationDemo();
  const lines = [
    'Clínica,Tenant,Estado,RLS,Usuarios,Pacientes,Riesgo,Última revisión',
    ...data.clinics.map(
      (c) =>
        `"${c.name}","${c.slug}","${c.status_label}","${c.rls_label}",${c.staff_count},${c.patient_count},"${c.risk}","${c.last_review}"`
    ),
    '',
    'Prueba,Estado',
    ...data.tests.map((t) => `"${t.label}","${t.status === 'ok' ? 'Correcto' : 'Fallo'}"`)
  ];
  return new Response(lines.join('\n'), {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="informe-aislamiento.csv"'
    }
  });
};

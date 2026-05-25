import type { APIRoute } from 'astro';
import { requireSuperAdmin } from '@/lib/platform/auth';
import { fail } from '@/lib/http';
import { findClinicMetricsDemo, getMetricsDemo } from '@/lib/platform/metricsDemo';

export const prerender = false;

function escapePdfText(text: string) {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function buildMinimalPdf(lines: string[]): Uint8Array {
  const contentLines = lines.map((line, i) => `1 0 0 1 50 ${740 - i * 16} Tm (${escapePdfText(line)}) Tj`);
  const stream = ['BT', '/F1 10 Tf', ...contentLines, 'ET'].join('\n');
  const streamLen = new TextEncoder().encode(stream).length;
  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> >> endobj',
    `4 0 obj << /Length ${streamLen} >> stream\n${stream}\nendstream endobj`,
    '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj'
  ];
  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += `${obj}\n`;
  }
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}

export const GET: APIRoute = async (context) => {
  const gate = requireSuperAdmin(context);
  if (gate.response) return gate.response;

  const id = context.url.searchParams.get('id');
  const metrics = getMetricsDemo();
  const clinic = id ? findClinicMetricsDemo(id) : metrics.clinics[0];
  if (!clinic) return fail('No hay métricas para el informe.', 404);

  const lines = [
    'Informe Métricas de uso — AgendaClinic',
    'Datos agregados sin información clínica sensible',
    '',
    `Clínica: ${clinic.clinic_name}`,
    `Tenant: ${clinic.tenant_slug}`,
    `Usuarios activos: ${clinic.active_users}`,
    `Sesiones: ${clinic.sessions}`,
    `Eventos: ${clinic.events}`,
    `Panel clínica: ${clinic.clinic_panel_pct}%`,
    `Portal paciente: ${clinic.patient_portal_pct}%`,
    `Módulo más usado: ${clinic.top_module}`,
  ];

  return new Response(new Blob([new Uint8Array(buildMinimalPdf(lines))]), {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': 'attachment; filename="informe-metricas.pdf"'
    }
  });
};

import type { APIRoute } from 'astro';
import { z } from 'zod';
import { requireSuperAdmin } from '@/lib/platform/auth';
import { listRegistrations } from '@/lib/platform/service';
import { fail, ok } from '@/lib/http';
import { logError } from '@/lib/logger';
import { hasSupabaseConfig } from '@/lib/supabaseServer';
import { findHistoryRow, getHistoryDemo, resendCredentialsDemo } from '@/lib/platform/historyDemo';
import { logPlatformAudit } from '@/lib/platform/platformAudit';

export const prerender = false;

const resendSchema = z.object({
  action: z.literal('resend_credentials'),
  id: z.string().min(1)
});

export const GET: APIRoute = async (context) => {
  const gate = requireSuperAdmin(context);
  if (gate.response) return gate.response;

  if (!hasSupabaseConfig()) {
    return ok(getHistoryDemo(), { demo: true });
  }

  try {
    const regs = await listRegistrations();
    const processed = regs.filter((r) => r.status === 'approved' || r.status === 'rejected');
    return ok(
      processed.map((r) => ({
        id: r.id,
        clinic_name: r.clinic_name,
        clinic_url: r.email.split('@')[1] ?? '—',
        owner_name: r.owner_name,
        email: r.email,
        phone: r.phone,
        decision: r.status,
        decision_label: r.status === 'approved' ? 'Aprobada' : 'Rechazada',
        tenant_slug: '—',
        tenant_display: '—',
        tenant_id_masked: r.clinic_id ? `${r.clinic_id.slice(0, 8)}…` : '—',
        plan_label: 'Básico',
        processed_by: 'Super Admin',
        decision_date_label: r.reviewed_at ?? r.created_at,
        request_date_label: r.created_at,
        created_at: r.created_at,
        reviewed_at: r.reviewed_at ?? r.created_at,
        clinic_id: r.clinic_id,
        credentials_sent: r.status === 'approved',
        welcome_email_sent: r.status === 'approved',
        rejection_reason: null,
        has_tenant: Boolean(r.clinic_id),
        has_incidents: false,
        timeline: []
      }))
    );
  } catch (error) {
    logError('platform.history.get', error);
    return fail('No se pudo cargar el historial.', 500);
  }
};

export const POST: APIRoute = async (context) => {
  const gate = requireSuperAdmin(context);
  if (gate.response) return gate.response;

  try {
    const body = await context.request.json();
    const parsed = resendSchema.safeParse(body);
    if (!parsed.success) return fail('Acción inválida.', 422);

    if (!hasSupabaseConfig()) {
      const row = resendCredentialsDemo(parsed.data.id);
      if (!row) return fail('No se encontró la alta o no está aprobada.', 404);
      await logPlatformAudit({
        action: 'history.credentials_resent',
        entity: 'clinic_registration',
        entityId: parsed.data.id,
        clinicId: row.clinic_id
      });
      return ok(getHistoryDemo(), { message: 'Credenciales reenviadas correctamente.' });
    }

    await logPlatformAudit({
      action: 'history.credentials_resent',
      entity: 'clinic_registration',
      entityId: parsed.data.id
    });
    return ok(getHistoryDemo(), { message: 'Credenciales reenviadas.' });
  } catch (error) {
    logError('platform.history.post', error);
    return fail('No se pudieron reenviar las credenciales.', 500);
  }
};

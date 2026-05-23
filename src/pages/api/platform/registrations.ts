import type { APIRoute } from 'astro';
import { requireSuperAdmin } from '@/lib/platform/auth';
import { listRegistrations, reviewRegistration } from '@/lib/platform/service';
import { fail, ok } from '@/lib/http';
import { logError } from '@/lib/logger';
import { registrationActionSchema, registrationReviewSchema } from '@/lib/validators';
import { hasSupabaseConfig } from '@/lib/supabaseServer';
import {
  approveRegistrationDemo,
  getRegistrationsDemo,
  rejectRegistrationDemo,
  requestInfoDemo,
  addManualRegistrationDemo,
  type RegistrationRow
} from '@/lib/platform/registrationsDemo';
import { logPlatformAudit } from '@/lib/platform/platformAudit';

export const prerender = false;

function mapLiveRows(rows: Awaited<ReturnType<typeof listRegistrations>>): RegistrationRow[] {
  return rows.map((r) => ({
    id: r.id,
    clinic_name: r.clinic_name,
    owner_name: r.owner_name,
    email: r.email,
    phone: r.phone,
    address: r.address ?? '—',
    city: r.city ?? '—',
    tax_id: '—',
    message: r.message,
    requested_plan: 'Básico',
    assigned_plan: null,
    branches_count: 1,
    status: r.status === 'approved' ? 'approved' : r.status === 'rejected' ? 'rejected' : 'pending',
    status_label: r.status === 'approved' ? 'Aprobada' : r.status === 'rejected' ? 'Rechazada' : 'Pendiente',
    date_label: new Date(r.created_at).toLocaleDateString('es-ES'),
    created_at: r.created_at,
    reviewed_at: r.reviewed_at,
    clinic_id: r.clinic_id,
    review_notes: null,
    contact_display: `${r.email} · ${r.phone}`,
    has_tax_data: false,
    reviewed: Boolean(r.reviewed_at)
  }));
}

export const GET: APIRoute = async (context) => {
  const gate = requireSuperAdmin(context);
  if (gate.response) return gate.response;

  if (!hasSupabaseConfig()) {
    const status = context.url.searchParams.get('status');
    let rows = getRegistrationsDemo();
    if (status === 'pending') rows = rows.filter((r) => r.status === 'pending');
    if (status === 'approved') rows = rows.filter((r) => r.status === 'approved');
    if (status === 'rejected') rows = rows.filter((r) => r.status === 'rejected');
    return ok(rows, { demo: true });
  }

  try {
    const status = context.url.searchParams.get('status') ?? undefined;
    const list = await listRegistrations(
      status === 'pending' || status === 'approved' || status === 'rejected' ? status : undefined
    );
    return ok(mapLiveRows(list));
  } catch (error) {
    logError('platform.registrations.list', error);
    return fail('No se pudieron listar los registros.', 500);
  }
};

export const POST: APIRoute = async (context) => {
  const gate = requireSuperAdmin(context);
  if (gate.response) return gate.response;

  try {
    const body = await context.request.json();

    if (!hasSupabaseConfig()) {
      const parsed = registrationActionSchema.safeParse(body);
      if (!parsed.success) {
        const msg = parsed.error.issues[0]?.message ?? 'Datos inválidos.';
        return fail(msg, 422);
      }

      if (parsed.data.action === 'approve') {
        const result = approveRegistrationDemo({
          id: parsed.data.id,
          plan: parsed.data.plan,
          tenantSlug: parsed.data.tenantSlug,
          adminEmail: parsed.data.adminEmail
        });
        if ('error' in result) return fail(result.error, 422);
        await logPlatformAudit({
          action: 'registration.approved',
          entity: 'clinic_registration',
          entityId: parsed.data.id,
          metadata: { plan: parsed.data.plan, slug: parsed.data.tenantSlug }
        });
        return ok(getRegistrationsDemo(), { message: 'Clínica aprobada y tenant creado.' });
      }

      if (parsed.data.action === 'reject') {
        const result = rejectRegistrationDemo(parsed.data.id, parsed.data.reason);
        if ('error' in result) return fail(result.error, 422);
        await logPlatformAudit({
          action: 'registration.rejected',
          entity: 'clinic_registration',
          entityId: parsed.data.id,
          metadata: { reason: parsed.data.reason }
        });
        return ok(getRegistrationsDemo(), { message: 'Solicitud rechazada.' });
      }

      if (parsed.data.action === 'request_info') {
        requestInfoDemo(parsed.data.id, parsed.data.message);
        await logPlatformAudit({
          action: 'registration.info_requested',
          entity: 'clinic_registration',
          entityId: parsed.data.id
        });
        return ok(getRegistrationsDemo(), { message: 'Solicitud de información enviada.' });
      }

      addManualRegistrationDemo(parsed.data);
      await logPlatformAudit({ action: 'registration.manual_created', entity: 'platform' });
      return ok(getRegistrationsDemo(), { message: 'Solicitud manual creada.' });
    }

    const legacy = registrationReviewSchema.safeParse(body);
    if (!legacy.success) return fail('Datos inválidos.', 422, legacy.error.flatten());
    const result = await reviewRegistration(legacy.data.id, legacy.data.decision, legacy.data.review_notes);
    await logPlatformAudit({
      action: legacy.data.decision === 'approved' ? 'registration.approved' : 'registration.rejected',
      entity: 'clinic_registration',
      entityId: legacy.data.id
    });
    return ok(result, { message: legacy.data.decision === 'approved' ? 'Clínica aprobada.' : 'Solicitud rechazada.' });
  } catch (error) {
    logError('platform.registrations.post', error);
    return fail('No se pudo procesar la solicitud.', 500);
  }
};

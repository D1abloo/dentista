import type { APIRoute } from 'astro';
import { z } from 'zod';
import { requireSuperAdmin } from '@/lib/platform/auth';
import { listClinics, setClinicPlan, setClinicStatus } from '@/lib/platform/service';
import { fail, ok } from '@/lib/http';
import { logError } from '@/lib/logger';
import { clinicPlanSchema, clinicStatusSchema } from '@/lib/validators';
import { hasSupabaseConfig } from '@/lib/supabaseServer';
import {
  addClinicDemo,
  getClinicsDemo,
  planLabel,
  slugExists,
  updateClinicDemo,
  type ClinicListRow
} from '@/lib/platform/clinicsDemo';
import { logPlatformAudit } from '@/lib/platform/platformAudit';

export const prerender = false;

const clinicUpsertSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'Introduce el nombre de la clínica.'),
  email: z.string().email('Introduce un email válido.'),
  slug: z.string().min(2, 'El slug de la clínica es obligatorio.').regex(/^[a-z0-9-]+$/, 'Slug inválido.'),
  plan: z.enum(['essential', 'professional', 'enterprise'], { message: 'Selecciona un plan.' }),
  city: z.string().max(80).optional(),
  phone: z.string().max(40).optional(),
  tenantId: z.string().uuid().optional().nullable()
});

function mapLive(rows: Awaited<ReturnType<typeof listClinics>>): ClinicListRow[] {
  return rows.map((c) => ({
    ...c,
    organization_label: c.tenant_id ? 'Organización vinculada' : 'Independiente',
    tenant_display: c.tenant_id ? `${c.tenant_id.slice(0, 8)}…` : '—',
    plan_label: planLabel(c.subscription_plan),
    activity_label: c.approved_at
      ? new Date(c.approved_at).toLocaleDateString('es-ES')
      : new Date(c.created_at).toLocaleDateString('es-ES'),
    staff_count: 0,
    patients_count: 0,
    appointments_month: 0,
    pending_invoices: 0,
    isolation_ok: Boolean(c.tenant_id)
  }));
}

export const GET: APIRoute = async (context) => {
  const gate = requireSuperAdmin(context);
  if (gate.response) return gate.response;
  if (!hasSupabaseConfig()) return ok(getClinicsDemo(), { demo: true });
  try {
    return ok(mapLive(await listClinics()));
  } catch (error) {
    logError('platform.clinics.list', error);
    return fail('No se pudieron listar las clínicas.', 500);
  }
};

export const POST: APIRoute = async (context) => {
  const gate = requireSuperAdmin(context);
  if (gate.response) return gate.response;
  try {
    const body = await context.request.json();
    const parsed = clinicUpsertSchema.safeParse(body);
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);
    }
    const { id, name, email, slug, plan, city, phone, tenantId } = parsed.data;

    if (!hasSupabaseConfig()) {
      if (slugExists(slug, id)) return fail('El slug de la clínica ya existe.', 409);
      if (id) {
        const updated = updateClinicDemo(id, {
          name: name.trim(),
          email: email.trim(),
          slug,
          subscription_plan: plan,
          plan_label: planLabel(plan),
          city: city ?? null,
          phone: phone ?? null,
          tenant_id: tenantId ?? null,
          tenant_display: tenantId ? `${tenantId.slice(0, 8)}…` : '—',
          organization_label: tenantId ? 'Organización vinculada' : 'Independiente'
        });
        if (!updated) return fail('No se pudo guardar la clínica.', 404);
        await logPlatformAudit({
          action: 'clinic.updated',
          entity: 'clinic',
          entityId: id,
          clinicId: id,
          metadata: { name, plan, slug }
        });
        return ok(updated, { message: 'Clínica actualizada.' });
      }
      const row: ClinicListRow = {
        id: crypto.randomUUID(),
        name: name.trim(),
        slug,
        email: email.trim(),
        phone: phone ?? null,
        address: null,
        city: city ?? 'Madrid',
        status: 'active',
        subscription_plan: plan,
        tenant_id: tenantId ?? 'demo-tenant-' + slug,
        is_main_branch: true,
        created_at: new Date().toISOString(),
        approved_at: new Date().toISOString(),
        organization_label: 'Independiente',
        tenant_display: tenantId ? `${tenantId.slice(0, 8)}…` : slug.slice(0, 8) + '…',
        plan_label: planLabel(plan),
        activity_label: 'Ahora',
        staff_count: 1,
        patients_count: 0,
        appointments_month: 0,
        pending_invoices: 0,
        isolation_ok: true
      };
      addClinicDemo(row);
      await logPlatformAudit({
        action: 'clinic.created',
        entity: 'clinic',
        entityId: row.id,
        clinicId: row.id,
        metadata: { name, plan, slug }
      });
      return ok(row, { message: 'Clínica creada (modo demo).' });
    }

    return fail('Crea la clínica desde registros pendientes con Supabase configurado.', 501);
  } catch (error) {
    logError('platform.clinics.post', error);
    return fail('No se pudo guardar la clínica.', 500);
  }
};

export const PATCH: APIRoute = async (context) => {
  const gate = requireSuperAdmin(context);
  if (gate.response) return gate.response;
  try {
    const body = await context.request.json();
    const statusParsed = clinicStatusSchema.safeParse(body);
    if (statusParsed.success) {
      const { clinicId, status } = statusParsed.data;
      if (!hasSupabaseConfig()) {
        const updated = updateClinicDemo(clinicId, { status });
        if (!updated) return fail('Clínica no encontrada.', 404);
        await logPlatformAudit({
          action: 'clinic.status_changed',
          entity: 'clinic',
          entityId: clinicId,
          clinicId,
          metadata: { status }
        });
        return ok(updated);
      }
      await setClinicStatus(clinicId, status);
      await logPlatformAudit({
        action: 'clinic.status_changed',
        entity: 'clinic',
        entityId: clinicId,
        clinicId,
        metadata: { status }
      });
      return ok({ updated: true, field: 'status' });
    }
    const planParsed = clinicPlanSchema.safeParse(body);
    if (planParsed.success) {
      const { clinicId, plan } = planParsed.data;
      if (!hasSupabaseConfig()) {
        const updated = updateClinicDemo(clinicId, {
          subscription_plan: plan,
          plan_label: planLabel(plan)
        });
        if (!updated) return fail('Clínica no encontrada.', 404);
        await logPlatformAudit({
          action: 'clinic.plan_changed',
          entity: 'clinic',
          entityId: clinicId,
          clinicId,
          metadata: { plan }
        });
        return ok(updated);
      }
      await setClinicPlan(clinicId, plan);
      await logPlatformAudit({
        action: 'clinic.plan_changed',
        entity: 'clinic',
        entityId: clinicId,
        clinicId,
        metadata: { plan }
      });
      return ok({ updated: true, field: 'plan' });
    }
    return fail('Payload inválido.', 422);
  } catch (error) {
    logError('platform.clinics.patch', error);
    return fail('No se pudo actualizar la clínica.', 500);
  }
};

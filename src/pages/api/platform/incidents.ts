import type { APIRoute } from 'astro';
import { z } from 'zod';
import { requireSuperAdmin } from '@/lib/platform/auth';
import { fail, ok } from '@/lib/http';
import { logError } from '@/lib/logger';
import { hasSupabaseConfig } from '@/lib/supabaseServer';
import {
  addIncidentDemo,
  DEMO_PATIENTS,
  getIncidentsDemo,
  REVIEW_TYPES,
  updateIncidentDemo,
  type InspectionRow,
  type ModeKey
} from '@/lib/platform/incidentsDemo';
import { logPlatformAudit } from '@/lib/platform/platformAudit';
import { startClinicInspect, startPatientPortalInspect } from '@/lib/services/platformInspect';
import { platformInspectCookieName } from '@/lib/auth/platformInspect';
import { portalAccessCookieName } from '@/lib/auth/portalAccess';

export const prerender = false;

const startReviewSchema = z.object({
  clinicId: z.string().min(1, 'Selecciona una clínica.'),
  reviewType: z.enum(
    ['clinic_panel', 'patient_portal', 'billing', 'documents', 'users', 'isolation', 'security'],
    { message: 'Selecciona el tipo de revisión.' }
  ),
  patientId: z.string().optional(),
  reason: z.string().min(3, 'Indica el motivo de la revisión.'),
  duration: z.string().optional(),
  auditConfirmed: z.boolean().refine((v) => v === true, { message: 'Debes confirmar que la revisión será auditada.' })
});

const patchSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('mark_reviewed'), id: z.string().min(1) }),
  z.object({ action: z.literal('escalate'), id: z.string().min(1) })
]);

function modeLabel(key: string) {
  return REVIEW_TYPES.find((t) => t.value === key)?.label ?? key;
}

export const GET: APIRoute = async (context) => {
  const gate = requireSuperAdmin(context);
  if (gate.response) return gate.response;
  if (!hasSupabaseConfig()) return ok(getIncidentsDemo(), { demo: true });
  try {
    const { listPlatformInspectAudit } = await import('@/lib/services/platformInspect');
    const audit = await listPlatformInspectAudit();
    const mapped: InspectionRow[] = audit.map((r) => ({
      id: r.id,
      date_label: new Date(r.created_at).toLocaleString('es-ES'),
      created_at: r.created_at,
      actor_name: r.actor_name ?? r.actor_email,
      actor_role: r.access_role,
      actor_initials: 'SA',
      is_system: false,
      clinic_name: 'Clínica',
      clinic_slug: '',
      clinic_id: r.clinic_id ?? '',
      patient_name: null,
      patient_id: r.patient_id,
      mode: r.inspect_mode,
      mode_key: 'clinic_panel',
      event_label: r.event_type,
      resource_label: r.resource_label ?? '',
      route: r.page_path ?? '',
      ip: '—',
      device: '—',
      reason: '—',
      actions_done: r.event_type,
      risk: 'low',
      status: 'registered',
      priority: 'normal'
    }));
    return ok(mapped);
  } catch (error) {
    logError('platform.incidents.list', error);
    return fail('No se pudo cargar el registro.', 500);
  }
};

export const POST: APIRoute = async (context) => {
  const gate = requireSuperAdmin(context);
  if (gate.response) return gate.response;
  try {
    const body = await context.request.json();
    const parsed = startReviewSchema.safeParse(body);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);

    const { clinicId, reviewType, patientId, reason, duration } = parsed.data;
    if (reviewType === 'patient_portal' && !patientId) {
      return fail('Selecciona un paciente para revisar el portal paciente.', 422);
    }

    const patient = DEMO_PATIENTS.find((p) => p.id === patientId);
    const actor = gate.user;

    if (!hasSupabaseConfig()) {
      const row: InspectionRow = {
        id: crypto.randomUUID(),
        date_label: 'Ahora',
        created_at: new Date().toISOString(),
        actor_name: actor.name ?? 'Super Admin',
        actor_role: 'Super administrador',
        actor_initials: 'SA',
        is_system: false,
        clinic_name: 'Clínica Dental Nova',
        clinic_slug: 'clinica-dental-nova',
        clinic_id: clinicId,
        patient_name: patient?.name ?? null,
        patient_id: patientId ?? null,
        mode: modeLabel(reviewType as ModeKey),
        mode_key: reviewType as ModeKey,
        event_label: 'Revisión iniciada',
        resource_label: `Sesión ${duration ?? '15'} min`,
        route: reviewType === 'patient_portal' ? '/paciente' : '/admin',
        ip: '185.23.45.67',
        device: 'Chrome · Windows 10',
        reason,
        actions_done: 'Inicio de revisión segura',
        risk: reviewType === 'patient_portal' ? 'medium' : 'low',
        status: 'pending',
        priority: 'normal'
      };
      addIncidentDemo(row);
      await logPlatformAudit({
        action: 'incident.review_started',
        entity: 'inspection',
        entityId: row.id,
        clinicId,
        metadata: { reviewType, reason, patientId }
      });
      const redirect = reviewType === 'patient_portal' ? '/paciente' : reviewType === 'clinic_panel' ? '/admin' : undefined;
      return ok({ row, redirect }, { message: 'Revisión iniciada y registrada.' });
    }

    if (reviewType === 'clinic_panel') {
      const result = await startClinicInspect({
        superAdminEmail: actor.email,
        superAdminName: actor.name,
        clinicId
      });
      context.cookies.set(platformInspectCookieName, result.cookie, {
        httpOnly: true,
        sameSite: 'lax',
        secure: import.meta.env.PROD,
        path: '/',
        maxAge: 60 * 60 * 4
      });
      return ok({ redirect: result.redirect });
    }

    if (reviewType === 'patient_portal' && patientId) {
      const result = await startPatientPortalInspect({
        superAdminEmail: actor.email,
        superAdminName: actor.name,
        clinicId,
        patientId,
        label: patient?.name
      });
      context.cookies.set(platformInspectCookieName, result.inspectCookie, {
        httpOnly: true,
        sameSite: 'lax',
        secure: import.meta.env.PROD,
        path: '/',
        maxAge: 60 * 60 * 4
      });
      context.cookies.set(portalAccessCookieName, result.pdpCookie, {
        httpOnly: true,
        sameSite: 'lax',
        secure: import.meta.env.PROD,
        path: '/',
        maxAge: 60 * 60 * 4
      });
      return ok({ redirect: result.redirect });
    }

    return ok({ logged: true }, { message: 'Revisión registrada.' });
  } catch (error) {
    logError('platform.incidents.post', error);
    return fail('No se pudo iniciar la revisión.', 500);
  }
};

export const PATCH: APIRoute = async (context) => {
  const gate = requireSuperAdmin(context);
  if (gate.response) return gate.response;
  try {
    const body = await context.request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return fail('Acción inválida.', 422);

    if (!hasSupabaseConfig()) {
      const { id, action } = parsed.data;
      if (action === 'mark_reviewed') {
        const u = updateIncidentDemo(id, { status: 'reviewed' });
        if (!u) return fail('Incidencia no encontrada.', 404);
        await logPlatformAudit({ action: 'incident.marked_reviewed', entity: 'inspection', entityId: id, clinicId: u.clinic_id });
        return ok(u);
      }
      const u = updateIncidentDemo(id, { status: 'escalated', priority: 'high', risk: 'high' });
      if (!u) return fail('Incidencia no encontrada.', 404);
      await logPlatformAudit({ action: 'incident.escalated', entity: 'inspection', entityId: id, clinicId: u.clinic_id });
      return ok(u);
    }

    return fail('Acción disponible en modo demo.', 501);
  } catch (error) {
    logError('platform.incidents.patch', error);
    return fail('No se pudo actualizar la incidencia.', 500);
  }
};

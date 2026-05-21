import type { APIRoute } from 'astro';
import { platformInspectCookieName } from '@/lib/auth/platformInspect';
import { portalAccessCookieName } from '@/lib/auth/portalAccess';
import { requireSuperAdmin } from '@/lib/platform/auth';
import { fail, ok } from '@/lib/http';
import { logError } from '@/lib/logger';
import {
  listPlatformInspectAudit,
  logPlatformInspectEvent,
  startClinicInspect,
  startPatientPortalInspect
} from '@/lib/services/platformInspect';
import { getPlatformInspectSession } from '@/lib/auth/platformInspect';
import { hasSupabaseConfig } from '@/lib/supabaseServer';
import { z } from 'zod';

export const prerender = false;

const inspectSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('clinic'),
    clinicId: z.string().uuid()
  }),
  z.object({
    action: z.literal('patient_portal'),
    clinicId: z.string().uuid(),
    patientId: z.string().uuid(),
    label: z.string().max(120).optional()
  })
]);

export const GET: APIRoute = async (context) => {
  const gate = requireSuperAdmin(context);
  if (gate.response) return gate.response;
  if (!hasSupabaseConfig()) return fail('Servicio no disponible.', 503);
  try {
    return ok({ audit: await listPlatformInspectAudit() });
  } catch (error) {
    logError('platform.inspect.list', error);
    return fail('No se pudo cargar el registro de inspección.', 500);
  }
};

export const POST: APIRoute = async (context) => {
  const gate = requireSuperAdmin(context);
  if (gate.response) return gate.response;
  if (!hasSupabaseConfig()) return fail('Servicio no disponible.', 503);

  try {
    const body = await context.request.json();
    const parsed = inspectSchema.safeParse(body);
    if (!parsed.success) return fail('Datos inválidos.', 422, parsed.error.flatten());

    const actor = gate.user;

    if (parsed.data.action === 'clinic') {
      const result = await startClinicInspect({
        superAdminEmail: actor.email,
        superAdminName: actor.name,
        clinicId: parsed.data.clinicId
      });
      context.cookies.set(platformInspectCookieName, result.cookie, {
        httpOnly: true,
        sameSite: 'lax',
        secure: import.meta.env.PROD,
        path: '/',
        maxAge: 60 * 60 * 4
      });
      return ok({ redirect: result.redirect, clinicName: result.clinicName });
    }

    const result = await startPatientPortalInspect({
      superAdminEmail: actor.email,
      superAdminName: actor.name,
      clinicId: parsed.data.clinicId,
      patientId: parsed.data.patientId,
      label: parsed.data.label
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
  } catch (error) {
    logError('platform.inspect.post', error);
    return fail(error instanceof Error ? error.message : 'No se pudo iniciar la inspección.', 500);
  }
};

export const PATCH: APIRoute = async (context) => {
  const gate = requireSuperAdmin(context);
  if (gate.response) return gate.response;
  const inspect = getPlatformInspectSession(context.cookies);
  if (!inspect) return fail('No hay inspección activa.', 403);
  try {
    const body = (await context.request.json()) as {
      eventType?: string;
      pagePath?: string;
      resourceLabel?: string;
    };
    await logPlatformInspectEvent({
      actorEmail: inspect.superAdminEmail,
      actorName: inspect.superAdminName,
      accessRole: inspect.accessRole,
      inspectMode: inspect.mode,
      clinicId: inspect.clinicId,
      tenantId: inspect.tenantId,
      patientId: inspect.patientId,
      eventType: body.eventType ?? 'nav_click',
      pagePath: body.pagePath,
      resourceLabel: body.resourceLabel
    });
    return ok({ logged: true });
  } catch (error) {
    logError('platform.inspect.patch', error);
    return fail('No se pudo registrar el evento.', 500);
  }
};

export const DELETE: APIRoute = async (context) => {
  const gate = requireSuperAdmin(context);
  if (gate.response) return gate.response;
  context.cookies.delete(platformInspectCookieName, { path: '/' });
  context.cookies.delete(portalAccessCookieName, { path: '/' });
  return ok({ closed: true });
};

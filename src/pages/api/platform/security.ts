import type { APIRoute } from 'astro';
import { requireSuperAdmin } from '@/lib/platform/auth';
import { fail, ok } from '@/lib/http';
import { logError } from '@/lib/logger';
import { securityActionSchema } from '@/lib/validators';
import { hasSupabaseConfig } from '@/lib/supabaseServer';
import { logPlatformAudit } from '@/lib/platform/platformAudit';
import {
  getSecurityDemo,
  revokeSessionDemo,
  runPolicyTestDemo,
  runSecurityReviewDemo,
  updatePolicySettingsDemo
} from '@/lib/platform/securityDemo';
import { addIncidentDemo } from '@/lib/platform/incidentsDemo';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const gate = requireSuperAdmin(context);
  if (gate.response) return gate.response;
  return ok(getSecurityDemo(), { demo: !hasSupabaseConfig() });
};

export const POST: APIRoute = async (context) => {
  const gate = requireSuperAdmin(context);
  if (gate.response) return gate.response;

  try {
    const body = await context.request.json();
    const parsed = securityActionSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? 'Datos inválidos.';
      return fail(msg, 422);
    }

    const data = parsed.data;

    if (data.action === 'run_review') {
      const result = runSecurityReviewDemo();
      await logPlatformAudit({
        action: 'security.review_run',
        entity: 'platform_security',
        metadata: { passed: result.passed }
      });
      if (!result.passed) {
        addIncidentDemo({
          id: `sec-${Date.now()}`,
          date_label: 'Hoy',
          created_at: new Date().toISOString(),
          actor_name: 'Sistema',
          actor_role: 'Seguridad',
          actor_initials: '⚙',
          is_system: true,
          clinic_name: 'Plataforma',
          clinic_slug: 'platform',
          clinic_id: 'platform',
          patient_name: null,
          patient_id: null,
          mode: 'Seguridad',
          mode_key: 'security',
          event_label: 'Revisión de seguridad con incidencias',
          resource_label: 'Políticas RLS',
          route: '/platform/seguridad',
          ip: '—',
          device: 'Automático',
          reason: 'Test de aislamiento fallido',
          actions_done: 'Revisión automática',
          risk: 'high',
          status: 'critical',
          priority: 'critical'
        });
      }
      return ok(result.payload, { message: result.message });
    }

    if (data.action === 'revoke_session') {
      const result = revokeSessionDemo(data.sessionId);
      if ('error' in result) return fail(result.error, 422);
      await logPlatformAudit({
        action: 'security.session_revoked',
        entity: 'session',
        entityId: data.sessionId
      });
      return ok(result, { message: 'Sesión revocada correctamente.' });
    }

    if (data.action === 'update_policies') {
      const payload = updatePolicySettingsDemo(data.policies);
      await logPlatformAudit({
        action: 'security.policies_updated',
        entity: 'platform_security',
        metadata: data.policies
      });
      return ok(payload, { message: 'Políticas guardadas.' });
    }

    if (data.action === 'run_policy_test') {
      const result = runPolicyTestDemo(data.policyId);
      await logPlatformAudit({
        action: 'security.policy_test',
        entity: 'policy',
        entityId: data.policyId,
        metadata: { ok: result.ok }
      });
      if (!result.ok) return fail(result.message, 422);
      return ok(getSecurityDemo(), { message: result.message });
    }

    return fail('Acción no reconocida.', 400);
  } catch (error) {
    logError('platform.security.post', error);
    return fail('No se pudieron guardar las políticas.', 500);
  }
};

import type { APIRoute } from 'astro';
import { z } from 'zod';
import { requireSuperAdmin } from '@/lib/platform/auth';
import { fetchIsolationReport } from '@/lib/platform/service';
import { fail, ok } from '@/lib/http';
import { logError } from '@/lib/logger';
import { hasSupabaseConfig } from '@/lib/supabaseServer';
import {
  escalateIsolationDemo,
  getIsolationDemo,
  runClinicTestDemo,
  runVerificationDemo,
  updatePoliciesDemo
} from '@/lib/platform/isolationDemo';
import { logPlatformAudit } from '@/lib/platform/platformAudit';
import { addIncidentDemo } from '@/lib/platform/incidentsDemo';

export const prerender = false;

const actionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('verify') }),
  z.object({ action: z.literal('test'), clinicId: z.string().min(1) }),
  z.object({ action: z.literal('escalate'), clinicId: z.string().min(1) }),
  z.object({ action: z.literal('update_policies'), policies: z.record(z.string(), z.boolean()) })
]);

function mapLiveReport(report: Awaited<ReturnType<typeof fetchIsolationReport>>) {
  const demo = getIsolationDemo();
  return {
    ...demo,
    kpis: {
      withTenant: report.clinicsWithTenant,
      withoutTenant: report.clinicsWithoutTenant,
      isolatedTenants: `${report.clinicsWithTenant} / ${Math.max(report.clinicsWithTenant, 1)}`,
      rlsRules: 12,
      staffUsers: report.totalStaff,
      isolationIncidents: 0
    },
    clinics: report.clinics.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      tenant_id: c.tenant_id,
      tenant_display: c.tenant_id ? `${c.tenant_id.slice(0, 8)}…` : '—',
      status_label: c.has_tenant ? ('Aislado' as const) : ('Sin tenant' as const),
      rls_label: c.has_tenant ? ('Activo' as const) : ('Pendiente' as const),
      staff_count: c.staff_count,
      patient_count: c.patient_profiles,
      last_review: '—',
      risk: c.has_tenant ? ('low' as const) : ('medium' as const),
      has_tenant: c.has_tenant,
      rls_active: c.has_tenant,
      protected_tables: 12,
      incidents: c.has_tenant ? 0 : 1,
      panel_path: '/admin',
      portal_isolated: c.has_tenant
    }))
  };
}

export const GET: APIRoute = async (context) => {
  const gate = requireSuperAdmin(context);
  if (gate.response) return gate.response;
  if (!hasSupabaseConfig()) return ok(getIsolationDemo(), { demo: true });
  try {
    return ok(mapLiveReport(await fetchIsolationReport()));
  } catch (error) {
    logError('platform.isolation.get', error);
    return fail('No se pudo cargar el informe de aislamiento.', 500);
  }
};

export const POST: APIRoute = async (context) => {
  const gate = requireSuperAdmin(context);
  if (gate.response) return gate.response;
  try {
    const body = await context.request.json();
    const parsed = actionSchema.safeParse(body);
    if (!parsed.success) return fail('Acción inválida.', 422);

    if (!hasSupabaseConfig()) {
      if (parsed.data.action === 'verify') {
        const data = runVerificationDemo();
        await logPlatformAudit({ action: 'isolation.verify', entity: 'platform', metadata: { coverage: data.coverage } });
        return ok(data, { message: 'Verificación completada sin incidencias.' });
      }
      if (parsed.data.action === 'test') {
        const data = runClinicTestDemo(parsed.data.clinicId);
        await logPlatformAudit({ action: 'isolation.test', entity: 'clinic', entityId: parsed.data.clinicId, clinicId: parsed.data.clinicId });
        return ok(data, { message: 'Pruebas de aislamiento correctas.' });
      }
      if (parsed.data.action === 'escalate') {
        const data = escalateIsolationDemo(parsed.data.clinicId);
        addIncidentDemo({
          id: 'iso-' + Date.now(),
          date_label: 'Ahora',
          created_at: new Date().toISOString(),
          actor_name: 'Super Admin',
          actor_role: 'Super administrador',
          actor_initials: 'SA',
          is_system: false,
          clinic_name: 'Clínica Dental Nova',
          clinic_slug: 'clinica-dental-nova',
          clinic_id: parsed.data.clinicId,
          patient_name: null,
          patient_id: null,
          mode: 'Seguridad',
          mode_key: 'security',
          event_label: 'Incidencia de aislamiento escalada',
          resource_label: 'Política RLS',
          route: '/platform/aislamiento',
          ip: '185.23.45.67',
          device: 'Chrome · Windows 10',
          reason: 'Escalado manual',
          actions_done: 'Incidencia registrada',
          risk: 'high',
          status: 'critical',
          priority: 'critical'
        });
        await logPlatformAudit({ action: 'isolation.escalated', entity: 'clinic', entityId: parsed.data.clinicId, clinicId: parsed.data.clinicId });
        return ok(data, { message: 'Incidencia escalada.' });
      }
      const data = updatePoliciesDemo(parsed.data.policies);
      await logPlatformAudit({ action: 'isolation.policies_updated', entity: 'platform', metadata: parsed.data.policies });
      return ok(data, { message: 'Políticas actualizadas.' });
    }

    if (parsed.data.action === 'verify') {
      const data = runVerificationDemo();
      return ok(data);
    }
    return fail('Acción disponible en modo demo.', 501);
  } catch (error) {
    logError('platform.isolation.post', error);
    return fail('No se pudo ejecutar la acción.', 500);
  }
};

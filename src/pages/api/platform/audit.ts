import type { APIRoute } from 'astro';
import { requireSuperAdmin } from '@/lib/platform/auth';
import { fail, ok } from '@/lib/http';
import { logError } from '@/lib/logger';
import { auditActionSchema } from '@/lib/validators';
import { hasSupabaseConfig } from '@/lib/supabaseServer';
import { logPlatformAudit } from '@/lib/platform/platformAudit';
import {
  escalateAuditDemo,
  getAuditDemo,
  markAuditReviewedDemo,
  refreshAuditDemo,
  updateAuditRetentionDemo
} from '@/lib/platform/auditDemo';
import { addIncidentDemo } from '@/lib/platform/incidentsDemo';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const gate = requireSuperAdmin(context);
  if (gate.response) return gate.response;

  try {
    if (!hasSupabaseConfig()) return ok(getAuditDemo(), { demo: true });
    const { listDemoPlatformAudit } = await import('@/lib/platform/platformAudit');
    const logs = listDemoPlatformAudit();
    if (logs.length) return ok(getAuditDemo(), { demo: true, merged: true });
    return ok(getAuditDemo(), { demo: true });
  } catch (error) {
    logError('platform.audit.list', error);
    return fail('No se pudo cargar la auditoría.', 500);
  }
};

export const POST: APIRoute = async (context) => {
  const gate = requireSuperAdmin(context);
  if (gate.response) return gate.response;

  try {
    const body = await context.request.json();
    const parsed = auditActionSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? 'Datos inválidos.';
      return fail(msg, 422);
    }

    const data = parsed.data;

    if (data.action === 'refresh') {
      return ok(refreshAuditDemo(), { message: 'Auditoría actualizada.' });
    }

    if (data.action === 'mark_reviewed') {
      const result = markAuditReviewedDemo(data.id);
      if ('error' in result) return fail(result.error, 422);
      await logPlatformAudit({ action: 'audit.mark_reviewed', entity: 'audit_event', entityId: data.id });
      return ok(result, { message: 'Evento marcado como revisado.' });
    }

    if (data.action === 'escalate') {
      const result = escalateAuditDemo(data.id);
      if ('error' in result) return fail(result.error, 422);
      const ev = result.events.find((e) => e.id === data.id);
      addIncidentDemo({
        id: `inc-${data.id}`,
        date_label: ev?.date_label ?? 'Hoy',
        created_at: new Date().toISOString(),
        actor_name: ev?.actor_name ?? 'Sistema',
        actor_role: ev?.actor_role ?? '—',
        actor_initials: '⚙',
        is_system: false,
        clinic_name: ev?.clinic_name ?? '—',
        clinic_slug: ev?.tenant_slug ?? '',
        clinic_id: 'a0e9a6b1-4c2d-4a1f-9b3e-000000000001',
        patient_name: null,
        patient_id: null,
        mode: ev?.module ?? 'Seguridad',
        mode_key: 'security',
        event_label: `Escalado: ${ev?.action ?? 'evento'}`,
        resource_label: ev?.resource_masked ?? '—',
        route: ev?.route ?? '/platform/auditoria',
        ip: ev?.ip ?? '—',
        device: ev?.device ?? '—',
        reason: ev?.reason ?? 'Escalación desde auditoría',
        actions_done: 'Incidencia creada',
        risk: 'high',
        status: 'escalated',
        priority: 'high'
      });
      await logPlatformAudit({ action: 'audit.escalated', entity: 'audit_event', entityId: data.id });
      return ok(result, { message: 'Incidencia escalada correctamente.' });
    }

    if (data.action === 'update_retention') {
      const payload = updateAuditRetentionDemo(data.retentionDays);
      await logPlatformAudit({
        action: 'audit.retention_updated',
        entity: 'platform_settings',
        metadata: { retentionDays: data.retentionDays }
      });
      return ok(payload, { message: 'Retención configurada.' });
    }

    if (data.action === 'log_export') {
      await logPlatformAudit({
        action: 'audit.exported',
        entity: 'audit_log',
        metadata: { format: data.format ?? 'csv' }
      });
      return ok(getAuditDemo(), { message: 'Exportación registrada en auditoría.' });
    }

    return fail('Acción no reconocida.', 400);
  } catch (error) {
    logError('platform.audit.post', error);
    return fail('No se pudo cargar la auditoría.', 500);
  }
};

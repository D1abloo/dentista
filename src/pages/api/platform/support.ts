import type { APIRoute } from 'astro';
import { requireSuperAdmin } from '@/lib/platform/auth';
import { listSupportRequests } from '@/lib/platform/service';
import { fail, ok } from '@/lib/http';
import { logError } from '@/lib/logger';
import { supportActionSchema, supportStatusSchema } from '@/lib/validators';
import { hasSupabaseConfig } from '@/lib/supabaseServer';
import { logPlatformAudit } from '@/lib/platform/platformAudit';
import {
  assignBulkOpenDemo,
  assignTicketDemo,
  closeTicketDemo,
  createTicketDemo,
  getSlaConfigDemo,
  getSupportTicketsDemo,
  linkClinicDemo,
  sendReplyDemo,
  updatePriorityDemo,
  updateSlaConfigDemo,
  updateStatusDemo,
  PLATFORM_ASSIGNEES,
  type SupportTicketRow,
  type TicketPriority,
  type TicketStatus,
  type TicketType
} from '@/lib/platform/supportDemo';
import type { SupportRequest, SupportStatus } from '@/lib/platform/types';

export const prerender = false;

function mapLegacy(rows: SupportRequest[]): SupportTicketRow[] {
  return rows.map((r, i) => ({
    id: r.id,
    ticket_code: `SUP-LEG-${String(i + 1).padStart(4, '0')}`,
    subject: r.subject,
    origin: 'public_portal' as const,
    origin_label: 'Portal público',
    clinic_id: r.clinic_id,
    clinic_name: r.clinic_id ? `Clínica ${r.clinic_id.slice(0, 8)}` : 'Sin asignar',
    tenant_slug: null,
    requester_name: r.requester_name,
    requester_email: r.requester_email,
    type: (r.category === 'patient' ? 'patient' : r.category === 'clinic' ? 'clinic' : 'staff') as TicketType,
    type_label: r.category,
    priority: 'normal' as TicketPriority,
    priority_label: 'Normal',
    status: (r.status === 'open' ? 'open' : r.status) as TicketStatus,
    status_label: r.status,
    message: r.body,
    assignee_id: null,
    assignee_name: 'Sin asignar',
    last_activity_label: '—',
    last_activity_date: '—',
    created_at: r.created_at,
    created_label: '—',
    is_urgent: false,
    pending_reply: r.status === 'open',
    sla_at_risk: false,
    timeline: [],
    replies: []
  }));
}

export const GET: APIRoute = async (context) => {
  const gate = requireSuperAdmin(context);
  if (gate.response) return gate.response;

  if (context.url.searchParams.get('config') === 'sla') {
    return ok(getSlaConfigDemo());
  }

  if (context.url.searchParams.get('assignees') === '1') {
    return ok(PLATFORM_ASSIGNEES);
  }

  if (!hasSupabaseConfig()) {
    return ok(getSupportTicketsDemo(), { demo: true });
  }

  try {
    const legacy = await listSupportRequests();
    if (legacy.length) return ok(mapLegacy(legacy));
    return ok(getSupportTicketsDemo(), { demo: true });
  } catch (error) {
    logError('platform.support.list', error);
    return ok(getSupportTicketsDemo(), { demo: true });
  }
};

export const POST: APIRoute = async (context) => {
  const gate = requireSuperAdmin(context);
  if (gate.response) return gate.response;

  try {
    const body = await context.request.json();
    const parsed = supportActionSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? 'Datos inválidos.';
      return fail(msg, 422);
    }

    const data = parsed.data;

    if (data.action === 'create') {
      const result = createTicketDemo({
        subject: data.subject,
        message: data.message,
        priority: data.priority,
        type: data.type,
        requesterName: data.requesterName,
        requesterEmail: data.requesterEmail,
        clinicId: data.clinicId
      });
      if ('error' in result) return fail(result.error, 422);
      await logPlatformAudit({
        action: 'support.ticket_created',
        entity: 'support_ticket',
        entityId: result.id,
        clinicId: result.clinic_id
      });
      return ok(getSupportTicketsDemo(), { message: 'Ticket creado correctamente.' });
    }

    if (data.action === 'assign') {
      const result = assignTicketDemo(data.id, data.assigneeId);
      if ('error' in result) return fail(result.error, 422);
      await logPlatformAudit({
        action: 'support.ticket_assigned',
        entity: 'support_ticket',
        entityId: data.id,
        metadata: { assigneeId: data.assigneeId }
      });
      return ok(getSupportTicketsDemo(), { message: 'Responsable asignado.' });
    }

    if (data.action === 'assign_bulk') {
      const n = assignBulkOpenDemo(data.assigneeId);
      await logPlatformAudit({
        action: 'support.tickets_bulk_assigned',
        entity: 'support_ticket',
        metadata: { count: n, assigneeId: data.assigneeId }
      });
      return ok(getSupportTicketsDemo(), { message: `${n} ticket${n === 1 ? '' : 's'} asignado${n === 1 ? '' : 's'}.` });
    }

    if (data.action === 'update_status') {
      const result = updateStatusDemo(data.id, data.status);
      if ('error' in result) return fail(result.error, 422);
      await logPlatformAudit({
        action: 'support.status_updated',
        entity: 'support_ticket',
        entityId: data.id,
        metadata: { status: data.status }
      });
      return ok(getSupportTicketsDemo(), { message: 'Estado actualizado.' });
    }

    if (data.action === 'update_priority') {
      const result = updatePriorityDemo(data.id, data.priority);
      if ('error' in result) return fail(result.error, 422);
      await logPlatformAudit({
        action: 'support.priority_updated',
        entity: 'support_ticket',
        entityId: data.id,
        metadata: { priority: data.priority }
      });
      return ok(getSupportTicketsDemo(), { message: 'Prioridad actualizada.' });
    }

    if (data.action === 'link_clinic') {
      const result = linkClinicDemo(data.id, data.clinicId);
      if ('error' in result) return fail(result.error, 422);
      await logPlatformAudit({
        action: 'support.clinic_linked',
        entity: 'support_ticket',
        entityId: data.id,
        clinicId: data.clinicId
      });
      return ok(getSupportTicketsDemo(), { message: 'Clínica vinculada al ticket.' });
    }

    if (data.action === 'reply') {
      const result = sendReplyDemo(data.id, data.message, {
        template: data.template,
        sendCopy: data.sendCopy
      });
      if ('error' in result) return fail(result.error, 422);
      await logPlatformAudit({
        action: 'support.reply_sent',
        entity: 'support_ticket',
        entityId: data.id,
        metadata: { sendCopy: data.sendCopy ?? true }
      });
      return ok(getSupportTicketsDemo(), { message: 'Respuesta enviada correctamente.' });
    }

    if (data.action === 'close') {
      const result = closeTicketDemo(data.id);
      if ('error' in result) return fail(result.error, 422);
      await logPlatformAudit({ action: 'support.ticket_closed', entity: 'support_ticket', entityId: data.id });
      return ok(getSupportTicketsDemo(), { message: 'Ticket cerrado.' });
    }

    if (data.action === 'update_sla') {
      updateSlaConfigDemo(data.responseHours, data.urgentHours);
      await logPlatformAudit({
        action: 'support.sla_updated',
        entity: 'platform_settings',
        metadata: { responseHours: data.responseHours, urgentHours: data.urgentHours }
      });
      return ok(getSlaConfigDemo(), { message: 'SLA actualizado.' });
    }

    return fail('Acción no reconocida.', 400);
  } catch (error) {
    logError('platform.support.post', error);
    return fail('No se pudo actualizar el ticket.', 500);
  }
};

export const PATCH: APIRoute = async (context) => {
  const gate = requireSuperAdmin(context);
  if (gate.response) return gate.response;

  if (!hasSupabaseConfig()) {
    try {
      const body = await context.request.json();
      const id = String(body.id ?? '');
      const status = body.status as TicketStatus;
      if (!id || !status) return fail('Payload inválido.', 422);
      const result = updateStatusDemo(id, status);
      if ('error' in result) return fail(result.error, 422);
      await logPlatformAudit({
        action: 'support.status_updated',
        entity: 'support_ticket',
        entityId: id,
        metadata: { status }
      });
      return ok(getSupportTicketsDemo(), { message: 'Estado actualizado.' });
    } catch (error) {
      logError('platform.support.patch.demo', error);
      return fail('No se pudo actualizar el ticket.', 500);
    }
  }

  try {
    const body = await context.request.json();
    const parsed = supportStatusSchema.safeParse(body);
    if (!parsed.success) return fail('Payload inválido.', 422, parsed.error.flatten());
    const { setSupportStatus } = await import('@/lib/platform/service');
    await setSupportStatus(parsed.data.id, parsed.data.status as SupportStatus);
    await logPlatformAudit({
      action: 'support.status_updated',
      entity: 'support_ticket',
      entityId: parsed.data.id,
      metadata: { status: parsed.data.status }
    });
    return ok({ updated: true });
  } catch (error) {
    logError('platform.support.patch', error);
    return fail('No se pudo actualizar el ticket.', 500);
  }
};

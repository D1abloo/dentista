import type { APIRoute } from 'astro';
import { requireSuperAdmin } from '@/lib/platform/auth';
import { fail, ok } from '@/lib/http';
import { logError } from '@/lib/logger';
import { logPlatformAudit } from '@/lib/platform/platformAudit';
import {
  escalateMonitoringDemo,
  filterMonitoringEvents,
  getMonitoringDemo,
  markMonitoringReviewedDemo
} from '@/lib/platform/monitoringDemo';
import type { MonitoringChip, MonitoringKpiId } from '@/lib/platform/monitoringTypes';
import { listAuditEvents } from '@/lib/audit/listEvents';
import { hasSupabaseConfig } from '@/lib/supabaseServer';
import { z } from 'zod';

export const prerender = false;

const actionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('mark_reviewed'), id: z.string().min(1) }),
  z.object({ action: z.literal('escalate'), id: z.string().min(1) })
]);

export const GET: APIRoute = async (context) => {
  const gate = requireSuperAdmin(context);
  if (gate.response) return gate.response;

  try {
    const url = new URL(context.request.url);
    const filters = {
      q: url.searchParams.get('q') ?? undefined,
      chip: (url.searchParams.get('chip') as MonitoringChip) ?? 'all',
      kpi: (url.searchParams.get('kpi') as MonitoringKpiId | null) ?? undefined,
      module: url.searchParams.get('module') ?? undefined,
      severity: url.searchParams.get('severity') ?? undefined,
      clinic: url.searchParams.get('clinic') ?? undefined,
      user: url.searchParams.get('user') ?? undefined,
      page: Number(url.searchParams.get('page') ?? '1'),
      page_size: Number(url.searchParams.get('page_size') ?? '10')
    };

    let payload = getMonitoringDemo();
    if (hasSupabaseConfig()) {
      try {
        const audit = await listAuditEvents({ search: filters.q, limit: 200 });
        if (audit.events.length) {
          payload = { ...payload, total_events: audit.kpis.audited ?? payload.total_events };
        }
      } catch {
        /* demo fallback */
      }
    }

    const filtered = filterMonitoringEvents(payload, filters);
    const page = Math.max(1, filters.page);
    const pageSize = Math.min(50, Math.max(5, filters.page_size));
    const start = (page - 1) * pageSize;
    const pageEvents = filtered.slice(start, start + pageSize);

    return ok({
      ...payload,
      events: pageEvents,
      filtered_total: filtered.length,
      page,
      page_size: pageSize,
      total_pages: Math.max(1, Math.ceil(filtered.length / pageSize))
    });
  } catch (error) {
    logError('platform.monitoring.get', error);
    return fail('No se pudieron cargar los registros.', 500);
  }
};

export const POST: APIRoute = async (context) => {
  const gate = requireSuperAdmin(context);
  if (gate.response) return gate.response;

  try {
    const body = await context.request.json();
    const parsed = actionSchema.safeParse(body);
    if (!parsed.success) return fail('Acción inválida.', 422);

    if (parsed.data.action === 'mark_reviewed') {
      const okReview = markMonitoringReviewedDemo(parsed.data.id);
      if (!okReview) return fail('No se pudo marcar el evento.', 422);
      await logPlatformAudit({ action: 'audit.mark_reviewed', entity: 'monitoring_event', entityId: parsed.data.id });
      return ok({ reviewed: true }, { message: 'Evento marcado como revisado.' });
    }

    if (parsed.data.action === 'escalate') {
      const okEsc = escalateMonitoringDemo(parsed.data.id);
      if (!okEsc) return fail('No se pudo escalar.', 422);
      await logPlatformAudit({ action: 'audit.escalated', entity: 'monitoring_event', entityId: parsed.data.id });
      return ok({ escalated: true }, { message: 'Incidencia escalada correctamente.' });
    }

    return fail('Acción no reconocida.', 400);
  } catch (error) {
    logError('platform.monitoring.post', error);
    return fail('No se pudo procesar la acción.', 500);
  }
};

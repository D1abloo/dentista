import { getSupabaseAdmin, hasSupabaseConfig } from '@/lib/supabaseServer';
import type { AuditPayload, AuditKpis } from '@/lib/platform/auditDemo';
import { getAuditDemo } from '@/lib/platform/auditDemo';
import type { AuditListFilters } from './types';
import { mapDbRowToAuditEvent } from './mapRow';
import { listMemoryAuditLogs } from './logEvent';

function startOfTodayIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function computeKpisFromEvents(
  events: ReturnType<typeof mapDbRowToAuditEvent>[],
  totalToday: number
): AuditKpis {
  const todayStart = startOfTodayIso();
  const today = events.filter((e) => e.created_at >= todayStart);
  const authSuccess = today.filter((e) => e.related_event?.includes('login_success')).length;
  const authFailed = today.filter(
    (e) => e.related_event?.includes('login_failed') || e.result === 'error'
  ).length;
  const denied = today.filter((e) => e.result === 'blocked').length;
  const downloads = today.filter((e) => e.related_event?.includes('downloaded')).length;
  const security = today.filter((e) => e.module_key === 'security' || e.risk === 'high').length;
  const critical = events.filter((e) => e.risk === 'high' || e.result === 'blocked').length;

  return {
    audited: totalToday || events.length,
    critical,
    permission_changes: today.filter((e) => e.related_event?.includes('role') || e.related_event?.includes('permission')).length,
    sensitive_access: security,
    exports: downloads,
    last_event: events[0]?.date_label ?? '—',
    events_today: today.length,
    logins_ok: authSuccess,
    logins_failed: authFailed,
    access_denied: denied,
    downloads,
    security_events: security
  } as AuditKpis & {
    events_today?: number;
    logins_ok?: number;
    logins_failed?: number;
    access_denied?: number;
    security_events?: number;
  };
}

export async function listAuditEvents(filters: AuditListFilters = {}): Promise<AuditPayload> {
  if (!hasSupabaseConfig()) {
    const demo = getAuditDemo();
    const mem = listMemoryAuditLogs(filters.limit ?? 100).map((m, i) =>
      mapDbRowToAuditEvent({
        id: m.id ?? `mem-${i}`,
        clinic_id: m.clinic_id ?? null,
        action: m.action,
        entity: m.resource_type ?? m.module,
        entity_id: m.resource_id ?? null,
        event_type: m.event_type,
        module: m.module,
        severity: m.severity ?? 'info',
        result: m.result ?? 'ok',
        message: m.message ?? m.action,
        user_email: m.user_email ?? null,
        user_role: m.user_role ?? null,
        route: m.route ?? null,
        ip_address: m.ip_address ?? null,
        user_agent: m.user_agent ?? null,
        metadata: m.metadata ?? {},
        created_at: m.created_at ?? new Date().toISOString()
      })
    );
    if (mem.length) {
      return {
        ...demo,
        events: [...mem, ...demo.events].slice(0, filters.limit ?? 150),
        kpis: computeKpisFromEvents([...mem, ...demo.events], mem.length)
      };
    }
    return demo;
  }

  const db = getSupabaseAdmin();
  const limit = Math.min(filters.limit ?? 150, 500);
  let q = db
    .from('audit_logs')
    .select(
      'id, clinic_id, action, entity, entity_id, event_type, module, severity, result, message, user_email, user_role, route, ip_address, user_agent, metadata, created_at'
    )
    .order('created_at', { ascending: false })
    .limit(limit);

  if (filters.clinic_id) q = q.eq('clinic_id', filters.clinic_id);
  if (filters.tenant_id) q = q.eq('tenant_id', filters.tenant_id);
  if (filters.event_type) q = q.eq('event_type', filters.event_type);
  if (filters.module) q = q.eq('module', filters.module);
  if (filters.severity) q = q.eq('severity', filters.severity);
  if (filters.result) q = q.eq('result', filters.result);
  if (filters.from) q = q.gte('created_at', filters.from);
  if (filters.to) q = q.lte('created_at', filters.to);

  const { data: rows, error } = await q;
  if (error || !rows?.length) {
    const demo = getAuditDemo();
    return demo;
  }

  const clinicIds = [...new Set(rows.map((r) => r.clinic_id).filter(Boolean))] as string[];
  const clinicMap = new Map<string, { name: string; slug: string }>();
  if (clinicIds.length) {
    const { data: clinics } = await db.from('clinics').select('id, name, slug').in('id', clinicIds);
    for (const c of clinics ?? []) {
      clinicMap.set(c.id, { name: c.name, slug: c.slug ?? 'clinic' });
    }
  }

  let events = rows.map((r) => {
    const c = r.clinic_id ? clinicMap.get(r.clinic_id) : null;
    return mapDbRowToAuditEvent(
      r as Parameters<typeof mapDbRowToAuditEvent>[0],
      c?.name ?? (r.clinic_id ? 'Clínica' : 'Global'),
      c?.slug ?? 'global'
    );
  });

  if (filters.search) {
    const s = filters.search.toLowerCase();
    events = events.filter(
      (e) =>
        e.actor_name.toLowerCase().includes(s) ||
        e.action.toLowerCase().includes(s) ||
        e.clinic_name.toLowerCase().includes(s) ||
        e.ip.toLowerCase().includes(s) ||
        (e.related_event?.toLowerCase().includes(s) ?? false)
    );
  }

  const { count: todayCount } = await db
    .from('audit_logs')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', startOfTodayIso());

  return {
    kpis: computeKpisFromEvents(events, todayCount ?? events.length),
    events,
    critical_summary: [
      { id: 'cross', label: 'Intentos de acceso cruzado', count: events.filter((e) => e.related_event?.includes('cross_tenant')).length },
      { id: 'tokens', label: 'Tokens inválidos', count: events.filter((e) => e.related_event?.includes('token')).length },
      { id: 'perms', label: 'Cambios de permisos', count: events.filter((e) => e.related_event?.includes('permission') || e.related_event?.includes('role')).length },
      { id: 'exports', label: 'Exportaciones', count: events.filter((e) => e.related_event?.includes('export')).length },
      { id: 'isolation', label: 'Fallos RLS', count: events.filter((e) => e.related_event?.includes('rls')).length }
    ],
    by_module: aggregateModules(events),
    by_actor: aggregateActors(events),
    retention_days: 90,
    actors: ['Todos', ...new Set(events.map((e) => e.actor_name))],
    tenants: [{ id: 'all', name: 'Todas las clínicas', slug: '' }]
  };
}

function aggregateModules(events: ReturnType<typeof mapDbRowToAuditEvent>[]) {
  const counts = new Map<string, number>();
  for (const e of events) counts.set(e.module, (counts.get(e.module) ?? 0) + 1);
  const total = events.length || 1;
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, n]) => ({ label, percent: Math.round((n / total) * 100) }));
}

function aggregateActors(events: ReturnType<typeof mapDbRowToAuditEvent>[]) {
  const counts = new Map<string, number>();
  for (const e of events) counts.set(e.actor_name, (counts.get(e.actor_name) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([label, eventsCount]) => ({ label, events: eventsCount }));
}

export async function markAuditReviewed(id: string): Promise<boolean> {
  if (!hasSupabaseConfig()) return false;
  const db = getSupabaseAdmin();
  const { data } = await db.from('audit_logs').select('metadata').eq('id', id).maybeSingle();
  if (!data) return false;
  const meta = { ...(data.metadata as Record<string, unknown>), reviewed: true };
  const { error } = await db.from('audit_logs').update({ metadata: meta }).eq('id', id);
  return !error;
}

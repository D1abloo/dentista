import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileText,
  Key,
  Lock,
  MoreVertical,
  Search,
  Settings,
  Shield,
  User,
  X
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useCountUp } from '@/hooks/useCountUp';
import {
  PRIVACY_AUDIT,
  chipToModule,
  type AuditEventRow,
  type AuditPayload
} from '@/lib/platform/auditDemo';
import { PlatformShell } from './PlatformShell';

async function apiGet<T>(): Promise<T> {
  const res = await fetch('/api/platform/audit', { credentials: 'include' });
  const json = (await res.json()) as { data?: T; error?: { message?: string } };
  if (!res.ok) throw new Error(json.error?.message ?? 'No se pudo cargar la auditoría.');
  return json.data as T;
}

async function apiPost<T>(body: Record<string, unknown>): Promise<{ data: T; message?: string }> {
  const res = await fetch('/api/platform/audit', {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
  const json = (await res.json()) as { data?: T; error?: { message?: string }; meta?: { message?: string } };
  if (!res.ok) throw new Error(json.error?.message ?? 'No se pudo cargar la auditoría.');
  return { data: json.data as T, message: json.meta?.message };
}

type FilterChip =
  | 'all'
  | 'security'
  | 'users'
  | 'clinics'
  | 'patients'
  | 'appointments'
  | 'documents'
  | 'reports'
  | 'billing'
  | 'payments'
  | 'support'
  | 'isolation'
  | 'config'
  | 'critical';

type RangeKey = '7d' | '30d' | '90d';
type ResultFilter = 'all' | 'ok' | 'blocked';
type Modal = 'retention' | null;

const CHIPS: { id: FilterChip; label: string; critical?: boolean }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'security', label: 'Seguridad' },
  { id: 'users', label: 'Usuarios' },
  { id: 'clinics', label: 'Clínicas' },
  { id: 'patients', label: 'Pacientes' },
  { id: 'appointments', label: 'Citas' },
  { id: 'documents', label: 'Documentos' },
  { id: 'reports', label: 'Informes' },
  { id: 'billing', label: 'Facturación' },
  { id: 'payments', label: 'Pagos' },
  { id: 'support', label: 'Soporte' },
  { id: 'isolation', label: 'Aislamiento' },
  { id: 'config', label: 'Configuración' },
  { id: 'critical', label: 'Críticos', critical: true }
];

function Sparkline({ points, tone }: { points: number[]; tone: string }) {
  const max = Math.max(...points, 1);
  const coords = points.map((p, i) => `${(i / Math.max(points.length - 1, 1)) * 100},${100 - (p / max) * 100}`).join(' ');
  return (
    <svg className={`plt-spark plt-spark--${tone}`} viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden>
      <polyline className="plt-spark__line" points={coords} />
    </svg>
  );
}

function AudKpi({
  label,
  value,
  icon: Icon,
  tone,
  spark,
  delay,
  numeric
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone: string;
  spark: number[];
  delay: number;
  numeric?: boolean;
}) {
  const n = numeric && typeof value === 'number' ? useCountUp(value, 750) : value;
  return (
    <article className="plt-kpi cln-kpi aud-kpi" style={{ animationDelay: `${delay}ms` }}>
      <span className={`plt-kpi__icon plt-kpi__icon--${tone}`}>
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div className="plt-kpi__body">
        <p className="plt-kpi__label">{label}</p>
        <p className="plt-kpi__value">{n}</p>
        <p className="aud-kpi__sub">Últimos 7 días</p>
      </div>
      <Sparkline points={spark} tone={tone} />
    </article>
  );
}

function ModuleDonut({ segments }: { segments: { label: string; percent: number }[] }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  let offset = 0;
  const colors = ['#0d9488', '#0891b2', '#6366f1', '#f59e0b', '#94a3b8'];
  return (
    <div className="aud-donut-wrap">
      <svg className="aud-donut" viewBox="0 0 100 100" role="img" aria-label="Actividad por módulo">
        <circle className="aud-donut__bg" cx="50" cy="50" r={r} />
        {segments.map((s, i) => {
          const dash = (s.percent / 100) * c;
          const el = (
            <circle
              key={s.label}
              className="aud-donut__fg"
              cx="50"
              cy="50"
              r={r}
              stroke={colors[i % colors.length]}
              strokeDasharray={`${dash} ${c - dash}`}
              strokeDashoffset={-offset}
            />
          );
          offset += dash;
          return el;
        })}
      </svg>
      <ul className="aud-donut-legend">
        {segments.map((s) => (
          <li key={s.label}>
            <strong>{s.percent}%</strong> {s.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function DetailRow({ label, value, icon: Icon, mono }: { label: string; value: ReactNode; icon: LucideIcon; mono?: boolean }) {
  return (
    <li className="cln-detail__row">
      <Icon className="cln-detail__icon h-4 w-4" aria-hidden />
      <div>
        <span className="cln-detail__label">{label}</span>
        <span className={`cln-detail__value${mono ? ' font-mono text-xs' : ''}`}>{value}</span>
      </div>
    </li>
  );
}

function inRange(iso: string, range: RangeKey) {
  const t = new Date(iso).getTime();
  const now = Date.now();
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  return t >= now - days * 86400000;
}

export function PlatformAudit() {
  const [payload, setPayload] = useState<AuditPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [search, setSearch] = useState('');
  const [chip, setChip] = useState<FilterChip>('all');
  const [range, setRange] = useState<RangeKey>('7d');
  const [actor, setActor] = useState('Todos');
  const [tenant, setTenant] = useState('all');
  const [resultFilter, setResultFilter] = useState<ResultFilter>('all');
  const [selected, setSelected] = useState<AuditEventRow | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<Modal>(null);
  const [retentionDays, setRetentionDays] = useState(180);
  const pageSize = 5;

  const showToast = useCallback((type: 'ok' | 'err', text: string) => {
    setToast({ type, text });
    window.setTimeout(() => setToast(null), 4200);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet<AuditPayload>();
      setPayload(data);
      setRetentionDays(data.retention_days);
      setSelected((prev) => (prev ? data.events.find((e) => e.id === prev.id) ?? null : null));
    } catch {
      showToast('err', 'No se pudo cargar la auditoría.');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search, chip, range, actor, tenant, resultFilter]);

  async function post(body: Record<string, unknown>, okMsg?: string) {
    setBusy(true);
    try {
      const { data, message } = await apiPost<AuditPayload>(body);
      setPayload(data);
      if (body.action === 'mark_reviewed' && typeof body.id === 'string') {
        const ev = data.events.find((e) => e.id === body.id);
        if (ev) setSelected(ev);
      }
      showToast('ok', message ?? okMsg ?? 'Operación completada.');
      return data;
    } catch (e) {
      showToast('err', e instanceof Error ? e.message : 'No se pudo cargar la auditoría.');
      return null;
    } finally {
      setBusy(false);
    }
  }

  const filtered = useMemo(() => {
    if (!payload) return [];
    const q = search.trim().toLowerCase();
    const mod = chipToModule(chip);
    return payload.events.filter((e) => {
      if (!inRange(e.created_at, range)) return false;
      if (chip === 'critical') {
        if (e.risk !== 'high' && e.result !== 'blocked') return false;
      } else if (mod && e.module_key !== mod) return false;
      if (actor !== 'Todos' && e.actor_name !== actor) return false;
      if (tenant !== 'all') {
        const t = payload.tenants.find((x) => x.id === tenant);
        if (t?.slug && e.tenant_slug !== t.slug) return false;
      }
      if (resultFilter === 'ok' && e.result !== 'ok') return false;
      if (resultFilter === 'blocked' && e.result !== 'blocked') return false;
      if (!q) return true;
      const hay = [
        e.actor_name,
        e.clinic_name,
        e.tenant_slug,
        e.resource,
        e.action,
        e.ip,
        e.module,
        e.event_code
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [payload, search, chip, range, actor, tenant, resultFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const totalCount = useMemo(() => {
    if (!payload) return 0;
    const baseline =
      chip === 'all' &&
      !search.trim() &&
      actor === 'Todos' &&
      tenant === 'all' &&
      resultFilter === 'all' &&
      range === '7d';
    return baseline ? payload.kpis.audited : filtered.length;
  }, [payload, chip, search, actor, tenant, resultFilter, range, filtered.length]);

  const maxActor = useMemo(() => {
    if (!payload?.by_actor.length) return 1;
    return Math.max(...payload.by_actor.map((a) => a.events), 1);
  }, [payload]);

  function clearFilters() {
    setSearch('');
    setChip('all');
    setRange('7d');
    setActor('Todos');
    setTenant('all');
    setResultFilter('all');
  }

  function openResource(ev: AuditEventRow) {
    if (!ev.resource_href) {
      showToast('err', 'No tienes permisos para ver este recurso.');
      return;
    }
    window.location.href = ev.resource_href;
  }

  function rowMenuAction(ev: AuditEventRow, action: 'reviewed' | 'escalate' | 'export') {
    setMenuId(null);
    if (action === 'export') {
      window.location.href = `/api/platform/audit-export?event=${ev.event_code}`;
      showToast('ok', 'Evento exportado.');
      return;
    }
    if (action === 'escalate') {
      if (!window.confirm('Confirma esta acción crítica.')) return;
      void post({ action: 'escalate', id: ev.id }, 'Incidencia escalada correctamente.');
      return;
    }
    void post({ action: 'mark_reviewed', id: ev.id }, 'Evento marcado como revisado.');
  }

  async function saveRetention() {
    const days = Number(retentionDays);
    if (!days || days < 30) {
      showToast('err', 'Mínimo 30 días de retención.');
      return;
    }
    if (!window.confirm('Confirma esta acción crítica: actualizar retención de auditoría.')) return;
    const data = await post({ action: 'update_retention', retentionDays: days }, 'Retención configurada.');
    if (data) setModal(null);
  }

  const showEmpty = !loading && payload && filtered.length === 0;
  const k = payload?.kpis;

  return (
    <PlatformShell
      title="Auditoría"
      subtitle="Consulta eventos de seguridad, accesos, cambios administrativos y actividad crítica de clínicas y plataforma."
      headerActions={
        <>
          <button
            type="button"
            className="plt-btn plt-btn--primary"
            disabled={busy}
            onClick={() => {
              window.location.href = '/api/platform/audit-export';
              showToast('ok', 'Auditoría exportada en CSV.');
            }}
          >
            <Download className="h-4 w-4" aria-hidden />
            Exportar auditoría
          </button>
          <button
            type="button"
            className="plt-btn plt-btn--secondary"
            disabled={busy}
            onClick={() => {
              window.location.href = '/api/platform/audit-report';
              showToast('ok', 'Informe PDF generado.');
            }}
          >
            <FileText className="h-4 w-4" aria-hidden />
            Descargar informe
          </button>
          <button type="button" className="plt-btn plt-btn--secondary" onClick={() => setModal('retention')}>
            <Settings className="h-4 w-4" aria-hidden />
            Configurar retención
          </button>
          <button
            type="button"
            className="plt-btn plt-btn--ghost"
            onClick={() => {
              setChip('critical');
              showToast('ok', 'Filtro de eventos críticos aplicado.');
            }}
          >
            <AlertTriangle className="h-4 w-4" aria-hidden />
            Ver eventos críticos
          </button>
        </>
      }
    >
      <div className={`aud-page cln-layout${selected ? ' cln-page--panel-open' : ''}`}>
        {k ? (
          <div className="cln-kpis plt-kpis">
            <AudKpi label="Eventos auditados" value={k.audited} icon={Activity} tone="blue" spark={[180, 210, 230, 248, 248, 248, 248]} delay={0} numeric />
            <AudKpi label="Eventos críticos" value={k.critical} icon={Shield} tone="red" spark={[0, 0, 0, 0, 0, 0, 0]} delay={70} numeric />
            <AudKpi label="Cambios de permisos" value={k.permission_changes} icon={Key} tone="purple" spark={[1, 2, 2, 3, 3, 3, 3]} delay={140} numeric />
            <AudKpi label="Accesos sensibles" value={k.sensitive_access} icon={Lock} tone="orange" spark={[2, 4, 5, 6, 6, 6, 6]} delay={210} numeric />
            <AudKpi label="Exportaciones" value={k.exports} icon={Download} tone="teal" spark={[1, 2, 3, 4, 4, 4, 4]} delay={280} numeric />
            <AudKpi label="Último evento" value={k.last_event} icon={Clock} tone="green" spark={[1, 1, 1, 1, 1, 1, 1]} delay={350} />
          </div>
        ) : null}

        <div className="cln-toolbar">
          <label className="cln-search">
            <Search className="cln-search__icon h-4 w-4" aria-hidden />
            <input
              placeholder="Buscar por usuario, clínica, tenant, paciente, recurso, acción o IP…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Buscar auditoría"
            />
          </label>
          <div className="cln-toolbar__row">
            <div className="cln-chips" role="tablist">
              {CHIPS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="tab"
                  aria-selected={chip === c.id}
                  className={`cln-chip${chip === c.id ? ' cln-chip--active' : ''}${c.critical ? ' aud-chip--critical' : ''}`}
                  onClick={() => setChip(c.id)}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <div className="aud-selectors">
              <select value={range} onChange={(e) => setRange(e.target.value as RangeKey)} aria-label="Rango">
                <option value="7d">Rango: Últimos 7 días</option>
                <option value="30d">Rango: Últimos 30 días</option>
                <option value="90d">Rango: Últimos 90 días</option>
              </select>
              <select value={actor} onChange={(e) => setActor(e.target.value)} aria-label="Actor">
                {payload?.actors.map((a) => (
                  <option key={a} value={a}>
                    Actor: {a}
                  </option>
                ))}
              </select>
              <select value={tenant} onChange={(e) => setTenant(e.target.value)} aria-label="Tenant">
                {payload?.tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    Tenant: {t.name}
                  </option>
                ))}
              </select>
              <select value={resultFilter} onChange={(e) => setResultFilter(e.target.value as ResultFilter)} aria-label="Resultado">
                <option value="all">Resultado: Todos</option>
                <option value="ok">Resultado: Correcto</option>
                <option value="blocked">Resultado: Bloqueado</option>
              </select>
              <button type="button" className="aud-clear" onClick={clearFilters}>
                Limpiar filtros
              </button>
            </div>
          </div>
        </div>

        {showEmpty ? (
          <section className="aud-empty">
            <Shield className="h-12 w-12 text-slate-300 mx-auto" aria-hidden />
            <h3 className="sub-empty__title mt-3">No hay eventos de auditoría</h3>
            <p className="sub-empty__text">
              Cuando se creen usuarios, se aprueben clínicas, se modifiquen permisos, se generen facturas o se ejecuten revisiones, aparecerán aquí.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.75rem' }}>
              <button type="button" className="plt-btn plt-btn--primary" disabled={busy} onClick={() => void post({ action: 'refresh' }, 'Auditoría actualizada.')}>
                Actualizar auditoría
              </button>
              <button type="button" className="plt-btn plt-btn--secondary" onClick={() => setModal('retention')}>
                Configurar retención
              </button>
            </div>
          </section>
        ) : (
          <>
            <section className="cln-card">
              <h2 className="cln-card__title">
                Registro de auditoría
                <span className="hist-card-count">({filtered.length} visibles)</span>
              </h2>
              <div className="cln-table-wrap aud-table">
                <table className="cln-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Actor</th>
                      <th>Rol</th>
                      <th>Clínica / Tenant</th>
                      <th>Módulo</th>
                      <th>Acción</th>
                      <th>Recurso</th>
                      <th>Riesgo</th>
                      <th>Resultado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((r, i) => (
                      <tr
                        key={r.id}
                        style={{ animationDelay: `${i * 45}ms` }}
                        className={selected?.id === r.id ? 'cln-table__row--active' : ''}
                        onClick={() => setSelected(r)}
                      >
                        <td>{r.date_label}</td>
                        <td>
                          <div className="aud-actor-cell">
                            <span className={`aud-avatar${r.is_system ? ' aud-avatar--system' : ''}`}>{r.actor_initials}</span>
                            <strong>{r.actor_name}</strong>
                          </div>
                        </td>
                        <td>{r.actor_role}</td>
                        <td className="aud-clinic-cell">
                          <strong>{r.clinic_name}</strong>
                          <span>{r.tenant_masked}</span>
                        </td>
                        <td>{r.module}</td>
                        <td>{r.action}</td>
                        <td className="font-mono text-xs">{r.resource_masked}</td>
                        <td>
                          <span className={`cln-badge aud-risk aud-risk--${r.risk}`}>{r.risk_label}</span>
                        </td>
                        <td>
                          <span className={`cln-badge aud-result aud-result--${r.result === 'ok' ? 'ok' : 'blocked'}`}>{r.result_label}</span>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="cln-row-actions">
                            <button type="button" className="plt-btn plt-btn--ghost plt-btn--sm" onClick={() => setSelected(r)}>
                              <Eye className="h-3.5 w-3.5" aria-hidden />
                              Ver detalle
                            </button>
                            <button type="button" className="plt-btn plt-btn--ghost plt-btn--sm" onClick={() => openResource(r)}>
                              Ver recurso
                            </button>
                            <div className="relative">
                              <button type="button" className="cln-icon-btn" aria-label="Más acciones" onClick={() => setMenuId(menuId === r.id ? null : r.id)}>
                                <MoreVertical className="h-4 w-4" />
                              </button>
                              {menuId === r.id ? (
                                <div className="cln-menu-pop">
                                  <button type="button" onClick={() => rowMenuAction(r, 'reviewed')}>
                                    Marcar revisado
                                  </button>
                                  <button type="button" onClick={() => rowMenuAction(r, 'escalate')}>
                                    Escalar incidencia
                                  </button>
                                  <button type="button" onClick={() => rowMenuAction(r, 'export')}>
                                    Exportar evento
                                  </button>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="cln-mobile-list">
                {pageRows.map((r) => (
                  <article
                    key={`m-${r.id}`}
                    className={`cln-mobile-card${selected?.id === r.id ? ' cln-mobile-card--active' : ''}`}
                    onClick={() => setSelected(r)}
                  >
                    <p className="text-xs text-slate-500">{r.date_label}</p>
                    <p className="font-bold text-sm">{r.action}</p>
                    <p className="text-xs">{r.actor_name} · {r.module}</p>
                    <span className={`cln-badge aud-risk aud-risk--${r.risk}`}>{r.risk_label}</span>
                  </article>
                ))}
              </div>
              {filtered.length ? (
                <div className="cln-table-foot">
                  <span>
                    {(page - 1) * pageSize + 1} a {Math.min(page * pageSize, filtered.length)} de {totalCount} resultados
                  </span>
                  <div className="flex items-center gap-2">
                    <button type="button" className="cln-icon-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                      ‹
                    </button>
                    <span>
                      {page} / {totalPages}
                    </span>
                    <button type="button" className="cln-icon-btn" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                      ›
                    </button>
                  </div>
                </div>
              ) : null}
            </section>

            <div className="aud-bottom">
              <article className="cln-card">
                <h3 className="cln-card__title">Eventos críticos</h3>
                <ul className="aud-mini-list">
                  {payload?.critical_summary.map((row) => (
                    <li key={row.id}>
                      <span>{row.label}</span>
                      <strong>{row.count}</strong>
                    </li>
                  ))}
                </ul>
              </article>
              <article className="cln-card">
                <h3 className="cln-card__title">Actividad por módulo</h3>
                {payload ? <ModuleDonut segments={payload.by_module} /> : null}
              </article>
              <article className="cln-card">
                <h3 className="cln-card__title">Actividad por actor</h3>
                <div className="aud-hbar">
                  {payload?.by_actor.map((a, i) => (
                    <div key={a.label} className="aud-hbar__row">
                      <span>{a.label}</span>
                      <div className="aud-hbar__track">
                        <div className="aud-hbar__fill" style={{ width: `${(a.events / maxActor) * 100}%`, transitionDelay: `${i * 60}ms` }} />
                      </div>
                      <span>{a.events}</span>
                    </div>
                  ))}
                </div>
              </article>
            </div>

            <div className="aud-privacy">
              <h3 className="text-sm font-extrabold m-0">Privacidad de auditoría</h3>
              <ul>
                {PRIVACY_AUDIT.map((item) => (
                  <li key={item}>
                    <CheckCircle2 className="h-3.5 w-3.5 text-teal-600 shrink-0" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-slate-500 mt-2 mb-0">
                Los registros de auditoría son inmutables desde la interfaz. No se exponen datos clínicos entre tenants.
              </p>
            </div>
          </>
        )}

        {selected ? (
          <>
            <div className="cln-detail__backdrop" onClick={() => setSelected(null)} />
            <aside className="cln-detail">
              <div className="cln-detail__head">
                <div>
                  <h2 className="m-0 text-base font-extrabold">Detalle de auditoría</h2>
                  {selected.reviewed ? <span className="cln-badge plt-badge--ok">Revisado</span> : null}
                </div>
                <button type="button" className="cln-icon-btn" onClick={() => setSelected(null)}>
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="cln-detail__body">
                <ul className="cln-detail__meta">
                  <DetailRow icon={FileText} label="ID evento" value={selected.event_code} mono />
                  <DetailRow icon={Clock} label="Fecha y hora" value={selected.date_label} />
                  <DetailRow icon={User} label="Actor" value={selected.actor_name} />
                  <DetailRow icon={Shield} label="Rol" value={selected.actor_role} />
                  <DetailRow icon={Lock} label="Clínica" value={selected.clinic_name} />
                  <DetailRow icon={Lock} label="Tenant" value={selected.tenant_masked} mono />
                  <DetailRow icon={Activity} label="Módulo" value={selected.module} />
                  <DetailRow icon={Eye} label="Acción" value={selected.action} />
                  <DetailRow icon={FileText} label="Recurso afectado" value={selected.resource_masked} mono />
                  <DetailRow icon={CheckCircle2} label="Resultado" value={selected.result_label} />
                  <DetailRow icon={AlertTriangle} label="Nivel de riesgo" value={selected.risk_label} />
                  <DetailRow icon={Activity} label="IP" value={selected.ip} mono />
                  <DetailRow icon={Settings} label="Dispositivo" value={selected.device} />
                  <DetailRow icon={Eye} label="Ruta" value={selected.route} mono />
                  {selected.related_event ? (
                    <DetailRow icon={FileText} label="Evento relacionado" value={selected.related_event} mono />
                  ) : null}
                  <DetailRow icon={FileText} label="Motivo" value={selected.reason} />
                </ul>
                <p className="text-xs text-slate-600">
                  <strong>Registro técnico:</strong> {selected.technical_log}
                </p>
                {selected.before_state || selected.after_state ? (
                  <div className="aud-before-after">
                    <h4 className="text-sm font-bold m-0 mb-2">Cambios registrados</h4>
                    <div className="aud-before-after__grid">
                      <div>
                        <span className="text-xs text-slate-500">Antes</span>
                        <p className="m-0">{selected.before_state ?? '—'}</p>
                      </div>
                      <span className="aud-before-after__arrow">→</span>
                      <div>
                        <span className="text-xs text-slate-500">Después</span>
                        <p className="m-0">{selected.after_state ?? '—'}</p>
                      </div>
                    </div>
                  </div>
                ) : null}
                <div className="cln-detail__actions grid grid-cols-2 gap-2">
                  <button type="button" className="plt-btn plt-btn--secondary plt-btn--sm" onClick={() => rowMenuAction(selected, 'export')}>
                    Exportar evento
                  </button>
                  <button type="button" className="plt-btn plt-btn--secondary plt-btn--sm" onClick={() => openResource(selected)}>
                    Ver recurso
                  </button>
                  <button type="button" className="plt-btn plt-btn--secondary plt-btn--sm" onClick={() => (window.location.href = '/platform/usuarios')}>
                    Ver usuario
                  </button>
                  <button type="button" className="plt-btn plt-btn--secondary plt-btn--sm" onClick={() => (window.location.href = '/platform/clinicas')}>
                    Ver tenant
                  </button>
                  <button type="button" className="plt-btn plt-btn--primary plt-btn--sm" disabled={busy || selected.reviewed} onClick={() => rowMenuAction(selected, 'reviewed')}>
                    Marcar como revisado
                  </button>
                  <button type="button" className="plt-btn plt-btn--ghost plt-btn--sm text-red-600" disabled={busy} onClick={() => rowMenuAction(selected, 'escalate')}>
                    Escalar incidencia
                  </button>
                </div>
                <p className="text-[0.65rem] text-slate-400 mt-3">Los registros de auditoría no pueden modificarse ni eliminarse desde esta pantalla.</p>
              </div>
            </aside>
          </>
        ) : null}

        {modal === 'retention' ? (
          <div className="aud-modal-backdrop" role="dialog" aria-modal>
            <div className="aud-modal">
              <h3 className="font-extrabold text-base m-0">Configurar retención</h3>
              <p className="text-xs text-slate-500">Define cuántos días se conservan los eventos de auditoría de plataforma (30–365).</p>
              <label className="block mt-3 text-xs font-bold">
                Días de retención
                <input
                  type="number"
                  min={30}
                  max={365}
                  className="mt-1 w-full border rounded-lg px-2 py-1.5 text-sm"
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(Number(e.target.value))}
                />
              </label>
              <div className="flex gap-2 mt-4 justify-end">
                <button type="button" className="plt-btn plt-btn--ghost" onClick={() => setModal(null)}>
                  Cancelar
                </button>
                <button type="button" className="plt-btn plt-btn--primary" disabled={busy} onClick={() => void saveRetention()}>
                  Guardar
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {toast ? <div className={`plt-toast plt-toast--${toast.type === 'ok' ? 'ok' : 'err'}`} role="status">{toast.text}</div> : null}
        {loading && !payload ? <p className="text-sm text-[var(--muted)]">Cargando auditoría…</p> : null}
      </div>
    </PlatformShell>
  );
}

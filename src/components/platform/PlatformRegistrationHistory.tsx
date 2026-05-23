import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Building2, Calendar, CheckCircle2, ClipboardList, Clock, Database, Download, Eye, FileText, Link2,
  Mail, MoreVertical, Phone, RefreshCw, Search, Shield, User, X, XCircle
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useCountUp } from '@/hooks/useCountUp';
import { getHistoryKpis, type ProcessedHistoryRow } from '@/lib/platform/historyDemo';
import { PlatformShell } from './PlatformShell';

async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'include', headers: { 'content-type': 'application/json' } });
  const json = (await res.json()) as { data?: T; error?: { message?: string } };
  if (!res.ok) throw new Error(json.error?.message ?? 'Error de servidor');
  return json.data as T;
}

async function apiPost<T>(body: Record<string, unknown>): Promise<{ data: T; message?: string }> {
  const res = await fetch('/api/platform/history', {
    method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body)
  });
  const json = (await res.json()) as { data?: T; error?: { message?: string }; meta?: { message?: string } };
  if (!res.ok) throw new Error(json.error?.message ?? 'Error de servidor');
  return { data: json.data as T, message: json.meta?.message };
}

type FilterChip = 'all' | 'approved' | 'rejected' | 'today' | 'with_tenant' | 'no_tenant' | 'incidents';
type SortMode = 'decision' | 'clinic' | 'decision_type';

function Sparkline({ points, tone }: { points: number[]; tone: string }) {
  const max = Math.max(...points, 1);
  const coords = points.map((p, i) => `${(i / Math.max(points.length - 1, 1)) * 100},${100 - (p / max) * 100}`).join(' ');
  return (
    <svg className={`plt-spark plt-spark--${tone}`} viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden>
      <polyline className="plt-spark__line" points={coords} />
    </svg>
  );
}

const KPI_CONFIG = [
  { label: 'Procesadas', key: 'processed' as const, icon: ClipboardList, tone: 'purple', spark: [0,1,1,1,1,1,1], numeric: true },
  { label: 'Aprobadas', key: 'approved' as const, icon: CheckCircle2, tone: 'green', spark: [0,0,1,1,1,1,1], numeric: true },
  { label: 'Rechazadas', key: 'rejected' as const, icon: XCircle, tone: 'red', spark: [0,0,0,0,0,0,0], numeric: true },
  { label: 'Tenants creados', key: 'tenantsCreated' as const, icon: Database, tone: 'blue', spark: [0,1,1,1,1,1,1], numeric: true },
  { label: 'Tiempo medio aprobación', key: 'avgApproval' as const, icon: Clock, tone: 'orange', spark: [2,3,2,2,2,2,2] },
  { label: 'Última alta', key: 'lastRegistration' as const, icon: Calendar, tone: 'teal', spark: [0,1,1,1,1,1,1] }
];


function HistKpi({ label, value, icon: Icon, tone, spark, delay, numeric }: {
  label: string; value: string | number; icon: LucideIcon; tone: string; spark: number[]; delay: number; numeric?: boolean;
}) {
  const n = numeric && typeof value === 'number' ? useCountUp(value, 750) : value;
  return (
    <article className="plt-kpi cln-kpi hist-kpi" style={{ animationDelay: `${delay}ms` }}>
      <span className={`plt-kpi__icon plt-kpi__icon--${tone}`}><Icon className="h-4 w-4" aria-hidden /></span>
      <div className="plt-kpi__body">
        <p className="plt-kpi__label">{label}</p>
        <p className="plt-kpi__value">{n}</p>
      </div>
      <Sparkline points={spark} tone={tone} />
    </article>
  );
}

function decisionBadgeClass(decision: string) {
  return decision === 'approved' ? 'hist-badge--approved' : 'hist-badge--rejected';
}

export function PlatformRegistrationHistory() {
  const [rows, setRows] = useState<ProcessedHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [chip, setChip] = useState<FilterChip>('all');
  const [sort, setSort] = useState<SortMode>('decision');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<ProcessedHistoryRow | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [didAutoSelect, setDidAutoSelect] = useState(false);

  const showToast = useCallback((type: 'ok' | 'err', text: string) => {
    setToast({ type, text });
    window.setTimeout(() => setToast(null), 4200);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await apiGet<ProcessedHistoryRow[]>('/api/platform/history'));
    } catch {
      showToast('err', 'No se pudo cargar el historial.');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!didAutoSelect && rows.length) {
      setSelected(rows.find((r) => r.id === 'reg-approved-001') ?? rows[0]);
      setDidAutoSelect(true);
    }
  }, [rows, didAutoSelect]);

  useEffect(() => {
    if (selected) {
      const fresh = rows.find((r) => r.id === selected.id);
      if (fresh) setSelected(fresh);
    }
  }, [rows, selected?.id]);

  useEffect(() => { setPage(1); }, [search, chip, sort, pageSize]);

  const kpis = useMemo(() => getHistoryKpis(rows), [rows]);

  const filtered = useMemo(() => {
    let list = [...rows];
    const q = search.trim().toLowerCase();
    const today = new Date().toDateString();

    if (chip === 'approved') list = list.filter((r) => r.decision === 'approved');
    if (chip === 'rejected') list = list.filter((r) => r.decision === 'rejected');
    if (chip === 'today') list = list.filter((r) => new Date(r.reviewed_at).toDateString() === today);
    if (chip === 'with_tenant') list = list.filter((r) => r.has_tenant);
    if (chip === 'no_tenant') list = list.filter((r) => !r.has_tenant);
    if (chip === 'incidents') list = list.filter((r) => r.has_incidents);

    if (q) {
      list = list.filter(
        (r) =>
          r.clinic_name.toLowerCase().includes(q) ||
          r.owner_name.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          r.tenant_slug.toLowerCase().includes(q) ||
          r.decision_label.toLowerCase().includes(q) ||
          r.processed_by.toLowerCase().includes(q)
      );
    }

    if (sort === 'clinic') list.sort((a, b) => a.clinic_name.localeCompare(b.clinic_name));
    else if (sort === 'decision_type') list.sort((a, b) => a.decision_label.localeCompare(b.decision_label));
    else list.sort((a, b) => new Date(b.reviewed_at).getTime() - new Date(a.reviewed_at).getTime());

    return list;
  }, [rows, search, chip, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  function clearFilters() {
    setSearch('');
    setChip('all');
    setSort('decision');
    setPage(1);
  }

  async function resendCredentials() {
    if (!selected) return;
    if (!window.confirm('¿Reenviar credenciales de acceso al administrador de la clínica?')) return;
    setBusy(true);
    try {
      const { data, message } = await apiPost<ProcessedHistoryRow[]>({ action: 'resend_credentials', id: selected.id });
      setRows(data);
      showToast('ok', message ?? 'Credenciales reenviadas correctamente.');
    } catch (e) {
      showToast('err', e instanceof Error ? e.message : 'No se pudieron reenviar las credenciales.');
    } finally {
      setBusy(false);
    }
  }

  function exportRecord() {
    if (!selected) return;
    window.location.href = `/api/platform/history-report?id=${encodeURIComponent(selected.id)}`;
    showToast('ok', 'Informe descargado.');
  }

  const chips: { id: FilterChip; label: string }[] = [
    { id: 'all', label: 'Todas' },
    { id: 'approved', label: 'Aprobadas' },
    { id: 'rejected', label: 'Rechazadas' },
    { id: 'today', label: 'Procesadas hoy' },
    { id: 'with_tenant', label: 'Con tenant creado' },
    { id: 'no_tenant', label: 'Sin tenant' },
    { id: 'incidents', label: 'Con incidencias' }
  ];

  return (
    <PlatformShell
      title="Historial de altas"
      subtitle="Consulta solicitudes aprobadas, rechazadas y procesadas, con trazabilidad de decisión y creación de tenant."
      headerActions={
        <>
          <button type="button" className="plt-btn plt-btn--ghost" disabled={loading} onClick={() => void load()} aria-label="Actualizar">
            <RefreshCw className={`h-4 w-4${loading ? ' animate-spin' : ''}`} aria-hidden />
          </button>
          <button type="button" className="plt-btn plt-btn--secondary" onClick={() => { window.location.href = '/api/platform/history-export'; showToast('ok', 'Historial exportado.'); }}>
            <Download className="h-4 w-4" aria-hidden />Exportar historial
          </button>
          <button type="button" className="plt-btn plt-btn--secondary" onClick={() => {
            const id = selected?.id ?? rows[0]?.id;
            if (id) window.location.href = `/api/platform/history-report?id=${encodeURIComponent(id)}`;
            else showToast('err', 'No hay registros para exportar.');
          }}>
            <FileText className="h-4 w-4" aria-hidden />Descargar informe
          </button>
          <button type="button" className="plt-btn plt-btn--ghost" onClick={() => (window.location.href = selected ? `/platform/incidencias` : '/platform/incidencias')}>
            <Shield className="h-4 w-4" aria-hidden />Ver auditoría
          </button>
        </>
      }
    >
      <div className={`hist-page cln-layout${selected ? ' cln-page--panel-open' : ''}`}>
        <div className="cln-kpis plt-kpis">
          {KPI_CONFIG.map((k, i) => (
            <HistKpi key={k.label} label={k.label} value={kpis[k.key]} icon={k.icon} tone={k.tone} spark={k.spark} delay={i * 70} numeric={'numeric' in k ? k.numeric : false} />
          ))}
        </div>

        <div className="cln-toolbar">
          <label className="cln-search">
            <Search className="cln-search__icon h-4 w-4" aria-hidden />
            <input placeholder="Buscar por clínica, responsable, email, tenant o decisión…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Buscar historial" />
          </label>
          <div className="cln-toolbar__row">
            <div className="cln-chips" role="tablist">
              {chips.map((c) => (
                <button key={c.id} type="button" role="tab" aria-selected={chip === c.id} className={`cln-chip${chip === c.id ? ' cln-chip--active' : ''}`} onClick={() => setChip(c.id)}>{c.label}</button>
              ))}
            </div>
            <select className="cln-toolbar__sort" value={sort} onChange={(e) => setSort(e.target.value as SortMode)} aria-label="Ordenar">
              <option value="decision">Ordenar por: fecha de decisión</option>
              <option value="clinic">Ordenar por: clínica</option>
              <option value="decision_type">Ordenar por: decisión</option>
            </select>
          </div>
        </div>

        <section className="cln-card">
          <h2 className="cln-card__title">
            Solicitudes procesadas
            <span className="hist-card-count">({filtered.length} {filtered.length === 1 ? 'resultado' : 'resultados'})</span>
          </h2>

          {filtered.length === 0 ? (
            <section className="hist-empty">
              <Search className="hist-empty__icon" aria-hidden />
              <h3 className="hist-empty__title">No hay altas procesadas con este filtro</h3>
              <p className="hist-empty__text">Cuando apruebes o rechaces solicitudes de clínicas, aparecerán aquí con el historial completo de decisión.</p>
              <div className="hist-empty__actions">
                <a href="/platform/registros" className="plt-btn plt-btn--primary">Ver pendientes</a>
                <button type="button" className="plt-btn plt-btn--secondary" onClick={clearFilters}>Limpiar filtros</button>
              </div>
            </section>
          ) : (
            <>
              <div className="cln-table-wrap">
                <table className="cln-table hist-table">
                  <thead>
                    <tr>
                      <th>Clínica</th><th>Responsable</th><th>Decisión</th><th>Tenant</th><th>Plan</th><th>Procesado por</th><th>Fecha</th><th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((r, i) => (
                      <tr key={r.id} className={selected?.id === r.id ? 'cln-table__row--active' : ''} style={{ animationDelay: `${i * 45}ms` }} onClick={() => setSelected(r)}>
                        <td>
                          <div className="cln-clinic-cell">
                            <strong>{r.clinic_name}</strong>
                            <span>{r.clinic_url}</span>
                          </div>
                        </td>
                        <td>{r.owner_name}</td>
                        <td><span className={`cln-badge ${decisionBadgeClass(r.decision)}`}>{r.decision_label}</span></td>
                        <td className="cln-detail__row-value--mono">{r.tenant_display}</td>
                        <td className="cln-val--plan">{r.plan_label}</td>
                        <td>{r.processed_by}</td>
                        <td>{r.decision_date_label}</td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="cln-actions">
                            <button type="button" className="cln-icon-btn cln-icon-btn--tip" data-tip="Ver detalle" onClick={() => setSelected(r)}><Eye className="h-3.5 w-3.5" /></button>
                            <button type="button" className="cln-icon-btn cln-icon-btn--tip" data-tip="Ver tenant" onClick={() => (window.location.href = '/platform/aislamiento')}><Database className="h-3.5 w-3.5" /></button>
                            <button type="button" className="cln-icon-btn cln-icon-btn--tip" data-tip="Ver auditoría" onClick={() => (window.location.href = '/platform/incidencias')}><Shield className="h-3.5 w-3.5" /></button>
                            <div className="cln-menu">
                              <button type="button" className="cln-icon-btn" aria-label="Más" onClick={() => setMenuId(menuId === r.id ? null : r.id)}><MoreVertical className="h-3.5 w-3.5" /></button>
                              {menuId === r.id ? (
                                <div className="cln-menu__pop">
                                  <button type="button" onClick={() => { setSelected(r); setMenuId(null); }}>Ver detalle</button>
                                  <button type="button" onClick={() => { window.location.href = r.clinic_id ? '/platform/clinicas' : '/platform/aislamiento'; setMenuId(null); }}>Ver clínica / tenant</button>
                                  <button type="button" onClick={() => { window.location.href = `/api/platform/history-report?id=${r.id}`; setMenuId(null); }}>Exportar registro</button>
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
                  <article key={r.id} className={`cln-mobile-card${selected?.id === r.id ? ' cln-mobile-card--active' : ''}`} onClick={() => setSelected(r)}>
                    <p className="font-bold">{r.clinic_name}</p>
                    <p className="text-xs text-[var(--muted)]">{r.decision_label} · {r.decision_date_label}</p>
                  </article>
                ))}
              </div>
              <footer className="reg-footer">
                <span>Mostrando {filtered.length ? (page - 1) * pageSize + 1 : 0} a {Math.min(page * pageSize, filtered.length)} de {filtered.length} {filtered.length === 1 ? 'resultado' : 'resultados'}</span>
                <div className="reg-footer__pages">
                  <button type="button" className="cln-icon-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>‹</button>
                  <span>{page} / {totalPages}</span>
                  <button type="button" className="cln-icon-btn" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>›</button>
                  <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="cln-toolbar__sort"><option value={10}>10 por página</option><option value={20}>20 por página</option></select>
                </div>
              </footer>
            </>
          )}
        </section>

        {selected ? (
          <>
            <div className="cln-detail__backdrop" role="presentation" onClick={() => setSelected(null)} />
            <aside className="cln-detail">
              <div className="cln-detail__head">
                <div>
                  <h2 className="cln-detail__title">Detalle de alta</h2>
                  <span className={`cln-badge ${decisionBadgeClass(selected.decision)}`}>{selected.decision_label}</span>
                </div>
                <button type="button" className="cln-icon-btn" aria-label="Cerrar" onClick={() => setSelected(null)}><X className="h-4 w-4" /></button>
              </div>
              <div className="cln-detail__body">
                <ul className="cln-detail__meta">
                  <DetailRow label="Clínica" value={selected.clinic_name} icon={Building2} />
                  <DetailRow label="Responsable" value={selected.owner_name} icon={User} />
                  <DetailRow label="Email" value={selected.email} icon={Mail} />
                  <DetailRow label="Teléfono" value={selected.phone} icon={Phone} />
                  <DetailRow label="Estado final" value={selected.decision_label} icon={CheckCircle2} />
                  <DetailRow label="Plan asignado" value={selected.plan_label} icon={CheckCircle2} valueClass="cln-val--plan" />
                  <DetailRow label="Tenant creado" value={selected.tenant_slug} icon={Link2} mono />
                  <DetailRow label="Fecha solicitud" value={selected.request_date_label} icon={Clock} />
                  <DetailRow label="Fecha decisión" value={selected.decision_date_label} icon={Clock} />
                  <DetailRow label="Procesado por" value={selected.processed_by} icon={User} />
                  <DetailRow label="Credenciales enviadas" value={selected.credentials_sent ? 'Sí' : 'No'} icon={Shield} />
                  <DetailRow label="Email bienvenida enviado" value={selected.welcome_email_sent ? 'Sí' : 'No'} icon={Mail} />
                  <DetailRow label="Motivo de rechazo" value={selected.rejection_reason ?? '—'} icon={XCircle} />
                </ul>
                <p className="cln-detail__actions-title">Línea de tiempo</p>
                <ul className="hist-timeline">
                  {selected.timeline.map((step, i) => (
                    <li key={step.id} className={`hist-timeline__item${step.done ? ' hist-timeline__item--done' : ''}${step.active ? ' hist-timeline__item--active' : ''}`} style={{ animationDelay: `${i * 80}ms` }}>
                      <span className="hist-timeline__dot" aria-hidden />
                      <span className="hist-timeline__label">{step.label}</span>
                    </li>
                  ))}
                </ul>
                <p className="cln-detail__actions-title">Acciones rápidas</p>
                <div className="cln-detail__actions">
                  <button type="button" className="cln-qa-btn" onClick={() => (window.location.href = '/platform/clinicas')}>Ver clínica</button>
                  <button type="button" className="cln-qa-btn" onClick={() => (window.location.href = '/platform/aislamiento')}>Ver tenant</button>
                  <button type="button" className="cln-qa-btn" onClick={() => (window.location.href = '/platform/incidencias')}>Ver auditoría</button>
                  {selected.decision === 'approved' ? (
                    <button type="button" className="cln-qa-btn" disabled={busy} onClick={() => void resendCredentials()}>Reenviar credenciales</button>
                  ) : null}
                  <button type="button" className="cln-qa-btn" onClick={exportRecord}>Exportar registro</button>
                </div>
              </div>
            </aside>
          </>
        ) : null}

        {toast ? <div className={`plt-toast plt-toast--${toast.type === 'ok' ? 'ok' : 'err'}`} role="status">{toast.text}</div> : null}
        {loading && !rows.length ? <p className="text-sm text-[var(--muted)]">Cargando historial…</p> : null}
      </div>
    </PlatformShell>
  );
}

function DetailRow({ label, value, icon: Icon, valueClass, mono }: { label: string; value: ReactNode; icon: LucideIcon; valueClass?: string; mono?: boolean }) {
  return (
    <li className="cln-detail__row">
      <span className="cln-detail__row-label"><Icon className="h-3.5 w-3.5" aria-hidden />{label}</span>
      <span className={`cln-detail__row-value${valueClass ? ` ${valueClass}` : ''}${mono ? ' cln-detail__row-value--mono' : ''}`}>{value}</span>
    </li>
  );
}

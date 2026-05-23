import { useCallback, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import {
  Activity, BarChart3, Building2, CheckCircle2, Clock, Download, Eye, FileText, Globe, Layers,
  MoreVertical, RefreshCw, Search, Settings, Shield, Star, Users, X
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useCountUp } from '@/hooks/useCountUp';
import { PRIVACY_CHECKLIST, getHeatmapRows, type ClinicMetricsRow, type MetricsPayload } from '@/lib/platform/metricsDemo';
import { PlatformShell } from './PlatformShell';

async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'include', headers: { 'content-type': 'application/json' } });
  const json = (await res.json()) as { data?: T; error?: { message?: string } };
  if (!res.ok) throw new Error(json.error?.message ?? 'Error de servidor');
  return json.data as T;
}

async function apiPost<T>(body: Record<string, unknown>): Promise<{ data: T; message?: string }> {
  const res = await fetch('/api/platform/metrics', {
    method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body)
  });
  const json = (await res.json()) as { data?: T; error?: { message?: string }; meta?: { message?: string } };
  if (!res.ok) throw new Error(json.error?.message ?? 'No se pudieron cargar las métricas.');
  return { data: json.data as T, message: json.meta?.message };
}

type FilterChip = 'all' | 'today' | '7d' | '30d' | 'agenda' | 'patients' | 'billing' | 'patient_portal';
type RangeKey = 'today' | '7d' | '30d';
type GroupKey = 'day' | 'week' | 'month';
type Modal = 'modules' | 'retention' | null;

function Sparkline({ points, tone }: { points: number[]; tone: string }) {
  const max = Math.max(...points, 1);
  const coords = points.map((p, i) => `${(i / Math.max(points.length - 1, 1)) * 100},${100 - (p / max) * 100}`).join(' ');
  return (
    <svg className={`plt-spark plt-spark--${tone}`} viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden>
      <polyline className="plt-spark__line" points={coords} />
    </svg>
  );
}

function MetKpi({ label, value, sub, icon: Icon, tone, spark, delay, numeric }: {
  label: string; value: string | number; sub?: string; icon: LucideIcon; tone: string; spark: number[]; delay: number; numeric?: boolean;
}) {
  const n = numeric && typeof value === 'number' ? useCountUp(value, 750) : value;
  return (
    <article className="plt-kpi cln-kpi met-kpi" style={{ animationDelay: `${delay}ms` }}>
      <span className={`plt-kpi__icon plt-kpi__icon--${tone}`}><Icon className="h-4 w-4" aria-hidden /></span>
      <div className="plt-kpi__body">
        <p className="plt-kpi__label">{label}</p>
        <p className="plt-kpi__value">{n}</p>
        {sub ? <p className="met-kpi__sub">{sub}</p> : null}
      </div>
      <Sparkline points={spark} tone={tone} />
    </article>
  );
}

function LineChart({ data, chartKey, setTooltip }: {
  data: { label: string; value: number }[]; chartKey: number; setTooltip: (v: string | null) => void;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const w = 320; const h = 120; const pad = 12;
  const pts = data.map((d, i) => {
    const x = pad + (i / Math.max(data.length - 1, 1)) * (w - pad * 2);
    const y = h - pad - (d.value / max) * (h - pad * 2);
    return { x, y, ...d };
  });
  const line = pts.map((p) => `${p.x},${p.y}`).join(' ');
  const area = `${pad},${h - pad} ${line} ${w - pad},${h - pad}`;
  return (
    <>
      <svg key={chartKey} className="met-line-chart" viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Eventos por día">
        <defs>
          <linearGradient id="metAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon className="met-line-chart__area" points={area} />
        <polyline className="met-line-chart__line" points={line} />
        {pts.map((p, i) => (
          <circle key={p.label} className="met-line-chart__dot" cx={p.x} cy={p.y} r={4}
            style={{ animationDelay: `${0.8 + i * 0.08}s` }}
            onMouseEnter={() => setTooltip(`${p.label}: ${p.value} eventos`)}
            onMouseLeave={() => setTooltip(null)} />
        ))}
      </svg>
      <div className="met-line-labels">{data.map((d) => <span key={d.label}>{d.label}</span>)}</div>
    </>
  );
}

function DonutChart({ clinicPct, portalPct, chartKey }: { clinicPct: number; portalPct: number; chartKey: number }) {
  const r = 42; const c = 2 * Math.PI * r;
  return (
    <div className="met-donut-wrap">
      <svg key={chartKey} className="met-donut" viewBox="0 0 100 100" role="img" aria-label="Panel vs portal">
        <circle className="met-donut__bg" cx="50" cy="50" r={r} />
        <circle className="met-donut__fg" cx="50" cy="50" r={r}
          style={{ strokeDasharray: `${(clinicPct / 100) * c} ${c}` } as CSSProperties} />
        <circle className="met-donut__fg met-donut__fg--portal" cx="50" cy="50" r={r}
          transform="rotate(-90 50 50)"
          style={{ strokeDasharray: `${(portalPct / 100) * c} ${c}`, strokeDashoffset: -((clinicPct / 100) * c) } as CSSProperties} />
      </svg>
      <div>
        <p className="text-lg font-extrabold text-slate-800">{clinicPct}%</p>
        <p className="text-xs text-slate-500">Panel clínica</p>
        <ul className="met-donut-legend">
          <li><span style={{ background: '#0d9488' }} />Panel clínica ({clinicPct}%)</li>
          <li><span style={{ background: '#38bdf8' }} />Portal paciente ({portalPct}%)</li>
        </ul>
      </div>
    </div>
  );
}

export function PlatformMetrics() {
  const [payload, setPayload] = useState<MetricsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [chip, setChip] = useState<FilterChip>('all');
  const [clinicFilter, setClinicFilter] = useState('all');
  const [range, setRange] = useState<RangeKey>('30d');
  const [groupBy, setGroupBy] = useState<GroupKey>('day');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<ClinicMetricsRow | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [didAutoSelect, setDidAutoSelect] = useState(false);
  const [modal, setModal] = useState<Modal>(null);
  const [moduleTarget, setModuleTarget] = useState<ClinicMetricsRow | null>(null);
  const [retentionDays, setRetentionDays] = useState('90');
  const [tooltip, setTooltip] = useState<string | null>(null);
  const [chartKey, setChartKey] = useState(0);

  const showToast = useCallback((type: 'ok' | 'err', text: string) => {
    setToast({ type, text });
    window.setTimeout(() => setToast(null), 4200);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try { setPayload(await apiGet<MetricsPayload>('/api/platform/metrics')); setChartKey((k) => k + 1); }
    catch { showToast('err', 'No se pudieron cargar las métricas.'); }
    finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (payload && !didAutoSelect && payload.clinics.length) {
      setSelected(payload.clinics.find((c) => c.id.includes('000000000001')) ?? payload.clinics[0]);
      setDidAutoSelect(true);
      setRetentionDays(String(payload.retention_days));
    }
  }, [payload, didAutoSelect]);
  useEffect(() => {
    if (selected && payload) { const f = payload.clinics.find((c) => c.id === selected.id); if (f) setSelected(f); }
  }, [payload, selected?.id]);
  useEffect(() => { setPage(1); }, [search, chip, clinicFilter, range]);

  const rangeFactor = range === 'today' ? 0.35 : range === '7d' ? 0.72 : 1;
  const dailyEvents = useMemo(() => {
    if (!payload) return [];
    const mult = groupBy === 'week' ? 1.2 : groupBy === 'month' ? 1.5 : 1;
    return payload.daily_events.map((d) => ({ ...d, value: Math.max(1, Math.round(d.value * rangeFactor * mult)) }));
  }, [payload, rangeFactor, groupBy]);
  const moduleUsage = useMemo(() => {
    if (!payload) return [];
    let mods = [...payload.module_usage];
    if (chip === 'agenda') mods = mods.filter((m) => m.key === 'agenda');
    if (chip === 'patients') mods = mods.filter((m) => m.key === 'patients');
    if (chip === 'billing') mods = mods.filter((m) => m.key === 'billing');
    if (chip === 'patient_portal') mods = mods.filter((m) => m.key === 'patient_portal');
    return mods.map((m) => ({ ...m, events: Math.round(m.events * rangeFactor) }));
  }, [payload, chip, rangeFactor]);
  const maxModule = Math.max(...moduleUsage.map((m) => m.events), 1);
  const filteredClinics = useMemo(() => {
    if (!payload) return [];
    let list = [...payload.clinics];
    if (clinicFilter !== 'all') list = list.filter((c) => c.id === clinicFilter);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((c) => c.clinic_name.toLowerCase().includes(q) || c.tenant_slug.toLowerCase().includes(q) || c.top_module.toLowerCase().includes(q) || c.modules.some((m) => m.label.toLowerCase().includes(q)));
    if (chip === 'agenda') list = list.filter((c) => c.top_module === 'Agenda');
    return list;
  }, [payload, search, chip, clinicFilter]);
  const totalPages = Math.max(1, Math.ceil(filteredClinics.length / pageSize));
  const pageRows = filteredClinics.slice((page - 1) * pageSize, page * pageSize);
  const heatmap = getHeatmapRows();
  const heatmapDays = payload?.heatmap_days ?? [];
  const portalSplit = payload?.portal_split ?? { clinic_panel: 72, patient_portal: 28 };
  const kpis = payload?.kpis;

  async function refresh() {
    setBusy(true);
    try {
      const { data, message } = await apiPost<MetricsPayload>({ action: 'refresh' });
      setPayload(data); setChartKey((k) => k + 1);
      showToast('ok', message ?? 'Métricas actualizadas.');
    } catch (e) { showToast('err', e instanceof Error ? e.message : 'No se pudieron cargar las métricas.'); }
    finally { setBusy(false); }
  }
  async function saveRetention() {
    const days = Number(retentionDays);
    if (!days || days < 7) { showToast('err', 'Mínimo 7 días de retención.'); return; }
    setBusy(true);
    try {
      const { data, message } = await apiPost<MetricsPayload>({ action: 'update_retention', retentionDays: days });
      setPayload(data); setModal(null); showToast('ok', message ?? 'Retención configurada.');
    } catch (e) { showToast('err', e instanceof Error ? e.message : 'No se pudo guardar.'); }
    finally { setBusy(false); }
  }
  function syncChipRange(c: FilterChip) {
    setChip(c);
    if (c === 'today') setRange('today');
    if (c === '7d') setRange('7d');
    if (c === '30d') setRange('30d');
  }
  function syncRange(r: RangeKey) {
    setRange(r);
    if (r === 'today') setChip('today');
    else if (r === '7d') setChip('7d');
    else if (r === '30d') setChip('30d');
    else setChip('all');
  }
  const chips: { id: FilterChip; label: string }[] = [
    { id: 'all', label: 'Todas' }, { id: 'today', label: 'Hoy' }, { id: '7d', label: 'Últimos 7 días' },
    { id: '30d', label: 'Últimos 30 días' }, { id: 'agenda', label: 'Agenda' }, { id: 'patients', label: 'Pacientes' },
    { id: 'billing', label: 'Facturación' }, { id: 'patient_portal', label: 'Portal paciente' }
  ];
  const showEmpty = !loading && payload && payload.clinics.length === 0;

  return (
    <PlatformShell title="Métricas de uso" subtitle="Analiza adopción, actividad por clínica, uso de módulos y volumen operativo sin exponer datos clínicos sensibles."
      headerActions={<>
        <button type="button" className="plt-btn plt-btn--primary" disabled={busy} onClick={() => void refresh()}><RefreshCw className={`h-4 w-4${busy ? ' animate-spin' : ''}`} aria-hidden />Actualizar métricas</button>
        <button type="button" className="plt-btn plt-btn--secondary" onClick={() => { window.location.href = '/api/platform/metrics-export'; showToast('ok', 'CSV exportado.'); }}><Download className="h-4 w-4" aria-hidden />Exportar CSV</button>
        <button type="button" className="plt-btn plt-btn--secondary" onClick={() => { const id = selected?.id ?? payload?.clinics[0]?.id; window.location.href = id ? `/api/platform/metrics-report?id=${id}` : '/api/platform/metrics-report'; showToast('ok', 'Informe generado.'); }}><FileText className="h-4 w-4" aria-hidden />Descargar informe</button>
        <button type="button" className="plt-btn plt-btn--ghost" onClick={() => setModal('retention')}><Settings className="h-4 w-4" aria-hidden />Configurar retención</button>
      </>}
    >
      <div className={`met-page cln-layout${selected ? ' cln-page--panel-open' : ''}`}>
        {kpis ? <div className="cln-kpis plt-kpis">
          <MetKpi label="Clínicas activas" value={kpis.active_clinics} icon={Building2} tone="purple" spark={[0,1,1,1,1,1,1]} delay={0} numeric />
          <MetKpi label="Usuarios activos" value={kpis.active_users} icon={Users} tone="teal" spark={[4,5,6,6,6,6,6]} delay={70} numeric />
          <MetKpi label="Sesiones hoy" value={Math.round(kpis.sessions_today * rangeFactor)} icon={Activity} tone="blue" spark={[8,10,12,12,12,12,12]} delay={140} numeric />
          <MetKpi label="Eventos registrados" value={Math.round(kpis.events_total * rangeFactor)} icon={BarChart3} tone="green" spark={[180,210,230,248,248,248,248]} delay={210} numeric />
          <MetKpi label="Módulo más usado" value={kpis.top_module} sub={`${Math.round(kpis.top_module_events * rangeFactor)} eventos`} icon={Star} tone="orange" spark={[60,70,75,80,80,80,80]} delay={280} />
          <MetKpi label="Última actualización" value={payload?.updated_label ?? '—'} sub="Automática" icon={Clock} tone="red" spark={[1,1,1,1,1,1,1]} delay={350} />
        </div> : null}

        <div className="cln-toolbar">
          <label className="cln-search"><Search className="cln-search__icon h-4 w-4" aria-hidden />
            <input placeholder="Buscar por clínica, tenant, módulo o evento…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Buscar" />
          </label>
          <div className="cln-toolbar__row">
            <div className="cln-chips" role="tablist">{chips.map((c) => (
              <button key={c.id} type="button" role="tab" aria-selected={chip === c.id} className={`cln-chip${chip === c.id ? ' cln-chip--active' : ''}`} onClick={() => syncChipRange(c.id)}>{c.label}</button>
            ))}</div>
            <div className="met-selectors">
              <select value={clinicFilter} onChange={(e) => setClinicFilter(e.target.value)} aria-label="Clínica">
                <option value="all">Clínica: Todas</option>
                {payload?.clinics.map((c) => <option key={c.id} value={c.id}>Clínica: {c.clinic_name}</option>)}
              </select>
              <select value={range} onChange={(e) => syncRange(e.target.value as RangeKey)} aria-label="Rango">
                <option value="today">Rango: Hoy</option>
                <option value="7d">Rango: Últimos 7 días</option>
                <option value="30d">Rango: Últimos 30 días</option>
              </select>
              <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as GroupKey)} aria-label="Agrupar">
                <option value="day">Agrupar por: Día</option>
                <option value="week">Agrupar por: Semana</option>
                <option value="month">Agrupar por: Mes</option>
              </select>
            </div>
          </div>
        </div>

        {showEmpty ? (
          <section className="met-empty">
            <BarChart3 className="met-empty__icon" aria-hidden />
            <h3 className="sub-empty__title">Aún no hay métricas registradas</h3>
            <p className="sub-empty__text">Cuando las clínicas usen agenda, pacientes, documentos, facturación o portal paciente, los eventos agregados aparecerán aquí.</p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button type="button" className="plt-btn plt-btn--primary" onClick={() => void refresh()}>Actualizar métricas</button>
              <a href="/platform/configuracion" className="plt-btn plt-btn--secondary">Ver configuración de eventos</a>
            </div>
          </section>
        ) : (
          <>
            <div className="met-analytics">
              <article className="met-chart-card" style={{ animationDelay: '0ms' }}>
                <h3 className="met-chart-card__title">Eventos por día</h3>
                <LineChart data={dailyEvents} chartKey={chartKey} setTooltip={setTooltip} />
              </article>
              <article className="met-chart-card" style={{ animationDelay: '80ms' }}>
                <h3 className="met-chart-card__title">Uso por módulo</h3>
                <div className="met-hbar">{moduleUsage.map((m, i) => (
                  <div key={m.key} className="met-hbar__row">
                    <span className="met-hbar__label">{m.label}</span>
                    <div className="met-hbar__track"><div className="met-hbar__fill" style={{ width: `${(m.events / maxModule) * 100}%`, transitionDelay: `${i * 60}ms` }} /></div>
                    <span className="met-hbar__val">{m.events} eventos</span>
                  </div>
                ))}</div>
              </article>
              <article className="met-chart-card" style={{ animationDelay: '160ms' }}>
                <h3 className="met-chart-card__title">Panel clínica vs Portal paciente</h3>
                <DonutChart clinicPct={portalSplit.clinic_panel} portalPct={portalSplit.patient_portal} chartKey={chartKey} />
              </article>
              <article className="met-chart-card" style={{ animationDelay: '240ms' }}>
                <h3 className="met-chart-card__title">Horas de mayor actividad</h3>
                <div className="met-heatmap">
                  <table><thead><tr><th />{heatmapDays.map((d) => <th key={d}>{d}</th>)}</tr></thead>
                    <tbody>{heatmap.map((row, ri) => (
                      <tr key={row.hour}><td>{row.hour}</td>{row.values.map((v, ci) => (
                        <td key={ci}><div className="met-heatmap__cell" title={`${row.hour} ${heatmapDays[ci]}: ${Math.round(v * 100)}%`}
                          style={{ background: `rgba(13, 148, 136, ${0.12 + v * 0.88})`, animationDelay: `${ri * 40 + ci * 25}ms` }} /></td>
                      ))}</tr>
                    ))}</tbody>
                  </table>
                </div>
              </article>
            </div>

            <section className="cln-card">
              <h2 className="cln-card__title">Actividad por clínica <span className="hist-card-count">({filteredClinics.length} {filteredClinics.length === 1 ? 'resultado' : 'resultados'})</span></h2>
              {filteredClinics.length === 0 ? (
                <section className="met-empty"><Search className="met-empty__icon" aria-hidden /><h3 className="sub-empty__title">Sin resultados</h3>
                  <button type="button" className="plt-btn plt-btn--secondary" onClick={() => { setSearch(''); setChip('all'); setClinicFilter('all'); }}>Limpiar filtros</button></section>
              ) : (
                <>
                  <div className="cln-table-wrap"><table className="cln-table met-table"><thead><tr>
                    <th>Clínica</th><th>Tenant</th><th>Usuarios activos</th><th>Sesiones</th><th>Eventos</th><th>Última actividad</th><th>Estado</th><th>Acciones</th>
                  </tr></thead><tbody>{pageRows.map((r, i) => (
                    <tr key={r.id} className={selected?.id === r.id ? 'cln-table__row--active' : ''} style={{ animationDelay: `${i * 45}ms` }} onClick={() => setSelected(r)}>
                      <td><div className="met-clinic-cell"><strong>{r.clinic_name}</strong><span>{r.clinic_city}</span></div></td>
                      <td><span className="cln-detail__row-value--mono">{r.tenant_slug}</span></td>
                      <td>{r.active_users}</td><td>{Math.round(r.sessions * rangeFactor)}</td><td>{Math.round(r.events * rangeFactor)}</td>
                      <td>{r.last_activity}</td>
                      <td><span className="cln-badge cln-badge--status sop-badge--status-open"><span className="cln-status-dot" />{r.status_label}</span></td>
                      <td onClick={(e) => e.stopPropagation()}><div className="cln-actions">
                        <button type="button" className="cln-icon-btn cln-icon-btn--tip" data-tip="Ver detalle" onClick={() => setSelected(r)}><Eye className="h-3.5 w-3.5" /></button>
                        <button type="button" className="cln-icon-btn cln-icon-btn--tip" data-tip="Ver módulos" onClick={() => { setModuleTarget(r); setModal('modules'); }}><BarChart3 className="h-3.5 w-3.5" /></button>
                        <button type="button" className="cln-icon-btn cln-icon-btn--tip" data-tip="Exportar" onClick={() => { window.location.href = `/api/platform/metrics-report?id=${r.id}`; showToast('ok', 'Exportando…'); }}><Download className="h-3.5 w-3.5" /></button>
                        <div className="cln-menu"><button type="button" className="cln-icon-btn" onClick={() => setMenuId(menuId === r.id ? null : r.id)}><MoreVertical className="h-3.5 w-3.5" /></button>
                          {menuId === r.id ? <div className="cln-menu__pop">
                            <button type="button" onClick={() => { window.location.href = '/platform/incidencias'; setMenuId(null); }}>Ver auditoría</button>
                            <button type="button" onClick={() => { setModal('retention'); setMenuId(null); }}>Configurar retención</button>
                          </div> : null}
                        </div>
                      </div></td>
                    </tr>
                  ))}</tbody></table></div>
                  <div className="cln-mobile-list">{pageRows.map((r) => (
                    <article key={r.id} className={`cln-mobile-card${selected?.id === r.id ? ' cln-mobile-card--active' : ''}`} onClick={() => setSelected(r)}>
                      <p className="font-bold">{r.clinic_name}</p><p className="text-xs text-[var(--muted)]">{r.events} eventos · {r.status_label}</p>
                    </article>
                  ))}</div>
                  <footer className="reg-footer">
                    <span>Mostrando {(page - 1) * pageSize + 1} a {Math.min(page * pageSize, filteredClinics.length)} de {filteredClinics.length} {filteredClinics.length === 1 ? 'resultado' : 'resultados'}</span>
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

            <section className="met-privacy">
              <h3 className="met-privacy__title"><Shield className="h-4 w-4" aria-hidden />Privacidad de métricas</h3>
              <ul className="met-privacy__list">{PRIVACY_CHECKLIST.map((item) => (
                <li key={item}><CheckCircle2 className="h-3.5 w-3.5" aria-hidden />{item}</li>
              ))}</ul>
            </section>
          </>
        )}

        {selected ? (<>
          <div className="cln-detail__backdrop" role="presentation" onClick={() => setSelected(null)} />
          <aside className="cln-detail">
            <div className="cln-detail__head">
              <div><h2 className="cln-detail__title">Detalle de uso</h2><p className="text-xs text-[var(--muted)]">{selected.clinic_name}</p></div>
              <button type="button" className="cln-icon-btn" onClick={() => setSelected(null)} aria-label="Cerrar"><X className="h-4 w-4" /></button>
            </div>
            <div className="cln-detail__body">
              <ul className="cln-detail__meta">
                <DetailRow label="Clínica" value={selected.clinic_name} icon={Building2} />
                <DetailRow label="Tenant" value={selected.tenant_slug} icon={Layers} mono />
                <DetailRow label="Usuarios activos" value={String(selected.active_users)} icon={Users} />
                <DetailRow label="Sesiones hoy" value={String(Math.round(selected.sessions * rangeFactor))} icon={Activity} />
                <DetailRow label="Eventos registrados" value={String(Math.round(selected.events * rangeFactor))} icon={BarChart3} />
                <DetailRow label="Módulo más usado" value={selected.top_module} icon={Star} />
                <DetailRow label="Portal paciente" value={`${selected.patient_portal_pct}%`} icon={Globe} />
                <DetailRow label="Panel clínica" value={`${selected.clinic_panel_pct}%`} icon={Building2} />
                <DetailRow label="Última actividad" value={selected.last_activity} icon={Clock} />
                <DetailRow label="Estado" value={selected.status_label} icon={CheckCircle2} />
              </ul>
              <div className="sop-detail-card">
                <h3 className="sop-detail-card__title">Uso por módulo</h3>
                <ul className="met-module-list">{selected.modules.map((m) => (
                  <li key={m.key}><span>{m.label}</span><strong>{Math.round(m.events * rangeFactor)}</strong></li>
                ))}</ul>
              </div>
              <p className="cln-detail__actions-title">Acciones rápidas</p>
              <div className="sop-qa-grid">
                <button type="button" className="cln-qa-btn" onClick={() => setSelected(selected)}>Ver actividad</button>
                <button type="button" className="cln-qa-btn" onClick={() => { window.location.href = `/api/platform/metrics-report?id=${selected.id}`; }}>Exportar métricas</button>
                <button type="button" className="cln-qa-btn" onClick={() => setModal('retention')}>Configurar retención</button>
                <a href="/platform/incidencias" className="cln-qa-btn no-underline">Ver auditoría</a>
              </div>
              <div className="sop-detail-card" style={{ background: '#eff6ff', borderColor: '#bfdbfe' }}>
                <p className="text-xs text-slate-600"><strong>Importante:</strong> Las métricas no incluyen nombres de pacientes, historiales clínicos ni contenido de documentos.</p>
              </div>
            </div>
          </aside>
        </>) : null}

        {modal === 'modules' && moduleTarget ? (
          <div className="met-modal-backdrop" role="dialog" aria-modal="true"><div className="met-modal">
            <div className="met-modal__head"><h3 className="met-modal__title">Módulos — {moduleTarget.clinic_name}</h3><button type="button" className="cln-icon-btn" onClick={() => setModal(null)}><X className="h-4 w-4" /></button></div>
            <div className="met-modal__body"><ul className="met-module-list">{moduleTarget.modules.map((m) => (
              <li key={m.key}><span>{m.label}</span><strong>{m.events} eventos</strong></li>
            ))}</ul></div>
            <div className="met-modal__foot"><button type="button" className="plt-btn plt-btn--primary" onClick={() => setModal(null)}>Cerrar</button></div>
          </div></div>
        ) : null}

        {modal === 'retention' ? (
          <div className="met-modal-backdrop" role="dialog" aria-modal="true"><div className="met-modal">
            <div className="met-modal__head"><h3 className="met-modal__title">Configurar retención</h3><button type="button" className="cln-icon-btn" onClick={() => setModal(null)}><X className="h-4 w-4" /></button></div>
            <div className="met-modal__body">
              <p className="text-xs text-[var(--muted)]">Los eventos agregados se conservan durante el periodo configurado. No afecta a datos clínicos.</p>
              <div className="met-field"><label>Días de retención</label>
                <input type="number" min={7} max={365} value={retentionDays} onChange={(e) => setRetentionDays(e.target.value)} />
              </div>
              <p className="text-xs">Actual: {payload?.retention_label ?? '90 días'}</p>
            </div>
            <div className="met-modal__foot">
              <button type="button" className="plt-btn plt-btn--ghost" onClick={() => setModal(null)}>Cancelar</button>
              <button type="button" className="plt-btn plt-btn--primary" disabled={busy} onClick={() => void saveRetention()}>Guardar</button>
            </div>
          </div></div>
        ) : null}

        {tooltip ? <div className="met-tooltip" role="status">{tooltip}</div> : null}
        {toast ? <div className={`plt-toast plt-toast--${toast.type === 'ok' ? 'ok' : 'err'}`} role="status">{toast.text}</div> : null}
        {loading && !payload ? <p className="text-sm text-[var(--muted)]">Cargando métricas…</p> : null}
      </div>
    </PlatformShell>
  );
}

function DetailRow({ label, value, icon: Icon, mono }: { label: string; value: ReactNode; icon: LucideIcon; mono?: boolean }) {
  return (
    <li className="cln-detail__row">
      <span className="cln-detail__row-label"><Icon className="h-3.5 w-3.5" aria-hidden />{label}</span>
      <span className={`cln-detail__row-value${mono ? ' cln-detail__row-value--mono' : ''}`}>{value}</span>
    </li>
  );
}

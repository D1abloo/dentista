import { useCallback, useEffect, useState } from 'react';
import { Activity, Download, Lock, LogIn, Search, ShieldAlert, XCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useCountUp } from '@/hooks/useCountUp';
import { DentistaWebpLockup } from '@/components/brand/DentistaWebpLogo';
import { PlatformMonitoringToolbar } from './PlatformMonitoringToolbar';
import { PlatformShell } from './PlatformShell';
import { MonitoringCriticalAlerts } from './monitoring/MonitoringCriticalAlerts';
import { MonitoringDetail } from './monitoring/MonitoringDetail';
import type {
  CriticalAlert,
  MonitoringChip,
  MonitoringEventRow,
  MonitoringKpi,
  MonitoringKpiId,
  MonitoringPayload
} from '@/lib/platform/monitoringTypes';

type ApiPayload = MonitoringPayload & {
  filtered_total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

const CHIPS: { id: MonitoringChip; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'login', label: 'Login' },
  { id: 'security', label: 'Seguridad' },
  { id: 'errors', label: 'Errores' },
  { id: 'downloads', label: 'Descargas' },
  { id: 'critical', label: 'Críticos' }
];

const KPI_ICONS: Record<string, LucideIcon> = {
  events_today: Activity,
  logins_ok: LogIn,
  logins_failed: XCircle,
  access_denied: Lock,
  critical_errors: ShieldAlert,
  downloads: Download
};

async function fetchMonitoring(params: URLSearchParams): Promise<ApiPayload> {
  const res = await fetch(`/api/platform/monitoring?${params}`, { credentials: 'include' });
  const json = (await res.json()) as { data?: ApiPayload; error?: { message?: string } };
  if (!res.ok) throw new Error(json.error?.message ?? 'No se pudieron cargar los registros.');
  return json.data as ApiPayload;
}

function severityClass(s: string) {
  return `mon-sev mon-sev--${s}`;
}

function resultClass(r: string) {
  return `mon-result mon-result--${r}`;
}

function buildPageList(current: number, total: number): (number | 'gap')[] {
  if (total <= 1) return [1];
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | 'gap')[] = [1];
  if (current > 3) pages.push('gap');
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let p = start; p <= end; p += 1) pages.push(p);
  if (current < total - 2) pages.push('gap');
  pages.push(total);
  return pages;
}

function MonKpiCard({
  kpi,
  active,
  onClick
}: {
  kpi: MonitoringKpi;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = KPI_ICONS[kpi.id] ?? Activity;
  const n = useCountUp(kpi.value, 700);
  const trendClass =
    kpi.trend_direction === 'neutral'
      ? 'mon-kpi__trend--neutral'
      : kpi.trend_positive
        ? 'mon-kpi__trend--up'
        : 'mon-kpi__trend--down';

  return (
    <button
      type="button"
      className={`mon-kpi${active ? ' mon-kpi--active' : ''}`}
      onClick={onClick}
      aria-pressed={active}
    >
      <span className={`mon-kpi__icon mon-kpi__icon--${kpi.id}`}>
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <span className="mon-kpi__label">{kpi.label}</span>
      <span className="mon-kpi__value">{n}</span>
      <span className={`mon-kpi__trend ${trendClass}`}>{kpi.trend_label}</span>
    </button>
  );
}

function HourlyChart({ data }: { data: { hour: string; events: number }[] }) {
  const max = Math.max(...data.map((d) => d.events), 1);
  const avg = data.reduce((s, d) => s + d.events, 0) / data.length;
  const peakIdx = data.reduce((best, d, i, arr) => (d.events > arr[best]!.events ? i : best), 0);

  return (
    <div className="mon-hourly">
      <div className="mon-hourly__bars">
        {data.map((d, i) => (
          <div key={d.hour} className="mon-hourly__col">
            <div
              className={`mon-hourly__bar${i === peakIdx ? ' mon-hourly__bar--peak' : ''}`}
              style={{ height: `${(d.events / max) * 100}%`, animationDelay: `${i * 60}ms` }}
              title={`${d.events} eventos`}
            />
            <span className="mon-hourly__label">{d.hour}</span>
          </div>
        ))}
        <div className="mon-hourly__avg" style={{ bottom: `${(avg / max) * 100}%` }} aria-hidden />
      </div>
      <div className="mon-hourly__legend">
        <span>
          <i className="mon-dot mon-dot--teal" /> Eventos
        </span>
        <span>
          <i className="mon-dot mon-dot--dash" /> Promedio
        </span>
      </div>
    </div>
  );
}

function ModuleDonut({ total, segments }: { total: number; segments: { label: string; percent: number; color: string }[] }) {
  const r = 40;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="mon-donut-wrap">
      <div className="mon-donut__chart">
        <svg viewBox="0 0 100 100" className="mon-donut" aria-hidden>
          <circle cx="50" cy="50" r={r} fill="none" stroke="#e8eef4" strokeWidth="10" />
          {segments.map((s) => {
            const dash = (s.percent / 100) * c;
            const el = (
              <circle
                key={s.label}
                cx="50"
                cy="50"
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${c - dash}`}
                strokeDashoffset={-offset}
                className="mon-donut__seg"
              />
            );
            offset += dash;
            return el;
          })}
        </svg>
        <div className="mon-donut__center">
          <strong>{total}</strong>
          <span>Eventos</span>
        </div>
      </div>
      <ul className="mon-donut-legend">
        {segments.map((s) => (
          <li key={s.label}>
            <i style={{ background: s.color }} />
            {s.label} — {s.percent}%
          </li>
        ))}
      </ul>
    </div>
  );
}

function SeverityList({ rows }: { rows: MonitoringPayload['severity_breakdown'] }) {
  return (
    <ul className="mon-sev-list">
      {rows.map((r, i) => (
        <li key={r.severity} style={{ animationDelay: `${i * 50}ms` }}>
          <span className={severityClass(r.severity)}>{r.label}</span>
          <span className="mon-sev-list__count">{r.count}</span>
          <div className="mon-sev-list__bar">
            <div className="mon-sev-list__fill" style={{ width: `${r.percent}%` }} />
          </div>
          <span className="mon-sev-list__pct">{r.percent}%</span>
        </li>
      ))}
    </ul>
  );
}

export function PlatformMonitoring() {
  const [data, setData] = useState<ApiPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);
  const [search, setSearch] = useState('');
  const [chip, setChip] = useState<MonitoringChip>('all');
  const [kpiFilter, setKpiFilter] = useState<MonitoringKpiId | null>(null);
  const [moduleF, setModuleF] = useState('Todos');
  const [severityF, setSeverityF] = useState('Todas');
  const [clinicF, setClinicF] = useState('Todas');
  const [userF, setUserF] = useState('Todos');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<MonitoringEventRow | null>(null);

  const showToast = useCallback((text: string, ok = false) => {
    setToast({ text, ok });
    window.setTimeout(() => setToast(null), 4000);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('q', search.trim());
      params.set('chip', chip);
      if (kpiFilter) params.set('kpi', kpiFilter);
      if (moduleF !== 'Todos') params.set('module', moduleF);
      if (severityF !== 'Todas') params.set('severity', severityF);
      if (clinicF !== 'Todas') params.set('clinic', clinicF);
      if (userF !== 'Todos') params.set('user', userF);
      params.set('page', String(page));
      params.set('page_size', String(pageSize));
      const payload = await fetchMonitoring(params);
      setData(payload);
      setSelected((prev) => {
        if (prev) return payload.events.find((e) => e.id === prev.id) ?? payload.events[2] ?? payload.events[0] ?? null;
        return payload.events[2] ?? payload.events[0] ?? null;
      });
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Error al cargar', false);
    } finally {
      setLoading(false);
    }
  }, [search, chip, kpiFilter, moduleF, severityF, clinicF, userF, page, pageSize, showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const clearFilters = () => {
    setSearch('');
    setChip('all');
    setKpiFilter(null);
    setModuleF('Todos');
    setSeverityF('Todas');
    setClinicF('Todas');
    setUserF('Todos');
    setPage(1);
  };

  const postAction = async (body: Record<string, string>) => {
    setBusy(true);
    try {
      const res = await fetch('/api/platform/monitoring', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body)
      });
      const json = (await res.json()) as { error?: { message?: string }; meta?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message ?? 'Error');
      showToast(json.meta?.message ?? 'Listo', true);
      await load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'No se pudo completar', false);
    } finally {
      setBusy(false);
    }
  };

  const openAlert = (alert: CriticalAlert) => {
    const ev = data?.events.find((e) => e.id === alert.event_id);
    if (ev) {
      setSelected(ev);
      return;
    }
    showToast('No se encontró el evento vinculado a esta alerta.', false);
  };

  const viewRelatedEvents = (event: MonitoringEventRow) => {
    setSelected(null);
    if (event.severity === 'critical') setChip('critical');
    else if (event.module === 'auth') setChip('errors');
    else if (event.module === 'security') setChip('security');
    else setChip('all');
    setPage(1);
    requestAnimationFrame(() => {
      document.getElementById('mon-events-table')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const total = data?.filtered_total ?? 0;
  const totalPages = data?.total_pages ?? 1;
  const pageList = buildPageList(page, totalPages);
  const from = total ? (page - 1) * pageSize + 1 : 0;
  const to = Math.min(page * pageSize, total);

  const headerActions = (
    <button type="button" className="plt-btn plt-btn--secondary plt-btn--sm" onClick={() => window.location.href = '/api/platform/audit-export'}>
      <Download className="h-4 w-4" aria-hidden />
      Exportar
    </button>
  );

  return (
    <PlatformShell title="" subtitle={undefined} headerActions={headerActions} hideHeader exclusiveSidebarFooter>
      <div className={`mon-page${selected ? ' mon-page--detail' : ''}`}>
        {toast ? (
          <div className={`mon-toast mon-toast--${toast.ok ? 'ok' : 'err'}`} role="status">
            {toast.text}
          </div>
        ) : null}

        <PlatformMonitoringToolbar alerts={data?.alerts ?? []} onOpenAlert={openAlert} />


        <header className="mon-head">
          <div className="mon-head__brand">
            <DentistaWebpLockup placement="header" context="platform" showWordmark={false} />
            <div>
              <h1 className="mon-head__title">Monitorización y seguridad</h1>
              <p className="mon-head__sub">
                Supervisa accesos, actividad, errores y eventos de seguridad de la plataforma AgendaClinic.
              </p>
            </div>
          </div>
          <span className="mon-head__badge">Aplicación principal: gestión clínica multi-tenant</span>
        </header>

        {data ? <MonitoringCriticalAlerts alerts={data.alerts} onOpenAlert={openAlert} /> : null}

        <div className="mon-kpis">
          {data?.kpis.map((k) => (
            <MonKpiCard
              key={k.id}
              kpi={k}
              active={kpiFilter === k.id}
              onClick={() => {
                setKpiFilter((prev) => (prev === k.id ? null : k.id));
                setPage(1);
              }}
            />
          ))}
        </div>

        <div className="mon-charts">
          <article className="mon-chart-card">
            <h3>Actividad por hora</h3>
            {data ? <HourlyChart data={data.hourly} /> : null}
          </article>
          <article className="mon-chart-card">
            <h3>Eventos por módulo</h3>
            {data ? <ModuleDonut total={data.total_events} segments={data.modules} /> : null}
          </article>
          <article className="mon-chart-card">
            <h3>Severidad</h3>
            {data ? <SeverityList rows={data.severity_breakdown} /> : null}
          </article>
        </div>

        <section className="mon-filters">
          <div className="mon-filters__search">
            <Search className="h-4 w-4" aria-hidden />
            <input
              type="search"
              placeholder="Buscar por usuario, email, clínica, evento, recurso o IP…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              onKeyDown={(e) => e.key === 'Enter' && void load()}
            />
          </div>
          <div className="mon-chips">
            {CHIPS.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`mon-chip${chip === c.id ? ' mon-chip--active' : ''}`}
                onClick={() => {
                  setChip(c.id);
                  setPage(1);
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="mon-filters__selects">
            <select aria-label="Fecha">
              <option>Hoy</option>
            </select>
            <select value={moduleF} onChange={(e) => { setModuleF(e.target.value); setPage(1); }} aria-label="Módulo">
              <option>Todos</option>
              <option>Auth</option>
              <option>Informes</option>
              <option>Seguridad</option>
              <option>Facturación</option>
            </select>
            <select value={severityF} onChange={(e) => { setSeverityF(e.target.value); setPage(1); }} aria-label="Severidad">
              <option>Todas</option>
              <option>Info</option>
              <option>Bajo</option>
              <option>Medio</option>
              <option>Alto</option>
              <option>Crítico</option>
            </select>
            <select value={clinicF} onChange={(e) => { setClinicF(e.target.value); setPage(1); }} aria-label="Clínica">
              {(data?.clinics ?? ['Todas']).map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <select value={userF} onChange={(e) => { setUserF(e.target.value); setPage(1); }} aria-label="Usuario">
              {(data?.users ?? ['Todos']).map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
            <button type="button" className="mon-filters__clear" onClick={clearFilters}>
              Limpiar filtros
            </button>
          </div>
        </section>

        <div className="mon-main">
          <section id="mon-events-table" className="mon-table-wrap">
            <div className="mon-table-head">
              <h2>
                Actividad reciente <span className="mon-table-head__badge">{data?.total_events ?? 0} eventos</span>
              </h2>
            </div>
            {loading ? (
              <p className="mon-loading">Cargando registros…</p>
            ) : !data?.events.length ? (
              <p className="mon-empty">No hay eventos con estos filtros.</p>
            ) : (
              <div className="mon-table-scroll">
                <table className="mon-table">
                  <thead>
                    <tr>
                      <th>Fecha/Hora</th>
                      <th>Evento</th>
                      <th>Módulo</th>
                      <th>Usuario</th>
                      <th>Rol</th>
                      <th>Clínica</th>
                      <th>Recurso</th>
                      <th>Severidad</th>
                      <th>Resultado</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.events.map((row) => (
                      <tr
                        key={row.id}
                        className={selected?.id === row.id ? 'mon-table__row--active' : ''}
                        onClick={() => setSelected(row)}
                      >
                        <td>{row.date_time_label}</td>
                        <td>{row.event_label}</td>
                        <td>{row.module_label}</td>
                        <td className="mon-table__mono">{row.user_email}</td>
                        <td>{row.user_role}</td>
                        <td>{row.clinic_name}</td>
                        <td>{row.resource_label}</td>
                        <td>
                          <span className={severityClass(row.severity)}>{row.severity_label}</span>
                        </td>
                        <td>
                          <span className={resultClass(row.result)}>{row.result_label}</span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="mon-table__link"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelected(row);
                            }}
                          >
                            Ver detalle
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <footer className="mon-table-foot">
              <span>
                Mostrando {from} a {to} de {total} eventos
              </span>
              <div className="mon-pagination">
                <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  anterior
                </button>
                {pageList.map((p, idx) =>
                  p === 'gap' ? (
                    <span key={`gap-${idx}`}>…</span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      className={page === p ? 'mon-pagination__active' : ''}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </button>
                  )
                )}
                <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  siguiente
                </button>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  aria-label="Filas por página"
                >
                  <option value={10}>10 / página</option>
                  <option value={25}>25 / página</option>
                  <option value={50}>50 / página</option>
                </select>
              </div>
            </footer>
          </section>

          {selected ? (
            <MonitoringDetail
              event={selected}
              onClose={() => setSelected(null)}
              busy={busy}
              onReview={() => void postAction({ action: 'mark_reviewed', id: selected.id })}
              onEscalate={() => void postAction({ action: 'escalate', id: selected.id })}
              onViewResource={() => {
                if (selected.route.startsWith('/admin')) window.location.href = selected.route;
                else showToast('Recurso disponible en panel clínica con permisos.', true);
              }}
              onViewRelated={() => viewRelatedEvents(selected)}
              toast={showToast}
            />
          ) : null}
        </div>
      </div>
    </PlatformShell>
  );
}

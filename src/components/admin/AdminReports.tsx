import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import {
  BarChart3,
  Building2,
  Calendar,
  Check,
  Download,
  Euro,
  FileText,
  Sparkles,
  Stethoscope,
  User,
  Users
} from 'lucide-react';
import { getStoredTenantId, exportCsv } from '@/lib/demoStore';
import { generateInvoicesSummaryPdf } from '@/lib/pdfInvoice';
import { downloadDemoFileRef } from '@/lib/demoFiles';
import {
  RANGE_OPTIONS,
  STATUS_CHART_COLORS,
  buildReportsAnalytics,
  type ReportFilters,
  type ReportRangeId
} from '@/lib/reportsAnalytics';
import { statusLabel, money } from '@/lib/format';
import { useDemoStore } from '@/hooks/useDemoStore';
import { useNotice } from '@/hooks/useNotice';
import { useTenant } from '@/hooks/useTenant';
import { AdminEmptyState } from './ui';
import { Modal } from '@/components/ui';

const TREAT_COLORS = ['#2d8b7d', '#22c55e', '#3b82f6', '#8b5cf6', '#f97316'];

function Sparkline({ points, tone }: { points: number[]; tone: string }) {
  const max = Math.max(...points, 1);
  const coords = points
    .map((p, i) => {
      const x = points.length > 1 ? (i / (points.length - 1)) * 100 : 0;
      const y = 100 - (p / max) * 100;
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg className={`rep-spark rep-spark--${tone}`} viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden>
      <polyline className="rep-spark__line" points={coords} />
    </svg>
  );
}

function FilterSelect({
  label,
  icon: Icon,
  value,
  options,
  onChange
}: {
  label: string;
  icon: typeof Calendar;
  value: string;
  options: { id: string; label: string }[];
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  const current = options.find((o) => o.id === value)?.label ?? label;
  return (
    <div className="rep-select-wrap" ref={ref}>
      <button type="button" className="rep-select-btn" onClick={() => setOpen((v) => !v)}>
        <Icon className="h-4 w-4" aria-hidden />
        {current}
      </button>
      {open ? (
        <ul className="rep-select-menu">
          {options.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                aria-current={o.id === value ? 'true' : undefined}
                onClick={() => {
                  onChange(o.id);
                  setOpen(false);
                }}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function RepKpi({
  label,
  value,
  display,
  trend,
  tone,
  spark
}: {
  label: string;
  value: number;
  display?: string;
  trend: string;
  tone: string;
  spark: number[];
}) {
  const up = trend.includes('▲') || trend.includes('+');
  const fallback =
    label.includes('%') ? `${value}%` : label.includes('€') || label.includes('Ingresos') ? money(value) : String(value);
  return (
    <div className="rep-kpi">
      <div className="rep-kpi__top">
        <span className={`rep-kpi__icon rep-kpi__icon--${tone}`}>
          {tone === 'teal' && <Euro className="h-4 w-4" />}
          {tone === 'blue' && <Calendar className="h-4 w-4" />}
          {tone === 'green' && <Check className="h-4 w-4" />}
          {tone === 'orange' && <FileText className="h-4 w-4" />}
          {tone === 'purple' && <Users className="h-4 w-4" />}
          {tone === 'coral' && <Stethoscope className="h-4 w-4" />}
        </span>
      </div>
      <p className="rep-kpi__label">{label}</p>
      <p className="rep-kpi__value">{display ?? fallback}</p>
      <p className={`rep-kpi__trend${up ? ' rep-kpi__trend--up' : ''}`}>{trend}</p>
      <Sparkline points={spark} tone={tone} />
    </div>
  );
}

export function AdminReports() {
  const { state } = useDemoStore();
  const scope = useTenant();
  const { setNotice } = useNotice();
  const tenantId = getStoredTenantId();
  const clinics = scope.clinics;
  const dentists = scope.dentists.filter((d) => d.active);

  const [exporting, setExporting] = useState<'csv' | 'pdf' | null>(null);
  const [incomeMode, setIncomeMode] = useState<'day' | 'week' | 'month'>('week');
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [dentistsOpen, setDentistsOpen] = useState(false);

  const [filters, setFilters] = useState<ReportFilters>({
    rangeId: '30',
    clinicId: '',
    dentistId: ''
  });

  const data = useMemo(
    () =>
      buildReportsAnalytics(state, tenantId, scope.appointments, scope.invoices, filters),
    [state, tenantId, scope.appointments, scope.invoices, filters]
  );

  const incomeChart = useMemo(
    () => data.aggregateIncome(incomeMode),
    [data, incomeMode]
  );

  function clearFilters() {
    setFilters({ rangeId: '30', clinicId: '', dentistId: '' });
  }

  async function exportPdf() {
    setExporting('pdf');
    try {
      const lines = [
        'REPORTE ANALÍTICO — DENTISTA+',
        `Periodo: ${data.rangeLabel} (${data.start} – ${data.end})`,
        '',
        `Ingresos: ${money(data.kpis.income)}`,
        `Citas: ${data.kpis.appointments}`,
        `Asistencia: ${data.kpis.attendance}%`,
        `Facturas pendientes: ${data.kpis.pendingInvoices}`,
        `Pacientes nuevos: ${data.kpis.newPatients}`,
        '',
        'Citas por estado:',
        ...data.byStatus.map((s) => `- ${statusLabel(s.status)}: ${s.count} (${s.pct}%)`),
        '',
        'Tratamientos top:',
        ...data.topTreatments.map((t, i) => `${i + 1}. ${t.name} — ${t.count}`),
        '',
        'Rendimiento profesional:',
        ...data.dentistRows.map((d) => `- ${d.name}: ${d.appointments} citas, ${money(d.income)}`)
      ];
      const { fileRef, fileName } = await generateInvoicesSummaryPdf([], lines);
      downloadDemoFileRef(fileRef, fileName);
      setNotice({ type: 'ok', message: 'Reporte descargado correctamente.' });
    } catch {
      setNotice({ type: 'error', message: 'No se pudo generar el reporte. Inténtalo de nuevo.' });
    } finally {
      setExporting(null);
    }
  }

  function exportCsvReport() {
    setExporting('csv');
    try {
      exportCsv(
        [
          { metrica: 'Ingresos', valor: data.kpis.income },
          { metrica: 'Citas', valor: data.kpis.appointments },
          { metrica: 'Asistencia %', valor: data.kpis.attendance },
          { metrica: 'Facturas pendientes', valor: data.kpis.pendingInvoices },
          { metrica: 'Pacientes nuevos', valor: data.kpis.newPatients },
          ...data.byStatus.map((s) => ({
            metrica: `Estado ${statusLabel(s.status)}`,
            valor: s.count
          })),
          ...data.topTreatments.map((t) => ({
            metrica: `Tratamiento ${t.name}`,
            valor: t.count
          })),
          ...data.dentistRows.map((d) => ({
            metrica: `Profesional ${d.name}`,
            valor: `${d.appointments} citas / ${d.income} EUR`
          }))
        ],
        `reporte-${data.start}-${data.end}.csv`
      );
      setNotice({ type: 'ok', message: 'Reporte descargado correctamente.' });
    } catch {
      setNotice({ type: 'error', message: 'No se pudo generar el reporte. Inténtalo de nuevo.' });
    } finally {
      setExporting(null);
    }
  }

  if (!data.hasData) {
    return (
      <div className="rep-module">
        <header className="rep-module__head">
          <div>
            <h1>
              <BarChart3 className="h-6 w-6 text-teal-600" aria-hidden />
              Reportes
            </h1>
            <p>Analiza citas, tratamientos, ingresos, ocupación y rendimiento de tu clínica.</p>
          </div>
          <div className="rep-filters">
            <FilterSelect
              label="Periodo"
              icon={Calendar}
              value={filters.rangeId}
              options={RANGE_OPTIONS}
              onChange={(id) => setFilters({ ...filters, rangeId: id as ReportRangeId })}
            />
          </div>
        </header>
        <AdminEmptyState
          title="No hay datos para este periodo"
          description="Prueba con otro rango de fechas o selecciona otra clínica."
          icon={BarChart3}
          action={
            <button type="button" className="rep-btn-primary" onClick={clearFilters}>
              Limpiar filtros
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="rep-module">
      <header className="rep-module__head">
        <div>
          <h1>
            <BarChart3 className="h-6 w-6 text-teal-600" aria-hidden />
            Reportes
          </h1>
          <p>Analiza citas, tratamientos, ingresos, ocupación y rendimiento de tu clínica.</p>
        </div>
        <div className="rep-filters">
          <FilterSelect
            label="Periodo"
            icon={Calendar}
            value={filters.rangeId}
            options={RANGE_OPTIONS}
            onChange={(id) => setFilters({ ...filters, rangeId: id as ReportRangeId })}
          />
          <FilterSelect
            label="Clínica"
            icon={Building2}
            value={filters.clinicId || 'all'}
            options={[{ id: 'all', label: 'Todas las clínicas' }, ...clinics.map((c) => ({ id: c.id, label: c.name }))]}
            onChange={(id) => setFilters({ ...filters, clinicId: id === 'all' ? '' : id })}
          />
          <FilterSelect
            label="Dentista"
            icon={User}
            value={filters.dentistId || 'all'}
            options={[
              { id: 'all', label: 'Todos los dentistas' },
              ...dentists.map((d) => ({ id: d.id, label: d.fullName }))
            ]}
            onChange={(id) => setFilters({ ...filters, dentistId: id === 'all' ? '' : id })}
          />
          <button
            type="button"
            className="rep-btn-secondary"
            disabled={exporting !== null}
            onClick={exportCsvReport}
          >
            <Download className="h-4 w-4" />
            {exporting === 'csv' ? 'Generando reporte…' : 'Exportar CSV'}
          </button>
          <button
            type="button"
            className="rep-btn-primary"
            disabled={exporting !== null}
            onClick={() => void exportPdf()}
          >
            <FileText className="h-4 w-4" />
            {exporting === 'pdf' ? 'Generando reporte…' : 'Descargar PDF'}
          </button>
        </div>
      </header>

      <div className="rep-kpis">
          <RepKpi
            label="Ingresos totales"
            value={data.kpis.income}
            display={money(data.kpis.income)}
            trend={data.kpis.incomeTrend}
            tone="teal"
            spark={data.kpis.incomeSpark}
          />
          <RepKpi
            label="Citas totales"
            value={data.kpis.appointments}
            display={String(data.kpis.appointments)}
            trend={data.kpis.appointmentsTrend}
            tone="blue"
            spark={data.kpis.appointmentsSpark}
          />
          <RepKpi
            label="Tasa de asistencia"
            value={data.kpis.attendance}
            display={`${data.kpis.attendance}%`}
            trend={data.kpis.attendanceTrend}
            tone="green"
            spark={data.kpis.attendanceSpark}
          />
          <RepKpi
            label="Facturas pendientes"
            value={data.kpis.pendingInvoices}
            trend={data.kpis.pendingTrend}
            tone="orange"
            spark={data.kpis.pendingSpark}
          />
          <RepKpi
            label="Pacientes nuevos"
            value={data.kpis.newPatients}
            trend={data.kpis.newPatientsTrend}
            tone="purple"
            spark={data.kpis.newPatientsSpark}
          />
          <div className="rep-kpi">
            <div className="rep-kpi__top">
              <span className="rep-kpi__icon rep-kpi__icon--coral">
                <Stethoscope className="h-4 w-4" />
              </span>
            </div>
            <p className="rep-kpi__label">Tratamiento top</p>
            <p className="rep-kpi__value" style={{ fontSize: '0.88rem' }}>
              {data.kpis.topTreatment}
            </p>
            <p className="rep-kpi__trend">{data.kpis.topTreatmentSub}</p>
          </div>
        </div>

      <div className="rep-grid">
          <section className="rep-card">
            <h2>Citas por estado</h2>
            <div className="rep-chart rep-chart--sm">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.byStatus}
                    dataKey="count"
                    nameKey="status"
                    innerRadius={52}
                    outerRadius={72}
                    paddingAngle={2}
                    isAnimationActive={false}
                  >
                    {data.byStatus.map((entry) => (
                      <Cell key={entry.status} fill={STATUS_CHART_COLORS[entry.status]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number, _n, p) => [
                      `${v} (${(p.payload as { pct: number }).pct}%)`,
                      statusLabel(String(p.payload.status))
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="rep-donut-center">
              <strong>{data.totalAppointments}</strong>
              <span>Total citas</span>
            </div>
            <div className="rep-legend">
              {data.byStatus.map((s) => (
                <div key={s.status} className="rep-legend__row">
                  <span>
                    <span className="rep-legend__dot" style={{ background: STATUS_CHART_COLORS[s.status] }} />
                    {statusLabel(s.status)}
                  </span>
                  <span>
                    {s.count} — {s.pct}%
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="rep-card rep-card--wide">
            <h2>Ingresos por periodo</h2>
            <div className="rep-seg">
              {(['day', 'week', 'month'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  className={incomeMode === m ? 'rep-seg--active' : undefined}
                  onClick={() => setIncomeMode(m)}
                >
                  {m === 'day' ? 'Día' : m === 'week' ? 'Semana' : 'Mes'}
                </button>
              ))}
            </div>
            <div className="rep-chart">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={incomeChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="repIncomeFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2d8b7d" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#2d8b7d" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fontWeight: 600 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${v} €`} />
                  <Tooltip
                    formatter={(v: number) => [money(Number(v)), 'Ingresos']}
                    labelFormatter={(_l, p) => String((p[0]?.payload as { tooltip?: string })?.tooltip ?? _l)}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#2d8b7d"
                    strokeWidth={2}
                    fill="url(#repIncomeFill)"
                    animationDuration={900}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rep-card rep-card--wide">
            <h2>Tratamientos más reservados</h2>
            {data.topTreatments.map((t, i) => (
              <div key={t.id} className="rep-treat-row">
                <div className="rep-treat-row__head">
                  <span>
                    {i + 1}. {t.name}
                  </span>
                  <span>
                    {t.count} — {t.pct}%
                  </span>
                </div>
                <div className="rep-treat-bar">
                  <span style={{ width: `${t.pct}%`, background: TREAT_COLORS[i % TREAT_COLORS.length] }} />
                </div>
              </div>
            ))}
          </section>

          <section className="rep-card">
            <h2>Ocupación de agenda</h2>
            <div className="rep-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.weekdayOcc}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fontWeight: 700 }} />
                  <YAxis tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                  <Tooltip formatter={(v: number) => [`${v}%`, 'Ocupación']} />
                  <Bar dataKey="pct" radius={[6, 6, 0, 0]} animationDuration={700}>
                    {data.weekdayOcc.map((entry) => (
                      <Cell
                        key={entry.label}
                        fill={entry.label === 'Jue' ? '#2d8b7d' : '#94a3b8'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rep-card rep-card--wide">
            <h2>Rendimiento por dentista</h2>
            <table className="rep-table">
              <thead>
                <tr>
                  <th>Profesional</th>
                  <th>Citas</th>
                  <th>Ingresos</th>
                  <th>Asistencia</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.dentistRows.slice(0, 3).map((d) => (
                  <tr key={d.id}>
                    <td>
                      <div className="rep-pro">
                        <span className="rep-avatar">
                          {d.name
                            .split(/\s+/)
                            .map((w) => w[0])
                            .join('')
                            .slice(0, 2)}
                        </span>
                        {d.name}
                      </div>
                    </td>
                    <td>{d.appointments}</td>
                    <td>{money(d.income)}</td>
                    <td>
                      <span className="rep-pill">{d.attendance}%</span>
                    </td>
                    <td style={{ width: 72 }}>
                      <Sparkline points={d.spark} tone="green" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button type="button" className="rep-link" onClick={() => setDentistsOpen(true)}>
              Ver todos los profesionales
            </button>
          </section>

          <section className="rep-card">
            <h2>Facturación</h2>
            <div className="rep-billing-stats">
              <div className="rep-billing-stat">
                <span>Emitidas</span>
                <strong>{data.billing.issued}</strong>
              </div>
              <div className="rep-billing-stat">
                <span>Pagadas</span>
                <strong>{data.billing.paid}</strong>
              </div>
              <div className="rep-billing-stat">
                <span>Pendientes</span>
                <strong>{data.billing.pending}</strong>
              </div>
              <div className="rep-billing-stat">
                <span>Vencidas</span>
                <strong>{data.billing.overdue}</strong>
              </div>
            </div>
            <div className="rep-chart rep-chart--sm">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.billing.donut}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={48}
                    outerRadius={68}
                    animationDuration={700}
                  >
                    {data.billing.donut.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="rep-donut-center">
              <span>Total facturado</span>
              <strong>{money(data.billing.total)}</strong>
            </div>
            <div className="rep-legend">
              {data.billing.donut.map((s) => {
                const total = data.billing.donut.reduce((a, b) => a + b.value, 0) || 1;
                return (
                  <div key={s.name} className="rep-legend__row">
                    <span>
                      <span className="rep-legend__dot" style={{ background: s.color }} />
                      {s.name}
                    </span>
                    <span>
                      {s.value} — {Math.round((s.value / total) * 100)}%
                    </span>
                  </div>
                );
              })}
            </div>
            <span className="rep-link rep-link--static">Resumen de facturación en este panel</span>
          </section>

          <section className="rep-card">
            <h2>Insights</h2>
            <ul className="rep-insights">
              {data.insights.map((ins, i) => (
                <li key={i}>
                  <Sparkles
                    className="h-4 w-4 shrink-0"
                    style={{
                      color:
                        ins.tone === 'orange'
                          ? '#c2410c'
                          : ins.tone === 'green'
                            ? '#059669'
                            : ins.tone === 'red'
                              ? '#dc2626'
                              : '#2d8b7d'
                    }}
                    aria-hidden
                  />
                  {ins.text}
                </li>
              ))}
            </ul>
            <button type="button" className="rep-link" onClick={() => setInsightsOpen(true)}>
              Ver todos los insights
            </button>
          </section>
        </div>

      {insightsOpen ? (
        <Modal open title="Insights" onClose={() => setInsightsOpen(false)}>
          <ul className="rep-modal-list">
            {data.insights.map((ins, i) => (
              <li key={i}>{ins.text}</li>
            ))}
          </ul>
        </Modal>
      ) : null}

      {dentistsOpen ? (
        <Modal open title="Rendimiento por profesional" onClose={() => setDentistsOpen(false)}>
          <table className="rep-table">
            <thead>
              <tr>
                <th>Profesional</th>
                <th>Citas</th>
                <th>Ingresos</th>
                <th>Asistencia</th>
              </tr>
            </thead>
            <tbody>
              {data.dentistRows.map((d) => (
                <tr key={d.id}>
                  <td>{d.name}</td>
                  <td>{d.appointments}</td>
                  <td>{money(d.income)}</td>
                  <td>{d.attendance}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Modal>
      ) : null}
    </div>
  );
}

import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock,
  Euro,
  FileText,
  FolderOpen,
  Shield,
  Users
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { isActiveStatus } from '@/lib/appointments';
import { money, statusLabel, todayIso } from '@/lib/format';
import { patientName, recentPatientActivity } from '@/lib/selectors';
import { patientsForTenant } from '@/lib/tenant';
import { useCountUp } from '@/hooks/useCountUp';
import { useDemoStore } from '@/hooks/useDemoStore';
import { useTenant } from '@/hooks/useTenant';
import type { AppointmentStatus } from '@/types/demo';

const WEEKLY_OCCUPANCY = [
  { key: 'lun', label: 'Lun 19', pct: 60 },
  { key: 'mar', label: 'Mar 20', pct: 75 },
  { key: 'mie', label: 'Mié 21', pct: 48 },
  { key: 'jue', label: 'Jue 22', pct: 82, highlight: true },
  { key: 'vie', label: 'Vie 23', pct: 62 },
  { key: 'sab', label: 'Sáb 24', pct: 25 },
  { key: 'dom', label: 'Dom 25', pct: 8 }
] as const;

function Sparkline({ points, tone = 'teal' }: { points: number[]; tone?: 'teal' | 'blue' | 'orange' | 'green' }) {
  const max = Math.max(...points, 1);
  const coords = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * 100;
      const y = 100 - (p / max) * 100;
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg className={`adm-spark adm-spark--${tone}`} viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden>
      <polyline className="adm-spark__line" points={coords} />
    </svg>
  );
}

function formatApptDay(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return d
    .toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
    .replace('.', '')
    .toUpperCase();
}

function formatActivityWhen(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const wasYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();
  const time = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  if (sameDay) return `Hoy, ${time}`;
  if (wasYesterday) return `Ayer, ${time}`;
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function initialsFrom(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function trendText(current: number, previous: number) {
  if (previous === 0 && current === 0) return '— 0% vs ayer';
  if (previous === 0) return `↑ 100% vs ayer`;
  const delta = Math.round(((current - previous) / previous) * 100);
  if (delta === 0) return '— 0% vs ayer';
  return `${delta > 0 ? '↑' : '↓'} ${Math.abs(delta)}% vs ayer`;
}

type KpiProps = {
  label: string;
  value: number | string;
  trend: string;
  icon: LucideIcon;
  tone: string;
  animate?: number;
  loading?: boolean;
  delay?: number;
};

function KpiCard({ label, value, trend, icon: Icon, tone, animate, loading, delay = 0 }: KpiProps) {
  const n = useCountUp(typeof animate === 'number' ? animate : 0, 900, typeof animate === 'number');
  const display = typeof animate === 'number' ? String(n) : String(value);
  return (
    <article
      className={`adm-kpi adm-kpi--${tone}${loading ? ' adm-kpi--loading' : ''}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className={`adm-kpi__icon adm-kpi__icon--${tone}`}>
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <p className="adm-kpi__label">{label}</p>
      <p className="adm-kpi__value">{display}</p>
      <p className="adm-kpi__trend">{trend}</p>
    </article>
  );
}

function WideKpi({
  label,
  value,
  trend,
  tone,
  icon: Icon,
  spark,
  wideTone,
  delay
}: {
  label: string;
  value: string;
  trend: string;
  tone: string;
  icon: LucideIcon;
  spark: number[];
  wideTone: 'teal' | 'blue' | 'orange' | 'alert';
  delay?: number;
}) {
  return (
    <article className={`adm-kpi-wide adm-kpi-wide--${wideTone}`} style={{ animationDelay: `${delay}ms` }}>
      <div className="adm-kpi-wide__head">
        <span className={`adm-kpi__icon adm-kpi__icon--${tone}`}>
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <p className="adm-kpi__label">{label}</p>
          <p className="adm-kpi-wide__value">{value}</p>
          <p className="adm-kpi__trend">{trend}</p>
        </div>
      </div>
      <Sparkline points={spark} tone={wideTone === 'alert' ? 'orange' : wideTone} />
      {wideTone === 'alert' ? <Shield className="adm-kpi-wide__watermark" aria-hidden /> : null}
    </article>
  );
}

function statusClass(status: AppointmentStatus) {
  if (status === 'confirmada' || status === 'completada') return 'adm-pill--ok';
  if (status === 'pendiente') return 'adm-pill--warn';
  return 'adm-pill--muted';
}

export function AdminDashboard() {
  const { state, dataSource } = useDemoStore();
  const scope = useTenant();
  const loading = dataSource === 'loading';
  const today = todayIso();
  const yesterday = useMemo(() => {
    const d = new Date(`${today}T12:00:00`);
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  }, [today]);

  const appts = scope.appointments;
  const citasHoy = appts.filter((a) => a.date === today).length;
  const citasHoyAyer = appts.filter((a) => a.date === yesterday).length;
  const pending = appts.filter((a) => a.status === 'pendiente').length;
  const pendingAyer = appts.filter((a) => a.date === yesterday && a.status === 'pendiente').length;
  const confirmed = appts.filter((a) => a.status === 'confirmada').length;
  const confirmedAyer = appts.filter((a) => a.date === yesterday && a.status === 'confirmada').length;
  const patientCount = patientsForTenant(state, scope.tenantId).length;

  const income = scope.payments.filter((p) => p.status === 'completado').reduce((s, p) => s + p.amount, 0);
  const pendingInvoices = scope.invoices.filter((i) => i.status === 'pendiente' || i.status === 'vencida').length;
  const completedPayments = scope.payments.filter((p) => p.status === 'completado').length;
  const alerts = scope.invoices.filter((i) => i.status === 'vencida').length;

  const occupancy = scope.dentists.length
    ? Math.min(100, Math.round((appts.filter((a) => a.date === today).length / (scope.dentists.length * 8)) * 100))
    : 0;

  const activity = recentPatientActivity(state, 6, scope.tenantId);

  const upcoming = useMemo(
    () =>
      [...appts]
        .filter((a) => a.date >= today && isActiveStatus(a.status))
        .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
        .slice(0, 5),
    [appts, today]
  );

  const [chartRange, setChartRange] = useState<'week' | 'month'>('week');
  const [chartOpen, setChartOpen] = useState(false);

  return (
    <div className={`adm-dash${loading ? ' adm-dash--loading' : ''}`}>
      <div className="adm-kpi-grid">
        <KpiCard
          label="Citas hoy"
          value={citasHoy}
          animate={citasHoy}
          trend={trendText(citasHoy, citasHoyAyer)}
          icon={Calendar}
          tone="teal"
          loading={loading}
          delay={0}
        />
        <KpiCard
          label="Citas pendientes"
          value={pending}
          animate={pending}
          trend={trendText(pending, pendingAyer)}
          icon={Clock}
          tone="amber"
          loading={loading}
          delay={60}
        />
        <KpiCard
          label="Citas confirmadas"
          value={confirmed}
          animate={confirmed}
          trend={trendText(confirmed, confirmedAyer)}
          icon={CheckCircle2}
          tone="green"
          loading={loading}
          delay={120}
        />
        <KpiCard
          label="Pacientes en clínica"
          value={patientCount}
          animate={patientCount}
          trend={trendText(patientCount, patientCount)}
          icon={Users}
          tone="blue"
          loading={loading}
          delay={180}
        />
        <KpiCard
          label="Informes emitidos"
          value={scope.reports.length}
          animate={scope.reports.length}
          trend="— 0% vs ayer"
          icon={ClipboardList}
          tone="purple"
          loading={loading}
          delay={240}
        />
        <KpiCard
          label="Documentos subidos"
          value={scope.documents.length}
          animate={scope.documents.length}
          trend="— 0% vs ayer"
          icon={FolderOpen}
          tone="blue"
          loading={loading}
          delay={300}
        />
        <KpiCard
          label="Facturas pendientes"
          value={pendingInvoices}
          animate={pendingInvoices}
          trend={trendText(pendingInvoices, pendingInvoices)}
          icon={FileText}
          tone="orange"
          loading={loading}
          delay={360}
        />
        <KpiCard
          label="Pagos completados"
          value={completedPayments}
          animate={completedPayments}
          trend="— 0% vs ayer"
          icon={Euro}
          tone="green"
          loading={loading}
          delay={420}
        />
      </div>

      <div className="adm-kpi-wide-grid">
        <WideKpi
          label="Ingresos"
          value={money(income)}
          trend="0% vs semana anterior"
          tone="teal"
          icon={Euro}
          spark={[12, 18, 14, 22, 20, 28, 24]}
          wideTone="teal"
          delay={480}
        />
        <WideKpi
          label="Ocupación agenda hoy"
          value={`${occupancy}%`}
          trend="0% vs ayer"
          tone="blue"
          icon={Calendar}
          spark={[40, 55, 48, 62, occupancy, 50, 45]}
          wideTone="blue"
          delay={540}
        />
        <WideKpi
          label="Alertas"
          value={String(alerts)}
          trend="Facturas vencidas"
          tone="orange"
          icon={AlertTriangle}
          spark={[2, 4, 3, 6, 5, alerts, 4]}
          wideTone="alert"
          delay={600}
        />
      </div>

      <div className="adm-panels">
        <section className="adm-panel adm-panel--reveal" style={{ animationDelay: '120ms' }}>
          <header className="adm-panel__head">
            <h2>Próximas citas</h2>
            <span className="adm-panel__action adm-panel__action--static">Próximas citas</span>
          </header>
          <ul className="adm-appt-list">
            {upcoming.length ? (
              upcoming.map((a) => {
                const treatment = scope.treatments.find((t) => t.id === a.treatmentId)?.name ?? 'Consulta';
                const dentist = scope.dentists.find((d) => d.id === a.dentistId)?.fullName ?? 'Profesional';
                const name = patientName(state, a.patientId);
                return (
                  <li key={a.id}>
                    <div className="adm-appt__date">
                      <span className="adm-appt__day">{formatApptDay(a.date)}</span>
                      <span className="adm-appt__time">{a.time}</span>
                    </div>
                    <span className="adm-appt__avatar">{initialsFrom(name)}</span>
                    <div className="adm-appt__body">
                      <strong>{name}</strong>
                      <span>
                        {treatment} · {dentist}
                      </span>
                    </div>
                    <span className={`adm-pill ${statusClass(a.status)}`}>{statusLabel(a.status)}</span>
                  </li>
                );
              })
            ) : (
              <li className="adm-panel__empty">No hay citas próximas en este periodo.</li>
            )}
          </ul>
        </section>

        <section className="adm-panel adm-panel--reveal" style={{ animationDelay: '200ms' }}>
          <header className="adm-panel__head">
            <h2>Actividad reciente</h2>
            <span className="adm-panel__action adm-panel__action--static">Actividad reciente</span>
          </header>
          <ul className="adm-activity-list">
            {activity.length ? (
              activity.map((item) => (
                <li key={`${item.kind}-${item.id}`}>
                  <div className="adm-activity__icon" aria-hidden>
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="adm-activity__body">
                    <strong>Factura {item.id.slice(0, 8)}…</strong>
                    <span>{item.patientName}</span>
                  </div>
                  <time dateTime={item.at}>{formatActivityWhen(item.at)}</time>
                </li>
              ))
            ) : (
              <li className="adm-panel__empty">Sin actividad reciente.</li>
            )}
          </ul>
        </section>

        <section className="adm-panel adm-panel--chart adm-panel--reveal" style={{ animationDelay: '280ms' }}>
          <header className="adm-panel__head">
            <h2>Ocupación semanal</h2>
            <div className={`adm-dash-dropdown adm-dash-dropdown--inline${chartOpen ? ' is-open' : ''}`}>
              <button
                type="button"
                className="adm-panel__action adm-panel__action--select"
                aria-expanded={chartOpen}
                onClick={() => setChartOpen((v) => !v)}
              >
                {chartRange === 'week' ? 'Esta semana' : 'Este mes'}
                <ChevronDown className="h-3.5 w-3.5" aria-hidden />
              </button>
              {chartOpen ? (
                <ul className="adm-dash-dropdown__menu adm-dash-dropdown__menu--right">
                  <li>
                    <button type="button" onClick={() => { setChartRange('week'); setChartOpen(false); }}>
                      Esta semana
                    </button>
                  </li>
                  <li>
                    <button type="button" onClick={() => { setChartRange('month'); setChartOpen(false); }}>
                      Este mes
                    </button>
                  </li>
                </ul>
              ) : null}
            </div>
          </header>
          <div className="adm-bars" role="img" aria-label="Gráfico de ocupación semanal en porcentaje">
            {WEEKLY_OCCUPANCY.map((bar) => (
              <div key={bar.key} className="adm-bars__col">
                <div className="adm-bars__track">
                  {'highlight' in bar && bar.highlight ? (
                    <span className="adm-bars__tip" role="tooltip">
                      {bar.pct}%
                    </span>
                  ) : null}
                  <span
                    className={`adm-bars__fill${'highlight' in bar && bar.highlight ? ' adm-bars__fill--hi' : ''}`}
                    style={{ height: `${bar.pct}%` }}
                  />
                </div>
                <span className="adm-bars__label">{bar.label}</span>
              </div>
            ))}
          </div>
          <p className="adm-bars__legend">Ocupación (%)</p>
        </section>
      </div>

      <div className="adm-summary-strip">
        <article className="adm-summary adm-summary--reveal">
          <p className="adm-summary__label">Ingresos del mes</p>
          <p className="adm-summary__value">{money(income)}</p>
          <p className="adm-summary__trend">0% vs mes anterior</p>
          <Sparkline points={[8, 12, 10, 16, 14, 20, 18]} tone="teal" />
        </article>
        <article className="adm-summary adm-summary--reveal" style={{ animationDelay: '80ms' }}>
          <p className="adm-summary__label">Facturas pendientes</p>
          <p className="adm-summary__value">{pendingInvoices}</p>
          <p className="adm-summary__trend">↑ 33% vs semana anterior</p>
          <Sparkline points={[6, 8, 7, 10, 9, 12, pendingInvoices]} tone="orange" />
        </article>
        <article className="adm-summary adm-summary--reveal" style={{ animationDelay: '160ms' }}>
          <p className="adm-summary__label">Pagos completados</p>
          <p className="adm-summary__value">{completedPayments}</p>
          <p className="adm-summary__trend">0% vs semana anterior</p>
          <Sparkline points={[4, 6, 5, 8, 7, 9, completedPayments]} tone="green" />
        </article>
        <article className="adm-summary adm-summary--alert adm-summary--reveal" style={{ animationDelay: '240ms' }}>
          <AlertTriangle className="adm-summary__alert-icon" aria-hidden />
          <div>
            <p className="adm-summary__label">Alertas</p>
            <p className="adm-summary__value">{alerts}</p>
            <p className="adm-summary__trend">Facturas vencidas</p>
          </div>
        </article>
      </div>
    </div>
  );
}

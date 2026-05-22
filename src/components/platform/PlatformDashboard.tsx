import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  CreditCard,
  Download,
  ExternalLink,
  Info,
  LifeBuoy,
  Plus,
  ShieldCheck,
  Users,
  X
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useCountUp } from '@/hooks/useCountUp';
import type { PlatformDashboardPayload } from '@/lib/platform/dashboardTypes';
import { PlatformShell } from './PlatformShell';

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, credentials: 'include', headers: { 'content-type': 'application/json', ...init?.headers } });
  const json = (await res.json()) as { data?: T; error?: { message?: string } };
  if (!res.ok) throw new Error(json.error?.message ?? 'Error de servidor');
  return json.data as T;
}

function Sparkline({ points, tone }: { points: number[]; tone: string }) {
  const max = Math.max(...points, 1);
  const coords = points
    .map((p, i) => {
      const x = (i / Math.max(points.length - 1, 1)) * 100;
      const y = 100 - (p / max) * 100;
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg className={`plt-spark plt-spark--${tone}`} viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden>
      <polyline className="plt-spark__line" points={coords} />
    </svg>
  );
}

function PltKpi({
  label,
  value,
  sub,
  icon: Icon,
  tone,
  spark,
  href,
  delay
}: {
  label: string;
  value: number | string;
  sub: string;
  icon: LucideIcon;
  tone: string;
  spark: number[];
  href: string;
  delay: number;
}) {
  const num = typeof value === 'number' ? value : 0;
  const animated = useCountUp(num, 900);
  const display = typeof value === 'number' ? (label.includes('MRR') ? `€${animated}` : String(animated)) : value;
  return (
    <a href={href} className="plt-kpi" style={{ animationDelay: `${delay}ms` }}>
      <span className={`plt-kpi__icon plt-kpi__icon--${tone}`}>
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div className="plt-kpi__body">
        <p className="plt-kpi__label">{label}</p>
        <p className="plt-kpi__value">{display}</p>
        <p className="plt-kpi__sub">{sub}</p>
      </div>
      <Sparkline points={spark} tone={tone} />
    </a>
  );
}

function DonutChart({ total, segments }: { total: number; segments: { pct: number; color: string }[] }) {
  let offset = 0;
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <svg className="plt-donut" viewBox="0 0 100 100" aria-hidden>
      <circle cx="50" cy="50" r={r} fill="none" stroke="#e2e8f0" strokeWidth="12" />
      {segments.map((s, i) => {
        const dash = (s.pct / 100) * c;
        const el = (
          <circle
            key={i}
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth="12"
            strokeDasharray={`${dash} ${c - dash}`}
            strokeDashoffset={-offset}
            transform="rotate(-90 50 50)"
            className="plt-donut__seg"
          />
        );
        offset += dash;
        return el;
      })}
      <text x="50" y="48" textAnchor="middle" className="plt-donut__num">
        {total}
      </text>
      <text x="50" y="62" textAnchor="middle" className="plt-donut__lbl">
        Total
      </text>
    </svg>
  );
}

type NewClinicForm = {
  clinicName: string;
  adminEmail: string;
  plan: 'essential' | 'professional' | 'enterprise';
  tenantSlug: string;
};

export function PlatformDashboard() {
  const [data, setData] = useState<PlatformDashboardPayload | null>(null);
  const [range, setRange] = useState('30');
  const [rangeOpen, setRangeOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exportOk, setExportOk] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<NewClinicForm>({
    clinicName: '',
    adminEmail: '',
    plan: 'professional',
    tenantSlug: ''
  });
  const [formErr, setFormErr] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const dash = await api<PlatformDashboardPayload>(`/api/platform/overview?range=${range}`);
      setData(dash);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar el resumen.');
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    void load();
  }, [load]);

  const o = data?.overview;
  const pendingEmpty = data?.pendingActions.every((p) => p.tone === 'ok');
  const activityEmpty = !data?.activity.length;
  const alertsEmpty = data ? data.alerts.warnings + data.alerts.critical + data.alerts.info === 0 : true;

  const rangeLabel = useMemo(() => {
    if (range === '7') return 'Últimos 7 días';
    if (range === '90') return 'Últimos 90 días';
    return 'Últimos 30 días';
  }, [range]);

  async function exportReport() {
    try {
      const res = await fetch(`/api/platform/export-report?range=${range}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Error al exportar');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `informe-plataforma-${range}d.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setExportOk(true);
      window.setTimeout(() => setExportOk(false), 2500);
    } catch {
      setError('No se pudo exportar el informe.');
    }
  }

  function validateForm() {
    const err: Record<string, string> = {};
    if (!form.clinicName.trim()) err.clinicName = 'El nombre de la clínica es obligatorio.';
    if (!form.adminEmail.trim()) err.adminEmail = 'Introduce un email válido.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.adminEmail)) err.adminEmail = 'Introduce un email válido.';
    if (!form.plan) err.plan = 'Selecciona un plan.';
    if (!form.tenantSlug.trim()) err.tenantSlug = 'El identificador del tenant es obligatorio.';
    else if (!/^[a-z0-9-]+$/.test(form.tenantSlug)) err.tenantSlug = 'Solo minúsculas, números y guiones.';
    setFormErr(err);
    return Object.keys(err).length === 0;
  }

  async function submitNewClinic() {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const result = await api<{ redirect?: string; demo?: boolean }>('/api/platform/clinic-quick-create', {
        method: 'POST',
        body: JSON.stringify({
          clinicName: form.clinicName.trim(),
          adminEmail: form.adminEmail.trim(),
          plan: form.plan,
          tenantSlug: form.tenantSlug.trim()
        })
      });
      setModalOpen(false);
      window.location.href = result.redirect ?? '/platform/registros';
    } catch (e) {
      setFormErr({ form: e instanceof Error ? e.message : 'No se pudo crear la clínica.' });
    } finally {
      setSaving(false);
    }
  }

  const headerActions = (
    <div className="plt-head-actions">
      <div className="plt-range">
        <button type="button" className="plt-btn plt-btn--ghost" aria-expanded={rangeOpen} onClick={() => setRangeOpen((v) => !v)}>
          {rangeLabel}
          <ChevronDown className="h-4 w-4" />
        </button>
        {rangeOpen ? (
          <ul className="plt-range__menu" role="menu">
            {[
              ['7', 'Últimos 7 días'],
              ['30', 'Últimos 30 días'],
              ['90', 'Últimos 90 días']
            ].map(([id, label]) => (
              <li key={id}>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setRange(id);
                    setRangeOpen(false);
                  }}
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <button type="button" className="plt-btn plt-btn--secondary" onClick={() => void exportReport()}>
        <Download className="h-4 w-4" aria-hidden />
        {exportOk ? 'Descargado' : 'Exportar reporte'}
      </button>
      <button type="button" className="plt-btn plt-btn--primary" onClick={() => setModalOpen(true)}>
        <Plus className="h-4 w-4" aria-hidden />
        Nueva clínica
      </button>
    </div>
  );

  return (
    <PlatformShell
      title="Resumen de plataforma"
      subtitle="Control global de clínicas, tenants, seguridad, soporte y actividad operativa."
      headerActions={headerActions}
    >
      <div className={`plt-dash${loading ? ' plt-dash--loading' : ''}`}>
        {error ? <p className="plt-alert plt-alert--error">{error}</p> : null}

        <section className="plt-security" aria-labelledby="plt-security-title">
          <div className="plt-security__main">
            <ShieldCheck className="h-7 w-7" aria-hidden />
            <div>
              <div className="plt-security__head">
                <h2 id="plt-security-title">Aislamiento multi-tenant activo</h2>
                <span className="plt-badge plt-badge--ok">Seguro</span>
              </div>
              <p>Cada clínica opera en su tenant independiente. No se comparten datos clínicos entre organizaciones.</p>
              <dl className="plt-security__metrics">
                <div>
                  <dt>Tenants aislados</dt>
                  <dd>
                    {o?.tenantsLinked ?? '—'} / {o?.tenantsTotal ?? '—'}
                  </dd>
                </div>
                <div>
                  <dt>Incidencias de aislamiento</dt>
                  <dd>{o?.isolationIncidents ?? 0}</dd>
                </div>
                <div>
                  <dt>Última revisión</dt>
                  <dd>{o?.lastIsolationReview ?? '—'}</dd>
                </div>
              </dl>
            </div>
          </div>
          <a href="/platform/aislamiento" className="plt-btn plt-btn--secondary">
            Ver auditoría de aislamiento
          </a>
        </section>

        <div className="plt-kpis">
          <PltKpi
            label="Clínicas totales"
            value={o?.clinicsTotal ?? 0}
            sub={`${o?.clinicsNewMonth ?? 0} nuevas este mes`}
            icon={Building2}
            tone="blue"
            spark={data?.sparklines.clinics ?? []}
            href="/platform/clinicas"
            delay={0}
          />
          <PltKpi
            label="Clínicas activas"
            value={o?.clinicsActive ?? 0}
            sub={`${o?.activePct ?? 0}% activas`}
            icon={CheckCircle2}
            tone="green"
            spark={data?.sparklines.active ?? []}
            href="/platform/clinicas"
            delay={40}
          />
          <PltKpi
            label="Usuarios staff"
            value={o?.staffUsers ?? 0}
            sub={`${o?.staffNewMonth ?? 0} nuevos este mes`}
            icon={Users}
            tone="purple"
            spark={data?.sparklines.staff ?? []}
            href="/platform/usuarios"
            delay={80}
          />
          <PltKpi
            label="Registros pendientes"
            value={o?.registrationsPending ?? 0}
            sub={`${o?.registrationsPending ?? 0} por revisar`}
            icon={ClipboardList}
            tone="orange"
            spark={data?.sparklines.pending ?? []}
            href="/platform/registros"
            delay={120}
          />
          <PltKpi
            label="Tickets abiertos"
            value={o?.supportOpen ?? 0}
            sub={`${o?.supportUrgent ?? 0} urgente${(o?.supportUrgent ?? 0) === 1 ? '' : 's'}`}
            icon={LifeBuoy}
            tone="blue"
            spark={data?.sparklines.tickets ?? []}
            href="/platform/soporte"
            delay={160}
          />
          <PltKpi
            label="MRR estimado"
            value={o?.mrr ?? 0}
            sub={`${o?.mrrTrendPct ?? 0}% vs mes anterior`}
            icon={CreditCard}
            tone="teal"
            spark={data?.sparklines.mrr ?? []}
            href="/platform/suscripciones"
            delay={200}
          />
        </div>

        <div className="plt-grid plt-grid--3">
          <section className="plt-card">
            <h3>Acciones pendientes</h3>
            {pendingEmpty ? (
              <div className="plt-empty">
                <p className="plt-empty__title">No hay acciones pendientes</p>
                <p>La plataforma está al día. No hay registros, tickets ni incidencias que requieran revisión.</p>
              </div>
            ) : (
              <ul className="plt-rows">
                {data?.pendingActions.map((row) => (
                  <li key={row.id} className={`plt-row plt-row--${row.tone}`}>
                    <div>
                      <strong>{row.title}</strong>
                      <p>{row.description}</p>
                    </div>
                    <a href={row.href} className={row.tone === 'ok' ? 'plt-btn plt-btn--ok' : 'plt-btn plt-btn--primary plt-btn--sm'}>
                      {row.buttonLabel}
                    </a>
                  </li>
                ))}
              </ul>
            )}
            <a href="/platform/registros" className="plt-card__link">
              Ver todas las acciones pendientes
            </a>
          </section>

          <section className="plt-card">
            <h3>Actividad reciente</h3>
            {activityEmpty ? (
              <div className="plt-empty">
                <p className="plt-empty__title">No hay actividad reciente</p>
                <p>Cuando se creen clínicas, usuarios o tickets, aparecerán aquí.</p>
              </div>
            ) : (
              <ul className="plt-activity">
                {data?.activity.map((a, i) => (
                  <li key={a.id} style={{ animationDelay: `${i * 40}ms` }}>
                    <a href={a.href}>
                      <span>
                        <strong>{a.title}</strong>
                        <span className={`plt-mod plt-mod--${a.module.toLowerCase()}`}>{a.module}</span>
                      </span>
                      <time>{a.at}</time>
                    </a>
                  </li>
                ))}
              </ul>
            )}
            <a href="/platform/historial" className="plt-card__link">
              Ver toda la actividad
            </a>
          </section>

          <section className="plt-card">
            <h3>Salud de plataforma</h3>
            <ul className="plt-health">
              {data?.health.map((h) => (
                <li key={h.id}>
                  <span>{h.label}</span>
                  <span className="plt-health__right">
                    {h.detail ? <em>{h.detail}</em> : null}
                    <span className="plt-badge plt-badge--ok">{h.status === 'operativa' ? 'Operativa' : 'Operativo'}</span>
                  </span>
                </li>
              ))}
            </ul>
            <footer className="plt-health__foot">
              <span>Estado general</span>
              <strong className="plt-health__ok">Todo operativo</strong>
            </footer>
          </section>
        </div>

        <div className="plt-grid plt-grid--3">
          <section className="plt-card plt-card--subs">
            <h3>Suscripciones y planes</h3>
            <div className="plt-subs-layout">
              <DonutChart
                total={data?.plans.reduce((s, p) => s + p.count, 0) ?? 0}
                segments={[
                  { pct: data?.plans[0]?.pct ?? 0, color: '#14b8a6' },
                  { pct: data?.plans[1]?.pct ?? 0, color: '#2563eb' },
                  { pct: data?.plans[2]?.pct ?? 0, color: '#f59e0b' },
                  { pct: data?.plans[3]?.pct ?? 0, color: '#94a3b8' }
                ]}
              />
              <ul className="plt-plans">
                {data?.plans.map((p) => (
                  <li key={p.id}>
                    <span>{p.label}</span>
                    <span>
                      {p.count} · {p.pct}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <dl className="plt-subs-stats">
              <div>
                <dt>Suscripciones activas</dt>
                <dd>
                  {data?.subscriptions.active ?? 0}{' '}
                  <span>{data?.subscriptions.canceled ?? 0} canceladas</span>
                </dd>
              </div>
              <div>
                <dt>Facturación (MRR)</dt>
                <dd>
                  €{o?.mrr ?? 0} · {o?.mrrTrendPct ?? 0}% vs mes anterior
                </dd>
              </div>
            </dl>
            <a href="/platform/suscripciones" className="plt-card__link">
              Ir a suscripciones
            </a>
          </section>

          <section className="plt-card">
            <h3>Alertas del sistema</h3>
            {alertsEmpty ? (
              <div className="plt-empty">
                <p className="plt-empty__title">Sin alertas del sistema</p>
                <p>Todos los servicios funcionan correctamente.</p>
              </div>
            ) : null}
            <div className="plt-alerts">
              <a href="/platform/seguridad" className="plt-alert-box plt-alert-box--warn">
                <span>Advertencias</span>
                <strong>{data?.alerts.warnings ?? 0}</strong>
                <em>Sin alertas</em>
              </a>
              <a href="/platform/incidencias" className="plt-alert-box plt-alert-box--crit">
                <span>Críticas</span>
                <strong>{data?.alerts.critical ?? 0}</strong>
                <em>Sin alertas</em>
              </a>
              <a href="/platform/configuracion" className="plt-alert-box plt-alert-box--info">
                <span>Informativas</span>
                <strong>{data?.alerts.info ?? 0}</strong>
                <em>Sin alertas</em>
              </a>
            </div>
          </section>

          <section className="plt-card">
            <h3>Acciones rápidas</h3>
            <div className="plt-quick">
              {[
                { href: '/platform/registros', title: 'Revisar registros', desc: 'Clínicas pendientes de aprobación.', badge: `${o?.registrationsPending ?? 0} pendientes` },
                { href: '/platform/clinicas', title: 'Gestionar clínicas', desc: 'Ver tenants, estado y configuración.', badge: `${o?.clinicsActive ?? 0} activa${(o?.clinicsActive ?? 0) === 1 ? '' : 's'}` },
                { href: '/platform/usuarios', title: 'Usuarios y accesos', desc: 'Administrar staff, roles y permisos.', badge: `${o?.staffUsers ?? 0} usuario${(o?.staffUsers ?? 0) === 1 ? '' : 's'}` },
                { href: '/platform/suscripciones', title: 'Suscripciones', desc: 'Planes, estado de cobro y límites.', badge: `${data?.subscriptions.active ?? 0} activa${(data?.subscriptions.active ?? 0) === 1 ? '' : 's'}` },
                { href: '/platform/soporte', title: 'Soporte', desc: 'Tickets, SLA y atención al cliente.', badge: `${o?.supportOpen ?? 0} abierto${(o?.supportOpen ?? 0) === 1 ? '' : 's'}` },
                { href: '/platform/seguridad', title: 'Seguridad', desc: 'Aislamiento, auditoría y accesos.', badge: 'Revisar' }
              ].map((q) => (
                <a key={q.href} href={q.href} className="plt-quick__item">
                  <strong>{q.title}</strong>
                  <p>{q.desc}</p>
                  <span className="plt-quick__badge">{q.badge}</span>
                </a>
              ))}
            </div>
          </section>
        </div>

        <p className="plt-tip">
          <Info className="h-4 w-4" aria-hidden />
          <span>
            <strong>Consejo</strong> Revisa periódicamente los registros pendientes, tickets abiertos y el estado de
            seguridad de la plataforma.
          </span>
        </p>
      </div>

      {modalOpen ? (
        <div className="plt-modal-backdrop" role="presentation" onClick={() => setModalOpen(false)}>
          <div className="plt-modal" role="dialog" aria-labelledby="plt-new-clinic" onClick={(e) => e.stopPropagation()}>
            <header>
              <h2 id="plt-new-clinic">Nueva clínica</h2>
              <button type="button" aria-label="Cerrar" onClick={() => setModalOpen(false)}>
                <X className="h-4 w-4" />
              </button>
            </header>
            {formErr.form ? <p className="plt-alert plt-alert--error">{formErr.form}</p> : null}
            <label>
              Nombre de la clínica *
              <input value={form.clinicName} onChange={(e) => setForm({ ...form, clinicName: e.target.value })} />
              {formErr.clinicName ? <span className="plt-field-err">{formErr.clinicName}</span> : null}
            </label>
            <label>
              Email administrador *
              <input type="email" value={form.adminEmail} onChange={(e) => setForm({ ...form, adminEmail: e.target.value })} />
              {formErr.adminEmail ? <span className="plt-field-err">{formErr.adminEmail}</span> : null}
            </label>
            <label>
              Plan *
              <select value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value as NewClinicForm['plan'] })}>
                <option value="essential">Plan Básico</option>
                <option value="professional">Plan Pro</option>
                <option value="enterprise">Plan Enterprise</option>
              </select>
              {formErr.plan ? <span className="plt-field-err">{formErr.plan}</span> : null}
            </label>
            <label>
              Identificador tenant (slug) *
              <input value={form.tenantSlug} onChange={(e) => setForm({ ...form, tenantSlug: e.target.value })} placeholder="clinica-ejemplo" />
              {formErr.tenantSlug ? <span className="plt-field-err">{formErr.tenantSlug}</span> : null}
            </label>
            <footer>
              <button type="button" className="plt-btn plt-btn--ghost" onClick={() => setModalOpen(false)}>
                Cancelar
              </button>
              <button type="button" className="plt-btn plt-btn--primary" disabled={saving} onClick={() => void submitNewClinic()}>
                {saving ? 'Creando…' : 'Crear clínica'}
              </button>
            </footer>
          </div>
        </div>
      ) : null}
    </PlatformShell>
  );
}

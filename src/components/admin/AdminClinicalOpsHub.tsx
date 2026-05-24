import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  Calendar,
  CalendarClock,
  FileStack,
  FileText,
  Layers3,
  Receipt,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { AdminAppointments, AdminClinicalReports } from './views';
import {
  buildClinicalOpsActivity,
  buildClinicalOpsKpis,
  parseClinicalOpsArea,
  type ClinicalOpsArea
} from '@/lib/admin/clinicalOpsData';
import { useCountUp } from '@/hooks/useCountUp';
import { useDemoStore } from '@/hooks/useDemoStore';
import { useTenant } from '@/hooks/useTenant';

const LazyDocuments = lazy(() => import('./AdminDocuments').then((m) => ({ default: m.AdminDocuments })));
const LazyInvoices = lazy(() => import('./AdminInvoices').then((m) => ({ default: m.AdminInvoices })));

const AREAS: {
  id: ClinicalOpsArea;
  label: string;
  short: string;
  icon: LucideIcon;
  tone: string;
  blurb: string;
}[] = [
  {
    id: 'citas',
    label: 'Gestión de citas',
    short: 'Citas',
    icon: Calendar,
    tone: 'teal',
    blurb: 'Agenda operativa, estados y vinculación con pacientes.'
  },
  {
    id: 'facturas',
    label: 'Facturación',
    short: 'Facturas',
    icon: Receipt,
    tone: 'coral',
    blurb: 'Emisión, cobros, vencimientos y PDFs al portal.'
  },
  {
    id: 'informes',
    label: 'Informes clínicos',
    short: 'Informes',
    icon: FileText,
    tone: 'blue',
    blurb: 'Redacción, firma profesional y publicación al paciente.'
  },
  {
    id: 'documentos',
    label: 'Documentación clínica',
    short: 'Documentos',
    icon: FileStack,
    tone: 'green',
    blurb: 'Radiografías, consentimientos y archivos compartidos.'
  }
];

function KpiTile({
  label,
  value,
  hint,
  delay
}: {
  label: string;
  value: number | string;
  hint?: string;
  delay: number;
}) {
  const n = typeof value === 'number' ? useCountUp(value, 720) : value;
  return (
    <article className="coh-kpi" style={{ animationDelay: `${delay}ms` }}>
      <p className="coh-kpi__label">{label}</p>
      <p className="coh-kpi__value">{n}</p>
      {hint ? <p className="coh-kpi__hint">{hint}</p> : null}
    </article>
  );
}

function ModulePanel({
  area,
  kpis
}: {
  area: (typeof AREAS)[number];
  kpis: ReturnType<typeof buildClinicalOpsKpis>;
}) {
  const stats =
    area.id === 'citas'
      ? [
          { label: 'Hoy activas', value: kpis.citasHoy },
          { label: 'Pendientes', value: kpis.citasPendientes }
        ]
      : area.id === 'facturas'
        ? [
            { label: 'Por cobrar', value: kpis.facturasPendientes },
            { label: 'Importe', value: kpis.facturasImporte }
          ]
        : area.id === 'informes'
          ? [
              { label: 'Este mes', value: kpis.informesMes },
              { label: 'En portal', value: kpis.informesPortal }
            ]
          : [
              { label: 'Últimos 30 d', value: kpis.documentosRecientes },
              { label: 'Visibles', value: kpis.documentosPaciente }
            ];

  const Icon = area.icon;
  return (
    <a href={`/admin/operaciones?area=${area.id}`} className={`coh-module coh-module--${area.tone}`}>
      <span className="coh-module__glow" aria-hidden />
      <div className="coh-module__head">
        <span className="coh-module__icon">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h3>{area.label}</h3>
          <p>{area.blurb}</p>
        </div>
      </div>
      <ul className="coh-module__stats">
        {stats.map((s) => (
          <li key={s.label}>
            <span>{s.label}</span>
            <strong>{s.value}</strong>
          </li>
        ))}
      </ul>
      <span className="coh-module__cta">
        Abrir módulo <ArrowRight className="h-4 w-4" aria-hidden />
      </span>
    </a>
  );
}

function AreaModule({ area }: { area: ClinicalOpsArea }) {
  switch (area) {
    case 'citas':
      return <AdminAppointments />;
    case 'informes':
      return <AdminClinicalReports />;
    case 'documentos':
      return (
        <Suspense fallback={<p className="coh-loading">Cargando documentos…</p>}>
          <LazyDocuments />
        </Suspense>
      );
    case 'facturas':
      return (
        <Suspense fallback={<p className="coh-loading">Cargando facturación…</p>}>
          <LazyInvoices />
        </Suspense>
      );
    default:
      return null;
  }
}

export function AdminClinicalOpsHub() {
  const { state } = useDemoStore();
  const scope = useTenant();
  const [area, setArea] = useState<ClinicalOpsArea | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    setArea(parseClinicalOpsArea(params.get('area')));
  }, []);

  const kpis = useMemo(() => buildClinicalOpsKpis(state, scope.tenantId), [state, scope.tenantId]);
  const activity = useMemo(
    () => buildClinicalOpsActivity(state, scope.tenantId),
    [state, scope.tenantId]
  );

  const activeMeta = AREAS.find((a) => a.id === area);

  if (area && activeMeta) {
    return (
      <div className="coh-page coh-page--module">
        <nav className="coh-tabs" aria-label="Módulos de operaciones clínicas">
          {AREAS.map((item) => {
            const Icon = item.icon;
            const active = item.id === area;
            return (
              <a
                key={item.id}
                href={`/admin/operaciones?area=${item.id}`}
                className={`coh-tab${active ? ' coh-tab--active' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {item.short}
              </a>
            );
          })}
          <a href="/admin/operaciones" className="coh-tab coh-tab--hub">
            <Layers3 className="h-4 w-4" aria-hidden />
            Centro
          </a>
        </nav>
        <header className="coh-module-head">
          <div>
            <p className="coh-module-head__eyebrow">Operaciones clínicas</p>
            <h2>{activeMeta.label}</h2>
            <p>{activeMeta.blurb}</p>
          </div>
        </header>
        <div className="coh-module-frame">
          <AreaModule area={area} />
        </div>
      </div>
    );
  }

  return (
    <div className="coh-page">
      <header className="coh-hero">
        <div className="coh-hero__mesh" aria-hidden />
        <div className="coh-hero__content">
          <p className="coh-hero__eyebrow">
            <Sparkles className="inline h-4 w-4 mr-1" aria-hidden />
            Centro clínico unificado
          </p>
          <h2>Citas, facturación, informes y documentación</h2>
          <p>
            Un solo espacio para la operativa diaria de tu clínica. Misma estética del panel admin, flujos
            conectados y acceso directo a cada módulo.
          </p>
          <div className="coh-hero__actions">
            <a href="/admin/operaciones?area=citas" className="coh-btn coh-btn--primary">
              <CalendarClock className="h-4 w-4" aria-hidden />
              Ver citas de hoy
            </a>
            <a href="/admin/agenda" className="coh-btn coh-btn--ghost">
              Abrir agenda
            </a>
          </div>
        </div>
        <ul className="coh-hero__mosaic" aria-label="Indicadores rápidos">
          <li>
            <span>Citas hoy</span>
            <strong>{kpis.citasHoy}</strong>
          </li>
          <li>
            <span>Facturas pendientes</span>
            <strong>{kpis.facturasPendientes}</strong>
          </li>
          <li>
            <span>Informes del mes</span>
            <strong>{kpis.informesMes}</strong>
          </li>
          <li>
            <span>Docs recientes</span>
            <strong>{kpis.documentosRecientes}</strong>
          </li>
        </ul>
      </header>

      <section className="coh-kpis" aria-label="Resumen operativo">
        <KpiTile label="Citas pendientes" value={kpis.citasPendientes} delay={0} />
        <KpiTile label="Importe por cobrar" value={kpis.facturasImporte} delay={60} />
        <KpiTile label="Informes en portal" value={kpis.informesPortal} delay={120} />
        <KpiTile label="Documentos visibles" value={kpis.documentosPaciente} delay={180} />
      </section>

      <section className="coh-grid">
        {AREAS.map((item) => (
          <ModulePanel key={item.id} area={item} kpis={kpis} />
        ))}
      </section>

      <section className="coh-activity">
        <div className="coh-activity__head">
          <h3>
            <TrendingUp className="inline h-5 w-5 mr-1 text-teal-700" aria-hidden />
            Actividad reciente
          </h3>
          <p>Citas, facturas, informes y documentos en una línea de tiempo.</p>
        </div>
        <ol className="coh-activity__list">
          {activity.length ? (
            activity.map((item, i) => {
              const meta = AREAS.find((a) => a.id === item.area);
              const Icon = meta?.icon ?? FileText;
              return (
                <li key={item.id} style={{ animationDelay: `${i * 45}ms` }}>
                  <a href={item.href} className="coh-activity__row">
                    <span className={`coh-activity__icon coh-activity__icon--${item.area}`}>
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="coh-activity__body">
                      <strong>{item.title}</strong>
                      <span>{item.meta}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 coh-activity__arrow" aria-hidden />
                  </a>
                </li>
              );
            })
          ) : (
            <li className="coh-activity__empty">Sin actividad reciente en esta clínica.</li>
          )}
        </ol>
      </section>
    </div>
  );
}

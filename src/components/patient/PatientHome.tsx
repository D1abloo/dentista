import { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Calendar,
  CalendarPlus,
  CheckCircle2,
  CreditCard,
  FileStack,
  Lock,
  MessageSquare,
  Shield,
  Sparkles
} from 'lucide-react';
import { useCountUp } from '@/hooks/useCountUp';
import { useDemoStore } from '@/hooks/useDemoStore';
import { usePatient } from '@/hooks/usePatient';
import {
  buildPatientHomeKpis,
  buildPatientHomeSummary,
  buildPatientHomeUpdates,
  formatPatientNhc,
  getNextPatientAppointment
} from '@/lib/patient/homeData';
import { PatientConsentAlert } from './consents';

function KpiCard({
  label,
  value,
  tone,
  delay,
  numeric
}: {
  label: string;
  value: string | number;
  tone: 'teal' | 'orange' | 'blue' | 'purple';
  delay: number;
  numeric?: boolean;
}) {
  const n = numeric && typeof value === 'number' ? useCountUp(value, 700) : value;
  return (
    <article className={`ph-kpi ph-kpi--${tone}`} style={{ animationDelay: `${delay}ms` }}>
      <p className="ph-kpi__label">{label}</p>
      <p className="ph-kpi__value">{n}</p>
    </article>
  );
}

const ACTION_CARDS = [
  {
    title: 'Reservar cita',
    desc: 'Consulta disponibilidad y elige horario.',
    icon: CalendarPlus
  },
  {
    title: 'Mis documentos',
    desc: 'Descarga consentimientos, informes o justificantes.',
    icon: FileStack
  },
  {
    title: 'Facturas y pagos',
    desc: 'Consulta facturas pendientes y pagos realizados.',
    icon: CreditCard
  },
  {
    title: 'Enviar mensaje',
    desc: 'Contacta con tu clínica de forma segura.',
    icon: MessageSquare
  }
] as const;

const BEFORE_CHECKLIST = [
  'Llega 10 minutos antes.',
  'Trae tu documentación si es tu primera visita.',
  'Revisa tus alergias y datos personales en Perfil.',
  'Consulta tus documentos pendientes.'
];

export function PatientDashboard() {
  const { state } = useDemoStore();
  const patient = usePatient();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 120);
    return () => window.clearTimeout(t);
  }, []);

  const patientId = patient.id;
  const initials = patient.fullName
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  const nextAppt = useMemo(() => getNextPatientAppointment(state, patientId), [state, patientId]);
  const kpis = useMemo(() => buildPatientHomeKpis(state, patientId), [state, patientId]);
  const summary = useMemo(() => buildPatientHomeSummary(state, patientId), [state, patientId]);
  const updates = useMemo(() => buildPatientHomeUpdates(state, patientId), [state, patientId]);

  const notifyCount = kpis.unreadMessages;

  if (!ready) {
    return (
      <div className="ph-home" aria-busy="true">
        <div className="ph-skeleton" style={{ minHeight: '8rem' }} />
        <div className="ph-skeleton" style={{ minHeight: '10rem' }} />
        <div className="ph-skeleton" style={{ minHeight: '6rem' }} />
      </div>
    );
  }

  return (
    <div className="ph-home">
      {notifyCount > 0 ? (
        <div className="ph-toolbar">
          <span className="ph-notify ph-notify--static" aria-label={`${notifyCount} mensajes sin leer`}>
            <Bell className="h-4 w-4" aria-hidden />
            <span className="ph-notify__badge">{notifyCount}</span>
          </span>
        </div>
      ) : null}

      <PatientConsentAlert />

      <div className="ph-hero-grid">
        <section className="ph-welcome">
          <div className="ph-welcome__inner">
            <div className="ph-welcome__avatar" aria-hidden>
              {initials || '👋'}
            </div>
            <div>
              <h2>Hola, {patient.fullName}</h2>
              <p>
                Desde aquí puedes reservar citas, consultar informes, descargar documentos, revisar facturas y comunicarte con tu
                clínica.
              </p>
              <p className="text-sm text-slate-600 m-0 mt-2">
                Usa el menú lateral del portal para reservar citas, documentos, facturas y mensajes.
              </p>
            </div>
          </div>
        </section>

        <aside className="ph-security-card">
          <span className="ph-security-card__badge">
            <Shield className="h-3.5 w-3.5" aria-hidden />
            Portal seguro
          </span>
          <h3>Portal seguro</h3>
          <p>Tus datos están protegidos. Solo tú y tu clínica podéis acceder a tu información.</p>
          <p className="ph-security-card__ok">
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            Autenticación activa
            {formatPatientNhc(patient.nhc) ? ` · ${formatPatientNhc(patient.nhc)}` : null}
          </p>
        </aside>
      </div>

      <div className="ph-mid-grid">
        <section className="ph-card" style={{ animationDelay: '120ms' }}>
          {nextAppt ? (
            <>
              <h3>Próxima cita</h3>
              <dl className="ph-appt-meta">
                <div>
                  <dt>Tratamiento</dt>
                  <dd>{nextAppt.display.treatment}</dd>
                </div>
                <div>
                  <dt>Fecha</dt>
                  <dd>{nextAppt.display.date}</dd>
                </div>
                <div>
                  <dt>Hora</dt>
                  <dd>{nextAppt.display.time}</dd>
                </div>
                <div>
                  <dt>Clínica</dt>
                  <dd>{nextAppt.display.clinic}</dd>
                </div>
                <div>
                  <dt>Profesional</dt>
                  <dd>{nextAppt.display.dentist}</dd>
                </div>
              </dl>
            </>
          ) : (
            <div className="ph-appt-empty">
              <div className="ph-appt-empty__icon" aria-hidden>
                <Calendar className="h-7 w-7" />
              </div>
              <h4>No tienes citas próximas</h4>
              <p>Reserva tu próxima visita en menos de un minuto.</p>
              <p className="text-sm text-slate-500 m-0 mt-2 text-center">
                Reserva desde «Reservar cita» en el menú lateral.
              </p>
            </div>
          )}
        </section>

        <div className="ph-kpis">
          <KpiCard label="Citas activas" value={kpis.activeAppointments} tone="teal" delay={160} numeric />
          <KpiCard label="Facturas pendientes" value={kpis.pendingInvoicesLabel} tone="orange" delay={220} />
          <KpiCard label="Documentos nuevos" value={kpis.newDocuments} tone="blue" delay={280} numeric />
          <KpiCard label="Mensajes sin leer" value={kpis.unreadMessages} tone="purple" delay={340} numeric />
        </div>
      </div>

      <section className="ph-card" style={{ animationDelay: '200ms' }}>
        <div className="ph-section-head">
          <h3>Novedades recientes</h3>
        </div>
        {updates.length ? (
          <ul className="ph-update-list">
            {updates.map((u, i) => (
              <li key={u.id} style={{ animationDelay: `${i * 55}ms` }}>
                <div className="ph-update-link ph-update-link--static">
                  <strong>{u.title}</strong>
                  {u.subtitle ? <span>{u.subtitle}</span> : null}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="ph-updates-empty">
            <div className="ph-updates-empty__icon" aria-hidden>
              <Bell className="h-5 w-5" />
            </div>
            <h4 className="m-0 text-sm font-extrabold text-[var(--corp-navy)]">No tienes novedades recientes</h4>
            <p className="text-xs text-slate-500 mt-1 mb-3">
              Cuando tu clínica publique documentos, informes, facturas o mensajes, aparecerán aquí.
            </p>
          </div>
        )}
      </section>

      <section>
        <h3 className="text-sm font-extrabold text-[var(--corp-navy)] mb-2 m-0">Qué puedes hacer ahora</h3>
        <div className="ph-actions-grid">
          {ACTION_CARDS.map((card, i) => (
            <article key={card.title} className="ph-action-card" style={{ animationDelay: `${240 + i * 60}ms` }}>
              <span className="ph-action-card__icon" aria-hidden>
                <card.icon className="h-4 w-4" />
              </span>
              <h4>{card.title}</h4>
              <p>{card.desc}</p>
              <span className="ph-action-card__hint">Disponible en el menú lateral</span>
            </article>
          ))}
        </div>
      </section>

      <div className="ph-bottom-grid">
        <section className="ph-card" style={{ animationDelay: '320ms' }}>
          <h3>Resumen de tu actividad</h3>
          <ul className="ph-summary-list">
            <li>
              <span>Último informe</span>
              <span>{summary.lastReport}</span>
            </li>
            <li>
              <span>Documentos nuevos</span>
              <span>{summary.newDocuments}</span>
            </li>
            <li>
              <span>Último pago</span>
              <span>{summary.lastPayment}</span>
            </li>
            <li>
              <span>Facturas pendientes</span>
              <span>{summary.pendingInvoices}</span>
            </li>
          </ul>
        </section>

        <section className="ph-card" style={{ animationDelay: '380ms' }}>
          <h3>Antes de tu cita</h3>
          {nextAppt ? (
            <ul className="ph-checklist">
              {BEFORE_CHECKLIST.map((line) => (
                <li key={line}>
                  <CheckCircle2 className="h-3.5 w-3.5 text-teal-600 shrink-0 mt-0.5" aria-hidden />
                  {line}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500 m-0">
              Cuando reserves una cita, verás aquí las recomendaciones previas.
            </p>
          )}
        </section>

        <section className="ph-card" style={{ animationDelay: '440ms' }}>
          <h3>Tus datos están protegidos</h3>
          <p className="text-sm text-slate-600 m-0">
            Solo tú y tu clínica podéis acceder a tus citas, informes, documentos y facturas.
          </p>
          <div className="ph-privacy-badges">
            <span className="ph-privacy-badge">
              <Lock className="h-3 w-3" aria-hidden />
              Portal seguro
            </span>
            <span className="ph-privacy-badge">
              <Shield className="h-3 w-3" aria-hidden />
              Datos privados
            </span>
            <span className="ph-privacy-badge">
              <Sparkles className="h-3 w-3" aria-hidden />
              Acceso personal
            </span>
          </div>
          <p className="text-sm text-slate-500 m-0 mt-3">Revisa tus datos en «Mi perfil» del menú lateral.</p>
        </section>
      </div>

      <footer className="ph-footer-bar">
        <span>
          <Lock className="inline h-3.5 w-3.5 mr-1 text-teal-700" aria-hidden />
          AgendaClinic protege tu información y tu privacidad. Si necesitas ayuda, contacta con tu clínica.
        </span>
      </footer>
    </div>
  );
}

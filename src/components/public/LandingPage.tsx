import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Building2,
  CalendarPlus,
  CreditCard,
  FileText,
  Shield,
  ShieldCheck
} from 'lucide-react';
import { clinicShowcases, patientShowcases } from '@/data/landingShowcases';
import { PublicFooter } from './PublicFooter';
import { PublicHeader } from './PublicHeader';
import { CookieBanner } from './CookieBanner';
import { LandingShowcase } from './LandingShowcase';

const features = [
  {
    icon: CalendarPlus,
    tone: 'teal',
    title: 'Citas online',
    text: 'Reserva en minutos con confirmación al instante.'
  },
  {
    icon: FileText,
    tone: 'blue',
    title: 'Informes y documentos',
    text: 'Historial clínico accesible desde tu móvil.'
  },
  {
    icon: CreditCard,
    tone: 'purple',
    title: 'Facturas y pagos',
    text: 'Consulta y paga sin llamar a recepción.'
  },
  {
    icon: Shield,
    tone: 'green',
    title: 'Privacidad',
    text: 'Datos aislados por clínica y sesión protegida.'
  }
] as const;

const steps = [
  { n: 1, title: 'Reserva', text: 'Elige clínica, tratamiento y horario.' },
  { n: 2, title: 'Asiste', text: 'La clínica gestiona tu agenda en tiempo real.' },
  { n: 3, title: 'Gestiona', text: 'Informes y facturas en el portal.' }
] as const;

export function LandingPage() {
  const [loggedOut, setLoggedOut] = useState(false);

  useEffect(() => {
    setLoggedOut(new URLSearchParams(window.location.search).get('logged_out') === '1');
  }, []);

  return (
    <>
      <PublicHeader />
      <main className="lp">
        {loggedOut ? (
          <div className="shell lp-alert">
            <p>
              Sesión cerrada. Usa <strong>Iniciar sesión</strong> con tu email para volver a tu portal.
            </p>
          </div>
        ) : null}

        <section className="lp-hero lp-hero--simple shell" aria-labelledby="lp-hero-title">
          <div className="lp-hero__grid">
            <div className="lp-hero__copy">
              <span className="lp-badge">Plataforma dental</span>
              <h1 id="lp-hero-title">
                Tus citas dentales en <span className="lp-gradient-text">minutos</span>
              </h1>
              <p className="lp-hero__lead">
                Reserva, consulta informes y paga facturas desde un portal seguro para pacientes y clínicas.
              </p>
              <div className="lp-hero__ctas">
                <a href="/reserva" className="btn btn--teal btn--lg lp-hero__cta-primary">
                  <CalendarPlus className="h-5 w-5" aria-hidden />
                  Reservar cita
                </a>
                <a href="/login/paciente" className="btn btn--outline-teal btn--lg lp-hero__cta-secondary">
                  Entrar como paciente
                </a>
              </div>
              <p className="lp-trust">
                <ShieldCheck className="h-4 w-4" aria-hidden />
                Seguro y pensado para ti
              </p>
            </div>
            <div className="lp-hero__visual">
              <div className="lp-hero__photo">
                <img
                  src="/images/login-dentista-paciente.jpg"
                  alt="Paciente en clínica dental"
                  width={640}
                  height={480}
                  loading="eager"
                />
              </div>
            </div>
          </div>
        </section>

        <section id="acceso" className="lp-section shell">
          <header className="lp-section__head">
            <h2>Accede a tu portal</h2>
          </header>
          <div className="lp-portals">
            <article className="lp-portal-card">
              <div className="lp-portal-card__body">
                <h3>Soy paciente</h3>
                <p>Citas, informes, documentos y facturas en cualquier dispositivo.</p>
                <a href="/login/paciente" className="btn btn--teal">
                  Entrar como paciente
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </a>
              </div>
            </article>
            <article className="lp-portal-card">
              <div className="lp-portal-card__body">
                <h3>Soy clínica</h3>
                <p>Agenda, pacientes y facturación en un panel multi-centro.</p>
                <a href="/login/admin" className="btn btn--outline-teal">
                  Acceso clínica
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </a>
              </div>
            </article>
          </div>
        </section>

        <section id="caracteristicas" className="lp-section lp-section--alt shell">
          <header className="lp-section__head">
            <h2>Todo en un solo lugar</h2>
            <p>
              Reserva online, gestión clínica con agenda multi-profesional, informes PDF, facturación FAC-XXXX y
              portal del paciente sincronizado en tiempo real.
            </p>
          </header>
          <div className="lp-features">
            {features.map((f) => (
              <article key={f.title} className="lp-feature">
                <span className={`lp-feature__icon lp-feature__icon--${f.tone}`}>
                  <f.icon className="h-6 w-6" aria-hidden />
                </span>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </article>
            ))}
          </div>
        </section>

        <LandingShowcase
          id="portal-paciente"
          title="Portal del paciente"
          lead="Capturas reales del móvil: citas, informes, documentos, facturas y pagos con identificadores CIT-, FAC- y PAG-."
          items={patientShowcases}
        />

        <LandingShowcase
          id="panel-clinica"
          title="Panel de clínica"
          lead="Agenda, pacientes con NHC, facturación, dashboard y acceso supervisado al portal del paciente."
          items={clinicShowcases}
        />

        <section className="lp-section shell">
          <header className="lp-section__head">
            <h2>Cómo funciona</h2>
          </header>
          <div className="lp-steps">
            {steps.map((s) => (
              <article key={s.n} className="lp-step">
                <span className="lp-step__num">{s.n}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="precios" className="lp-section lp-section--alt shell">
          <header className="lp-section__head">
            <h2>Planes para tu clínica</h2>
          </header>
          <div className="lp-pricing">
            <article className="lp-price-card">
              <h3>Esencial</h3>
              <p className="lp-price-card__amount">Desde 0 €</p>
              <ul>
                <li>Agenda y reservas</li>
                <li>Portal paciente</li>
              </ul>
              <a href="/reserva" className="btn btn--outline-teal btn--block">
                Probar ahora
              </a>
            </article>
            <article className="lp-price-card lp-price-card--featured">
              <span className="lp-price-card__tag">Recomendado</span>
              <h3>Profesional</h3>
              <p className="lp-price-card__amount">
                49 €<small>/mes</small>
              </p>
              <ul>
                <li>Multi-centro</li>
                <li>Facturación e informes</li>
              </ul>
              <a href="/contacto" className="btn btn--teal btn--block">
                Solicitar info
              </a>
            </article>
            <article className="lp-price-card">
              <h3>Enterprise</h3>
              <p className="lp-price-card__amount">A medida</p>
              <ul>
                <li>API e integraciones</li>
                <li>SLA dedicado</li>
              </ul>
              <a href="/contacto" className="btn btn--outline-teal btn--block">
                Contactar
              </a>
            </article>
          </div>
          <p className="lp-section__foot">
            <a href="/registro-clinica" className="btn btn--ghost">
              <Building2 className="h-4 w-4" aria-hidden />
              Registrar mi clínica
            </a>
          </p>
        </section>

        <section className="lp-section shell">
          <div className="lp-cta-banner">
            <div>
              <h2>¿Listo para tu próxima cita?</h2>
              <p>Reserva en menos de dos minutos.</p>
            </div>
            <a href="/reserva" className="btn btn--white btn--lg">
              Reservar cita
              <ArrowRight className="h-5 w-5" aria-hidden />
            </a>
          </div>
        </section>
      </main>
      <PublicFooter />
      <CookieBanner />
    </>
  );
}

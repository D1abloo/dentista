import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Building2,
  Calendar,
  CalendarPlus,
  ChevronRight,
  CreditCard,
  FileText,
  LogIn,
  Play,
  Receipt,
  Shield,
  ShieldCheck,
  Smartphone,
  Users
} from 'lucide-react';
import { PublicFooter } from './PublicFooter';
import { PublicHeader } from './PublicHeader';
import { CookieBanner } from './CookieBanner';

const features = [
  {
    icon: Calendar,
    tone: 'teal',
    title: 'Citas online',
    text: 'Reserva en minutos, elige día y hora libres y recibe confirmación al instante.'
  },
  {
    icon: FileText,
    tone: 'blue',
    title: 'Documentos e informes',
    text: 'Radiografías, informes clínicos y consentimientos siempre accesibles y seguros.'
  },
  {
    icon: CreditCard,
    tone: 'purple',
    title: 'Facturas y pagos',
    text: 'Consulta facturas, estados de pago y recibos desde tu portal o el de la clínica.'
  },
  {
    icon: Shield,
    tone: 'green',
    title: 'Seguro y privado',
    text: 'Datos aislados por clínica, sesiones protegidas y cumplimiento normativo.'
  }
] as const;

const steps = [
  {
    n: 1,
    icon: CalendarPlus,
    title: 'Reserva tu cita',
    text: 'Elige clínica, tratamiento y horario disponible en un flujo guiado.'
  },
  {
    n: 2,
    icon: FileText,
    title: 'Asiste y recibe atención',
    text: 'Tu clínica gestiona la agenda y el historial clínico en tiempo real.'
  },
  {
    n: 3,
    icon: CreditCard,
    title: 'Gestiona todo online',
    text: 'Informes, facturas y pagos centralizados en un solo portal.'
  }
] as const;

const demoStats = [
  { icon: Building2, value: '3', label: 'Clínicas activas' },
  { icon: Users, value: '245', label: 'Pacientes registrados' },
  { icon: ShieldCheck, value: '100%', label: 'Datos seguros' }
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
              Sesión cerrada. Elige <strong>Portal paciente</strong> o <strong>Panel admin</strong> en el menú para
              volver a entrar.
            </p>
          </div>
        ) : null}

        <section className="lp-hero shell" aria-labelledby="lp-hero-title">
          <div className="lp-hero__grid">
            <div className="lp-hero__copy">
              <span className="lp-badge">Plataforma dental todo en uno</span>
              <h1 id="lp-hero-title">
                Reserva y gestiona tus citas dentales en <span className="lp-gradient-text">minutos</span>
              </h1>
              <p className="lp-hero__lead">
                Conecta pacientes y clínicas en una plataforma segura y moderna. Citas, documentos, facturas y pagos,
                todo en un solo lugar.
              </p>
              <div className="lp-hero__ctas">
                <a href="/reserva" className="btn btn--primary btn--lg">
                  <CalendarPlus className="h-5 w-5" aria-hidden />
                  Reservar cita
                </a>
                <a href="/login" className="btn btn--outline btn--lg">
                  <LogIn className="h-5 w-5" aria-hidden />
                  Iniciar sesión
                </a>
              </div>
              <p className="lp-trust">
                <ShieldCheck className="h-4 w-4" aria-hidden />
                Seguro, privado y pensado para ti
              </p>
            </div>

            <div className="lp-hero__visual">
              <div className="lp-hero__photo">
                <img
                  src="/images/login-dentista-paciente.jpg"
                  alt="Paciente sonriente en clínica dental"
                  width={640}
                  height={480}
                  loading="eager"
                />
              </div>

              <article className="lp-float lp-float--appt">
                <div className="lp-float__head">
                  <span className="lp-float__icon lp-float__icon--blue">
                    <Calendar className="h-4 w-4" aria-hidden />
                  </span>
                  <div>
                    <p className="lp-float__label">Próxima cita</p>
                    <p className="lp-float__meta">Lunes, 27 de mayo · 10:30</p>
                    <p className="lp-float__sub">Clínica Dental Centro</p>
                  </div>
                </div>
                <a href="/paciente/citas" className="lp-float__btn">
                  Ver detalles
                </a>
              </article>

              <article className="lp-float lp-float--report">
                <div className="lp-float__head">
                  <span className="lp-float__icon lp-float__icon--teal">
                    <FileText className="h-4 w-4" aria-hidden />
                  </span>
                  <div>
                    <p className="lp-float__label">Informe disponible</p>
                    <p className="lp-float__meta">Radiografía panorámica</p>
                  </div>
                </div>
                <a href="/login/paciente" className="lp-float__btn lp-float__btn--ghost">
                  Ver informe
                </a>
              </article>

              <article className="lp-float lp-float--invoice">
                <div className="lp-float__head">
                  <span className="lp-float__icon lp-float__icon--purple">
                    <Receipt className="h-4 w-4" aria-hidden />
                  </span>
                  <div>
                    <p className="lp-float__label">Última factura</p>
                    <p className="lp-float__price">85,00 €</p>
                  </div>
                </div>
                <span className="lp-badge-pay">Pagada</span>
                <a href="/login/paciente" className="lp-float__btn lp-float__btn--ghost">
                  Ver factura
                </a>
              </article>
            </div>
          </div>
        </section>

        <section id="acceso" className="lp-section shell">
          <header className="lp-section__head">
            <h2>¿Cómo quieres acceder?</h2>
            <p>Elige el portal que mejor se adapte a ti</p>
          </header>
          <div className="lp-portals">
            <article className="lp-portal-card">
              <div className="lp-portal-card__body">
                <h3>Soy paciente</h3>
                <p>
                  Reserva citas, consulta informes, ve tus facturas y realiza pagos de forma segura desde cualquier
                  dispositivo.
                </p>
                <a href="/login/paciente" className="btn btn--teal">
                  Entrar como paciente
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </a>
              </div>
              <div className="lp-portal-card__media lp-portal-card__media--patient">
                <img src="/images/login-dentista-paciente.jpg" alt="" loading="lazy" />
                <span className="lp-portal-card__phone" aria-hidden>
                  <Smartphone className="h-8 w-8" />
                </span>
              </div>
            </article>

            <article className="lp-portal-card">
              <div className="lp-portal-card__body">
                <h3>Soy clínica</h3>
                <p>
                  Gestiona tu agenda, pacientes, documentos, facturación e informes desde un panel profesional
                  multi-centro.
                </p>
                <a href="/login/admin" className="btn btn--primary">
                  Acceso clínica
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </a>
              </div>
              <div className="lp-portal-card__media lp-portal-card__media--clinic" aria-hidden>
                <div className="lp-dash">
                  <div className="lp-dash__bar" />
                  <div className="lp-dash__grid">
                    <span className="lp-dash__tile lp-dash__tile--a" />
                    <span className="lp-dash__tile lp-dash__tile--b" />
                    <span className="lp-dash__tile lp-dash__tile--c" />
                    <span className="lp-dash__tile lp-dash__tile--d" />
                  </div>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section id="caracteristicas" className="lp-section lp-section--alt shell">
          <header className="lp-section__head">
            <h2>Todo lo que necesitas en un solo lugar</h2>
            <p>Una experiencia premium para pacientes y equipos clínicos</p>
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

        <section className="lp-section shell">
          <header className="lp-section__head">
            <h2>Así de fácil funciona</h2>
            <p>Tres pasos para conectar paciente y clínica sin fricción</p>
          </header>
          <div className="lp-steps">
            {steps.map((s, i) => (
              <div key={s.n} className="lp-steps__item">
                <article className="lp-step">
                  <span className="lp-step__num">{s.n}</span>
                  <span className="lp-step__icon">
                    <s.icon className="h-6 w-6" aria-hidden />
                  </span>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </article>
                {i < steps.length - 1 ? (
                  <ChevronRight className="lp-steps__arrow hidden md:block" aria-hidden />
                ) : null}
              </div>
            ))}
          </div>
        </section>

        <section id="demo" className="lp-section shell">
          <div className="lp-demo">
            <div className="lp-demo__copy">
              <span className="lp-badge lp-badge--demo">Demo multi-clínica</span>
              <h2>Una plataforma pensada para crecer contigo</h2>
              <p>
                Escala de una clínica a varios centros sin perder el control. Cada organización tiene su panel aislado:
                agenda, dentistas, facturación e informes sincronizados en tiempo real.
              </p>
              <a href="/login/admin" className="btn btn--primary btn--lg">
                <Play className="h-5 w-5" aria-hidden />
                Ver demo
              </a>
            </div>
            <div className="lp-demo__stats">
              {demoStats.map((s) => (
                <article key={s.label} className="lp-stat">
                  <span className="lp-stat__icon">
                    <s.icon className="h-5 w-5" aria-hidden />
                  </span>
                  <p className="lp-stat__value">{s.value}</p>
                  <p className="lp-stat__label">{s.label}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="precios" className="lp-section shell">
          <header className="lp-section__head">
            <h2>Planes que se adaptan a tu clínica</h2>
            <p>Empieza en demo sin compromiso y escala cuando lo necesites</p>
          </header>
          <div className="lp-pricing">
            <article className="lp-price-card">
              <h3>Esencial</h3>
              <p className="lp-price-card__amount">
                <span>Gratis</span> en demo
              </p>
              <ul>
                <li>Agenda y reservas online</li>
                <li>Portal paciente</li>
                <li>Hasta 1 centro</li>
              </ul>
              <a href="/reserva" className="btn btn--outline btn--block">
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
                <li>Multi-centro ilimitado</li>
                <li>Facturación e informes</li>
                <li>Soporte prioritario</li>
              </ul>
              <a href="/contacto" className="btn btn--primary btn--block">
                Solicitar info
              </a>
            </article>
            <article className="lp-price-card">
              <h3>Enterprise</h3>
              <p className="lp-price-card__amount">
                A medida
              </p>
              <ul>
                <li>Integraciones API</li>
                <li>SLA y formación</li>
                <li>Redis y Supabase LIVE</li>
              </ul>
              <a href="/contacto" className="btn btn--outline btn--block">
                Contactar ventas
              </a>
            </article>
          </div>
        </section>

        <section className="lp-section shell">
          <div className="lp-cta-banner">
            <div>
              <h2>¿Listo para tu próxima sonrisa?</h2>
              <p>Reserva tu cita ahora y déjanos cuidar de ti.</p>
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

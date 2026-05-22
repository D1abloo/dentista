import { useCallback, useEffect, useState } from 'react';
import {
  ArrowRight,
  Building2,
  Check,
  FileText,
  Phone,
  Shield,
  ShieldCheck,
  Users,
  X
} from 'lucide-react';
import { scrollToSection } from '@/lib/publicScroll';
import { PublicFooter } from './PublicFooter';
import { PublicHeader } from './PublicHeader';
import { CookieBanner } from './CookieBanner';
import { ProAccessForm, type ProPlan } from './ProAccessForm';
import { LandingDashboardPreview } from './LandingDashboardPreview';
import { FeatureShowcaseTabs } from './FeatureShowcaseTabs';

const valueCards = [
  {
    icon: Phone,
    title: 'Más citas, menos llamadas',
    text: 'Automatiza reservas y reduce interrupciones en recepción.'
  },
  {
    icon: Users,
    title: 'Recepción más eficiente',
    text: 'Centraliza agenda, pacientes e incidencias en un solo panel.'
  },
  {
    icon: FileText,
    title: 'Facturación profesional',
    text: 'Emite facturas, controla cobros y comparte PDFs con tu clínica.'
  },
  {
    icon: Shield,
    title: 'Experiencia del paciente',
    text: 'Ofrece portal seguro para citas, informes y pagos.'
  }
] as const;

const beforePoints = [
  'Llamadas constantes',
  'Documentos dispersos',
  'Facturación manual',
  'Poca visibilidad de agenda'
];

const afterPoints = [
  'Reservas organizadas 24/7',
  'Expediente centralizado',
  'Cobros y facturas claros',
  'Panel en tiempo real'
];

const securityBullets = [
  'Datos separados por clínica',
  'Accesos protegidos y trazabilidad',
  'Portal paciente seguro',
  'Preparado para una o varias sedes'
];

const trustBadges = ['RGPD', 'Multi-sede', 'Panel PRO', 'Portal seguro'];

const proClinicFeatures = [
  'Agenda avanzada',
  'Portal paciente',
  'Informes y documentos',
  'Facturación',
  'Soporte prioritario'
];

const proMultiFeatures = [
  'Todo en PRO Clínica',
  'Multi-sede',
  'Gestión centralizada',
  'Permisos por equipo',
  'Atención especializada'
];

export function LandingPage() {
  const [loggedOut, setLoggedOut] = useState(false);
  const [plan, setPlan] = useState<ProPlan>('pro_clinica');

  const openProForm = useCallback((nextPlan: ProPlan) => {
    setPlan(nextPlan);
    scrollToSection('contacto-pro');
    window.history.replaceState(null, '', `/?plan=${nextPlan}#contacto-pro`);
  }, []);

  useEffect(() => {
    setLoggedOut(new URLSearchParams(window.location.search).get('logged_out') === '1');
    const hash = window.location.hash.replace('#', '');
    if (hash) scrollToSection(hash);
    const q = new URLSearchParams(window.location.search).get('plan');
    if (q === 'pro_multi' || q === 'pro_clinica') setPlan(q);
  }, []);

  return (
    <>
      <PublicHeader variant="pro" onWantPro={() => openProForm('pro_clinica')} />
      <main className="lp lp--pro">
        {loggedOut ? (
          <div className="shell lp-alert">
            <p>
              Sesión cerrada. Usa <strong>Acceso clínica</strong> para volver al panel de tu clínica.
            </p>
          </div>
        ) : null}

        <section className="pro-hero shell" aria-labelledby="pro-hero-title">
          <div className="pro-hero__grid">
            <div className="pro-hero__copy">
              <span className="pro-eyebrow">Software dental para clínicas</span>
              <h1 id="pro-hero-title">Digitaliza tu clínica dental con una solución PRO</h1>
              <p className="pro-hero__lead">
                Gestiona agenda, pacientes, informes, facturación y portal del paciente desde una sola
                plataforma diseñada para clínicas dentales.
              </p>
              <div className="pro-hero__ctas">
                <button
                  type="button"
                  className="btn btn--coral btn--lg"
                  onClick={() => openProForm('pro_clinica')}
                >
                  Solicitar acceso PRO
                </button>
                <button
                  type="button"
                  className="btn btn--outline-teal btn--lg"
                  onClick={() => scrollToSection('funcionalidades')}
                >
                  Ver funcionalidades
                </button>
              </div>
              <ul className="pro-hero__bullets">
                <li>
                  <Check className="h-4 w-4" aria-hidden />
                  Reservas online 24/7
                </li>
                <li>
                  <Check className="h-4 w-4" aria-hidden />
                  Menos carga administrativa
                </li>
                <li>
                  <Check className="h-4 w-4" aria-hidden />
                  Control multi-sede
                </li>
              </ul>
            </div>
            <div className="pro-hero__visual">
              <LandingDashboardPreview />
            </div>
          </div>
        </section>

        <section id="beneficios" className="pro-section shell">
          <div className="pro-value-grid">
            {valueCards.map((c) => (
              <article key={c.title} className="pro-value-card">
                <span className="pro-value-card__icon">
                  <c.icon className="h-6 w-6" aria-hidden />
                </span>
                <h3>{c.title}</h3>
                <p>{c.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="pro-section pro-section--alt shell">
          <header className="pro-section__head">
            <h2>De procesos manuales a una clínica digital</h2>
          </header>
          <div className="pro-compare">
            <article className="pro-compare__col pro-compare__col--before">
              <h3>Antes</h3>
              <ul>
                {beforePoints.map((p) => (
                  <li key={p}>
                    <X className="h-4 w-4" aria-hidden />
                    {p}
                  </li>
                ))}
              </ul>
            </article>
            <div className="pro-compare__arrow" aria-hidden>
              <ArrowRight className="h-8 w-8" />
            </div>
            <article className="pro-compare__col pro-compare__col--after">
              <h3>Con Dentista+ PRO</h3>
              <ul>
                {afterPoints.map((p) => (
                  <li key={p}>
                    <Check className="h-4 w-4" aria-hidden />
                    {p}
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </section>

        <section id="funcionalidades" className="pro-section shell">
          <header className="pro-section__head">
            <h2>Todo lo que necesita tu clínica</h2>
          </header>
          <FeatureShowcaseTabs />
        </section>

        <section id="seguridad" className="pro-section pro-section--alt shell">
          <div className="pro-security">
            <div className="pro-security__icon" aria-hidden>
              <ShieldCheck className="h-16 w-16" />
            </div>
            <div className="pro-security__copy">
              <h2>Seguridad y control para tu clínica</h2>
              <ul>
                {securityBullets.map((b) => (
                  <li key={b}>
                    <Check className="h-4 w-4" aria-hidden />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
            <div className="pro-security__badges">
              {trustBadges.map((b) => (
                <span key={b} className="pro-badge-pill">
                  {b}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section id="precios" className="pro-section shell">
          <header className="pro-section__head">
            <h2>Planes PRO para clínicas dentales</h2>
          </header>
          <div className="pro-pricing">
            <article className="pro-price-card">
              <span className="pro-price-card__icon pro-price-card__icon--coral">
                <Building2 className="h-7 w-7" aria-hidden />
              </span>
              <h3>PRO Clínica</h3>
              <ul>
                {proClinicFeatures.map((f) => (
                  <li key={f}>
                    <Check className="h-4 w-4" aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>
              <button type="button" className="btn btn--coral btn--block" onClick={() => openProForm('pro_clinica')}>
                Quiero PRO
              </button>
            </article>
            <article className="pro-price-card pro-price-card--featured">
              <span className="pro-price-card__tag">MÁS RECOMENDADO</span>
              <span className="pro-price-card__icon pro-price-card__icon--teal">
                <Building2 className="h-7 w-7" aria-hidden />
              </span>
              <h3>PRO Multi-clínica</h3>
              <ul>
                {proMultiFeatures.map((f) => (
                  <li key={f}>
                    <Check className="h-4 w-4" aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>
              <button type="button" className="btn btn--teal btn--block" onClick={() => openProForm('pro_multi')}>
                Hablar con ventas
              </button>
            </article>
          </div>
        </section>

        <section className="pro-cta-band">
          <div className="shell pro-cta-band__grid">
            <div className="pro-cta-band__visual" aria-hidden>
              <img
                src="/images/login-dentista-paciente.jpg"
                alt=""
                width={560}
                height={360}
                loading="lazy"
              />
            </div>
            <div className="pro-cta-band__copy">
              <h2>Haz que tu clínica funcione de forma más simple, profesional y rentable</h2>
              <p>Implanta Dentista+ PRO y centraliza toda tu operación en una sola plataforma.</p>
              <button type="button" className="btn btn--coral btn--lg" onClick={() => openProForm('pro_clinica')}>
                Solicitar acceso PRO
              </button>
            </div>
          </div>
        </section>

        <section id="contacto-pro" className="pro-section pro-section--form shell" aria-labelledby="contacto-pro-title">
          <ProAccessForm plan={plan} onPlanChange={setPlan} />
        </section>
      </main>
      <PublicFooter variant="pro" />
      <CookieBanner />
    </>
  );
}

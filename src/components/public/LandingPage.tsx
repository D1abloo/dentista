import { useCallback, useEffect, useState } from 'react';
import {
  ArrowRight,
  Building2,
  CalendarClock,
  Check,
  FileText,
  Globe,
  Layers,
  Phone,
  Shield,
  ShieldCheck,
  Sparkles,
  Users,
  X
} from 'lucide-react';
import { scrollToSection } from '@/lib/publicScroll';
import { useReveal } from '@/hooks/useReveal';
import { PublicFooter } from './PublicFooter';
import { PublicHeader } from './PublicHeader';
import { CookieBanner } from './CookieBanner';
import { ProAccessForm, type ProPlan } from './ProAccessForm';
import { LandingDashboardPreview } from './LandingDashboardPreview';
import { FeatureShowcaseGrid } from './FeatureShowcaseGrid';

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

const trustBadges = [
  { label: 'RGPD', icon: ShieldCheck },
  { label: 'Multi-sede', icon: Layers },
  { label: 'Panel PRO', icon: Sparkles },
  { label: 'Portal seguro', icon: Globe }
] as const;

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

  const heroReveal = useReveal();
  const valueReveal = useReveal();
  const compareReveal = useReveal();
  const featuresReveal = useReveal();
  const securityReveal = useReveal();
  const pricingReveal = useReveal();

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

        <section className="pro-hero" aria-labelledby="pro-hero-title">
          <div className="pro-hero__blobs" aria-hidden>
            <span className="pro-hero__blob pro-hero__blob--1" />
            <span className="pro-hero__blob pro-hero__blob--2" />
          </div>
          <div className={`shell pro-hero__grid ${heroReveal.className}`} ref={heroReveal.ref}>
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
                  <span className="pro-hero__bullet-icon">
                    <CalendarClock className="h-4 w-4" aria-hidden />
                  </span>
                  Reservas online 24/7
                </li>
                <li>
                  <span className="pro-hero__bullet-icon">
                    <Users className="h-4 w-4" aria-hidden />
                  </span>
                  Menos carga administrativa
                </li>
                <li>
                  <span className="pro-hero__bullet-icon">
                    <Building2 className="h-4 w-4" aria-hidden />
                  </span>
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
          <div className={`pro-value-grid ${valueReveal.className}`} ref={valueReveal.ref}>
            {valueCards.map((c, i) => (
              <article
                key={c.title}
                className="pro-value-card"
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <span className="pro-value-card__icon">
                  <c.icon className="h-6 w-6" aria-hidden />
                </span>
                <h3>{c.title}</h3>
                <p>{c.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="pro-section pro-section--alt">
          <header className="shell pro-section__head">
            <h2>De procesos manuales a una clínica digital</h2>
          </header>
          <div className={`shell pro-compare ${compareReveal.className}`} ref={compareReveal.ref}>
            <article className="pro-compare__col pro-compare__col--before">
              <div className="pro-compare__media">
                <img
                  src="/images/login-dentista-paciente.jpg"
                  alt=""
                  width={480}
                  height={280}
                  loading="lazy"
                />
              </div>
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
              <ArrowRight className="h-6 w-6" />
            </div>
            <article className="pro-compare__col pro-compare__col--after">
              <div className="pro-compare__media">
                <img
                  src="/images/guides/mobile/admin-dashboard.png"
                  alt=""
                  width={480}
                  height={280}
                  loading="lazy"
                />
              </div>
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
          <div className={featuresReveal.className} ref={featuresReveal.ref}>
            <FeatureShowcaseGrid />
          </div>
        </section>

        <section id="seguridad" className="pro-section pro-section--security">
          <div className={`shell pro-security-wrap ${securityReveal.className}`} ref={securityReveal.ref}>
            <h2 className="pro-security-wrap__title">Seguridad y control para tu clínica</h2>
            <div className="pro-security">
              <div className="pro-security__shield" aria-hidden>
                <ShieldCheck className="h-12 w-12" />
              </div>
              <ul className="pro-security__list">
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
                <div key={b.label} className="pro-trust-badge">
                  <span className="pro-trust-badge__icon">
                    <b.icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span>{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="precios" className="pro-section shell">
          <header className="pro-section__head">
            <h2>Planes PRO para clínicas dentales</h2>
          </header>
          <div className={`pro-pricing ${pricingReveal.className}`} ref={pricingReveal.ref}>
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
              <div className="pro-price-card__header">
                <span>MÁS RECOMENDADO</span>
              </div>
              <div className="pro-price-card__body">
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
              </div>
            </article>
          </div>
        </section>

        <section className="pro-cta-band">
          <div className="pro-cta-band__grid">
            <div className="pro-cta-band__visual" aria-hidden>
              <img
                src="/images/login-dentista-paciente.jpg"
                alt=""
                width={560}
                height={360}
                loading="lazy"
              />
            </div>
            <div className="pro-cta-band__copy shell">
              <h2>Haz que tu clínica funcione de forma más simple, profesional y rentable</h2>
              <p>Implanta Dentista+ PRO y centraliza toda tu operación en una sola plataforma.</p>
              <button type="button" className="btn btn--coral btn--lg" onClick={() => openProForm('pro_clinica')}>
                Solicitar acceso PRO
              </button>
            </div>
          </div>
        </section>

        <section
          id="contacto-pro"
          className="pro-section pro-section--form shell"
          aria-labelledby="contacto-pro-title"
        >
          <ProAccessForm plan={plan} onPlanChange={setPlan} />
        </section>
      </main>
      <PublicFooter variant="pro" />
      <CookieBanner />
    </>
  );
}

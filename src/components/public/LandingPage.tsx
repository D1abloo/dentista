import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, Check, Headphones } from 'lucide-react';
import { scrollToSection } from '@/lib/publicScroll';
import { useReveal } from '@/hooks/useReveal';
import {
  landingClinicModules,
  landingClinicWorkflow,
  landingFeatures,
  landingHelpCards,
  landingHeroBadges,
  landingHeroDevices,
  landingPatientModules,
  landingPlans,
  landingPlatformModules,
  landingSecurityCards,
  landingWhoCards
} from '@/lib/landing/content';
import { PublicFooter } from './PublicFooter';
import { PublicHeader } from './PublicHeader';
import { CookieBanner } from './CookieBanner';
import { ProAccessForm, type ProPlan } from './ProAccessForm';

export function LandingPage() {
  const [loggedOut, setLoggedOut] = useState(false);
  const [plan, setPlan] = useState<ProPlan>('pro_clinica');

  const heroR = useReveal();
  const whoR = useReveal();
  const featR = useReveal();
  const prodR = useReveal();
  const secR = useReveal();
  const priceR = useReveal();

  const openDemo = useCallback((nextPlan: ProPlan = 'pro_clinica') => {
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
      <PublicHeader variant="premium" onWantDemo={() => openDemo('pro_clinica')} />
      <main className="df-lp">
        {loggedOut ? (
          <div className="shell df-lp__alert">
            <p>
              Sesión cerrada correctamente. Puedes volver a entrar desde{' '}
              <a href="/login">acceso a portales</a>.
            </p>
          </div>
        ) : null}

        <section className="df-lp-hero" aria-labelledby="df-lp-hero-title">
          <div className="df-lp-hero__bg" aria-hidden />
          <div className={`shell df-lp-hero__grid ${heroR.className}`} ref={heroR.ref}>
            <div className="df-lp-hero__copy">
              <span className="df-lp-eyebrow">Dentista+</span>
              <h1 id="df-lp-hero-title">
                La plataforma dental para digitalizar{' '}
                <span>citas, pacientes y facturación</span>
              </h1>
              <p className="df-lp-hero__lead">
                Agenda, portal paciente, informes, documentos, facturas, pagos y soporte en una sola
                plataforma segura.
              </p>
              <div className="df-lp-hero__ctas">
                <button type="button" className="df-lp-btn df-lp-btn--primary" onClick={() => openDemo()}>
                  Solicitar demo para clínica
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </button>
                <a href="/login/paciente" className="df-lp-btn df-lp-btn--secondary">
                  Entrar como paciente
                </a>
              </div>
              <ul className="df-lp-hero__badges">
                {landingHeroBadges.map(({ icon: Icon, label }) => (
                  <li key={label}>
                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                    {label}
                  </li>
                ))}
              </ul>
            </div>
            <div className="df-lp-hero__devices" aria-label="Vistas del producto Dentista+">
              {landingHeroDevices.map((d, i) => (
                <figure
                  key={d.label}
                  className={`df-lp-device df-lp-device--${i + 1}`}
                  style={{ animationDelay: `${0.12 * i}s` }}
                >
                  <img src={d.src} alt={d.alt} loading={i === 0 ? 'eager' : 'lazy'} decoding="async" />
                  <figcaption>{d.label}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section id="perfiles" className="df-lp-section shell">
          <header className="df-lp-section__head">
            <h2>¿Quién eres?</h2>
            <p>Elige el acceso que necesitas. Cada portal está aislado y protegido.</p>
          </header>
          <div className={`df-lp-who ${whoR.className}`} ref={whoR.ref}>
            {landingWhoCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <article
                  key={card.id}
                  className="df-lp-who-card"
                  style={{ transitionDelay: `${i * 70}ms` }}
                >
                  <span className="df-lp-who-card__icon" aria-hidden>
                    <Icon className="h-6 w-6" />
                  </span>
                  <h3>{card.title}</h3>
                  <p>{card.text}</p>
                  <a href={card.href} className="df-lp-who-card__link">
                    {card.cta}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </a>
                </article>
              );
            })}
          </div>
        </section>

        <section id="funcionalidades" className="df-lp-section df-lp-section--alt shell">
          <header className="df-lp-section__head">
            <h2>Todo lo que necesita una clínica dental moderna</h2>
          </header>
          <div className={`df-lp-features ${featR.className}`} ref={featR.ref}>
            {landingFeatures.map((f, i) => {
              const Icon = f.icon;
              return (
                <article key={f.title} className="df-lp-feature" style={{ transitionDelay: `${i * 40}ms` }}>
                  <span className="df-lp-feature__icon" aria-hidden>
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section id="portal-paciente" className={`df-lp-product shell ${prodR.className}`} ref={prodR.ref}>
          <div className="df-lp-product__copy">
            <span className="df-lp-eyebrow">Portal paciente</span>
            <h2>Portal paciente completo</h2>
            <p>Tu paciente gestiona su salud dental sin llamadas ni papeles.</p>
            <ul className="df-lp-checklist">
              {landingPatientModules.map((m) => (
                <li key={m}>
                  <Check className="h-4 w-4 shrink-0" aria-hidden />
                  {m}
                </li>
              ))}
            </ul>
            <a href="/login/paciente" className="df-lp-btn df-lp-btn--primary df-lp-btn--sm">
              Ver portal paciente
              <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
          </div>
          <div className="df-lp-product__visual">
            <div className="df-lp-frame df-lp-frame--phone">
              <img
                src="/images/guides/mobile/pdp-citas.png"
                alt="Mis citas en el portal paciente"
                loading="lazy"
              />
            </div>
          </div>
        </section>

        <section id="panel-clinica" className="df-lp-product df-lp-product--reverse shell">
          <div className="df-lp-product__copy">
            <span className="df-lp-eyebrow">Panel clínica</span>
            <h2>Panel clínica para gestionar la operación diaria</h2>
            <p>Desde recepción hasta facturación, todo conectado al portal del paciente.</p>
            <ul className="df-lp-checklist">
              {landingClinicModules.map((m) => (
                <li key={m}>
                  <Check className="h-4 w-4 shrink-0" aria-hidden />
                  {m}
                </li>
              ))}
            </ul>
            <ol className="df-lp-workflow">
              {landingClinicWorkflow.map((step, n) => (
                <li key={step}>
                  <span>{n + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
            <a href="/login/admin" className="df-lp-btn df-lp-btn--primary df-lp-btn--sm">
              Ver panel clínica
              <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
          </div>
          <div className="df-lp-product__visual">
            <div className="df-lp-frame df-lp-frame--desktop">
              <img
                src="/images/guides/mobile/admin-agenda.png"
                alt="Agenda del panel clínica"
                loading="lazy"
              />
            </div>
          </div>
        </section>

        <section id="plataforma" className="df-lp-product shell">
          <div className="df-lp-product__copy">
            <span className="df-lp-eyebrow">Super Admin</span>
            <h2>Plataforma para redes de clínicas y operación multi-tenant</h2>
            <p>Gestión centralizada con aislamiento, auditoría y métricas de uso.</p>
            <ul className="df-lp-checklist df-lp-checklist--cols">
              {landingPlatformModules.map((m) => (
                <li key={m}>
                  <Check className="h-4 w-4 shrink-0" aria-hidden />
                  {m}
                </li>
              ))}
            </ul>
            <a href="/platform/login" className="df-lp-btn df-lp-btn--primary df-lp-btn--sm">
              Ver plataforma
              <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
          </div>
          <div className="df-lp-product__visual">
            <div className="df-lp-frame df-lp-frame--tablet">
              <img
                src="/images/guides/landing/admin-dashboard-hero.png"
                alt="Dashboard de plataforma Dentista+"
                loading="lazy"
              />
            </div>
          </div>
        </section>

        <section id="seguridad" className={`df-lp-section shell ${secR.className}`} ref={secR.ref}>
          <div className="df-lp-security-head">
            <header className="df-lp-section__head df-lp-section__head--left">
              <h2>Seguridad y privacidad desde el diseño</h2>
              <p>Arquitectura multi-tenant con control de acceso y trazabilidad.</p>
            </header>
            <aside className="df-lp-support-card">
              <Headphones className="h-6 w-6 text-teal-600" aria-hidden />
              <div>
                <strong>¿Necesitas ayuda para elegir?</strong>
                <p>Nuestro equipo te orienta según el tamaño de tu clínica.</p>
                <a href="/contacto" className="df-lp-btn df-lp-btn--primary df-lp-btn--sm">
                  Contactar soporte
                </a>
              </div>
            </aside>
          </div>
          <div className="df-lp-security-grid">
            {landingSecurityCards.map((c) => {
              const Icon = c.icon;
              return (
                <article key={c.title} className="df-lp-security-card">
                  <Icon className="h-5 w-5 shrink-0 text-teal-600" aria-hidden />
                  <div>
                    <h3>{c.title}</h3>
                    <p>{c.text}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section id="precios" className="df-lp-section df-lp-section--alt shell">
          <header className="df-lp-section__head">
            <h2>Planes para clínicas dentales</h2>
            <p>Escala cuando tu clínica crezca. Sin sorpresas en la facturación.</p>
          </header>
          <div className={`df-lp-pricing ${priceR.className}`} ref={priceR.ref}>
            {landingPlans.map((p) => (
              <article
                key={p.id}
                className={`df-lp-price${p.featured ? ' df-lp-price--featured' : ''}`}
              >
                {p.badge ? <span className="df-lp-price__badge">{p.badge}</span> : null}
                <h3>{p.name}</h3>
                <p className="df-lp-price__amount">
                  {p.price}
                  {p.period ? <small>{p.period}</small> : null}
                </p>
                <ul>
                  {p.features.map((f) => (
                    <li key={f}>
                      <Check className="h-4 w-4 shrink-0" aria-hidden />
                      {f}
                    </li>
                  ))}
                </ul>
                {p.href.startsWith('/#') ? (
                  <button
                    type="button"
                    className={`df-lp-btn ${p.featured ? 'df-lp-btn--primary' : 'df-lp-btn--secondary'} df-lp-btn--block`}
                    onClick={() => openDemo(p.id === 'multi' ? 'pro_multi' : 'pro_clinica')}
                  >
                    {p.cta}
                  </button>
                ) : (
                  <a
                    href={p.href}
                    className={`df-lp-btn ${p.featured ? 'df-lp-btn--primary' : 'df-lp-btn--secondary'} df-lp-btn--block`}
                  >
                    {p.cta}
                  </a>
                )}
              </article>
            ))}
          </div>
        </section>

        <section id="ayuda" className="df-lp-section shell">
          <header className="df-lp-section__head">
            <h2>Centro de ayuda Dentista+</h2>
            <p>Guías paso a paso para pacientes, clínicas y administradores.</p>
          </header>
          <div className="df-lp-help">
            {landingHelpCards.map((c) => {
              const Icon = c.icon;
              return (
                <a key={c.title} href={c.href} className="df-lp-help-card">
                  <Icon className="h-5 w-5 shrink-0 text-teal-600" aria-hidden />
                  <span>{c.title}</span>
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                </a>
              );
            })}
          </div>
        </section>

        <section className="df-lp-final-cta">
          <div className="shell df-lp-final-cta__inner">
            <h2>Digitaliza tu clínica dental con Dentista+</h2>
            <p>Empieza con demo guiada o entra directamente al portal que necesites.</p>
            <div className="df-lp-final-cta__actions">
              <button type="button" className="df-lp-btn df-lp-btn--primary" onClick={() => openDemo()}>
                Solicitar demo
              </button>
              <a href="/login" className="df-lp-btn df-lp-btn--ghost">
                Entrar al portal
              </a>
            </div>
          </div>
        </section>

        <section id="contacto-pro" className="df-lp-section shell" aria-labelledby="contacto-pro-title">
          <ProAccessForm plan={plan} onPlanChange={setPlan} />
        </section>
      </main>
      <PublicFooter variant="premium" />
      <CookieBanner />
    </>
  );
}

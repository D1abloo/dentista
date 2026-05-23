import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { scrollToSection } from '@/lib/publicScroll';
import { useReveal } from '@/hooks/useReveal';
import {
  landingFeatures,
  landingHeroBadges,
  landingHeroDevices,
  landingPlans,
  landingSecurityCards,
  landingTrustLogos,
  landingWhoCards
} from '@/lib/landing/content';
import { PublicFooter } from './PublicFooter';
import { PublicHeader } from './PublicHeader';
import { CookieBanner } from './CookieBanner';
import { ProAccessForm, type ProPlan } from './ProAccessForm';

export function LandingPage() {
  const [loggedOut, setLoggedOut] = useState(false);
  const [plan, setPlan] = useState<ProPlan>('pro_clinica');
  const [demoOpen, setDemoOpen] = useState(false);

  const heroR = useReveal();
  const whoR = useReveal();
  const featR = useReveal();
  const priceR = useReveal();
  const trustR = useReveal();

  const openDemo = useCallback((nextPlan: ProPlan = 'pro_clinica') => {
    setPlan(nextPlan);
    setDemoOpen(true);
    scrollToSection('contacto-pro');
    window.history.replaceState(null, '', `/?plan=${nextPlan}#contacto-pro`);
  }, []);

  useEffect(() => {
    setLoggedOut(new URLSearchParams(window.location.search).get('logged_out') === '1');
    const hash = window.location.hash.replace('#', '');
    if (hash === 'contacto-pro') setDemoOpen(true);
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
              Sesión cerrada correctamente. Puedes volver a entrar desde el menú <strong>Entrar</strong>.
            </p>
          </div>
        ) : null}

        <section className="df-lp-hero" aria-labelledby="df-lp-hero-title">
          <div className="df-lp-hero__bg" aria-hidden />
          <div className={`shell df-lp-hero__grid ${heroR.className}`} ref={heroR.ref}>
            <div className="df-lp-hero__copy">
              <h1 id="df-lp-hero-title">
                La plataforma dental para digitalizar{' '}
                <span>citas, pacientes y facturación</span>
              </h1>
              <p className="df-lp-hero__lead">
                Agenda, portal paciente, informes, documentos, facturas, pagos, consentimientos y soporte en una
                sola plataforma segura.
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
                {landingHeroBadges.map(({ icon: Icon, label }, i) => (
                  <li key={label} style={{ animationDelay: `${i * 60}ms` }}>
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
          </header>
          <div className={`df-lp-who ${whoR.className}`} ref={whoR.ref}>
            {landingWhoCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <article key={card.id} className="df-lp-who-card" style={{ transitionDelay: `${i * 70}ms` }}>
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

        <section id="precios" className="df-lp-section shell">
          <div className={`df-lp-plans-block ${priceR.className}`} ref={priceR.ref}>
            <div className="df-lp-plans-block__main">
              <header className="df-lp-section__head df-lp-section__head--left">
                <h2>Planes para clínicas dentales</h2>
              </header>
              <div className="df-lp-pricing">
                {landingPlans.map((p) => (
                  <article key={p.id} className={`df-lp-price${p.featured ? ' df-lp-price--featured' : ''}`}>
                    {p.badge ? <span className="df-lp-price__badge">{p.badge}</span> : null}
                    <h3>{p.name}</h3>
                    <p className="df-lp-price__amount">
                      {p.price}
                      {p.period ? <small>{p.period}</small> : null}
                    </p>
                    {p.blurb ? <p className="df-lp-price__blurb">{p.blurb}</p> : null}
                    <ul>
                      {p.features.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                    {p.demoPlan ? (
                      <button
                        type="button"
                        className={`df-lp-btn ${p.featured ? 'df-lp-btn--primary' : 'df-lp-btn--secondary'} df-lp-btn--block`}
                        onClick={() => openDemo(p.demoPlan!)}
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
            </div>
            <aside className="df-lp-security-panel" aria-labelledby="seguridad-title">
              <h2 id="seguridad-title">Seguridad y privacidad desde el diseño</h2>
              <ul>
                {landingSecurityCards.map((c) => {
                  const Icon = c.icon;
                  return (
                    <li key={c.title}>
                      <Icon className="h-5 w-5 shrink-0" aria-hidden />
                      <div>
                        <strong>{c.title}</strong>
                        <p>{c.text}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </aside>
          </div>
        </section>

        <section className={`df-lp-trust shell ${trustR.className}`} ref={trustR.ref} aria-label="Clínicas que confían">
          <p className="df-lp-trust__title">Clínicas que ya confían en Dentista+</p>
          <ul className="df-lp-trust__logos">
            {landingTrustLogos.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </section>

        <section className="df-lp-final-cta" aria-labelledby="df-lp-cta-title">
          <div className="shell df-lp-final-cta__grid">
            <div className="df-lp-final-cta__copy">
              <h2 id="df-lp-cta-title">Digitaliza tu clínica dental con Dentista+</h2>
              <p>
                Gestiona citas, pacientes, informes, facturas y ofrece portal paciente desde una única plataforma.
              </p>
              <div className="df-lp-final-cta__actions">
                <button type="button" className="df-lp-btn df-lp-btn--primary" onClick={() => openDemo()}>
                  Solicitar demo
                </button>
                <a href="/login/paciente" className="df-lp-btn df-lp-btn--ghost">
                  Entrar al portal
                </a>
              </div>
            </div>
            <div className="df-lp-final-cta__visual" aria-hidden>
              <img
                src="/images/login-dentista-paciente.jpg"
                alt="Profesionales sanitarios usando Dentista+ en tablet"
                loading="lazy"
              />
            </div>
          </div>
        </section>

        <div id="contacto-pro" className="df-lp-demo-anchor" tabIndex={-1} aria-hidden={!demoOpen} />
      </main>

      {demoOpen ? (
        <div className="df-lp-demo-modal" role="dialog" aria-modal aria-labelledby="demo-modal-title">
          <button type="button" className="df-lp-demo-modal__backdrop" aria-label="Cerrar" onClick={() => setDemoOpen(false)} />
          <div className="df-lp-demo-modal__panel">
            <button type="button" className="df-lp-demo-modal__close" onClick={() => setDemoOpen(false)} aria-label="Cerrar">
              <X className="h-5 w-5" />
            </button>
            <h2 id="demo-modal-title" className="df-lp-demo-modal__title">
              Solicitar demo para tu clínica
            </h2>
            <ProAccessForm plan={plan} onPlanChange={setPlan} compact />
          </div>
        </div>
      ) : null}

      <PublicFooter variant="premium" />
      <CookieBanner />
    </>
  );
}

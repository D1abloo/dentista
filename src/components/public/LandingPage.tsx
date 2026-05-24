import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, CalendarCheck, Check, X } from 'lucide-react';
import { scrollToSection } from '@/lib/publicScroll';
import { useReveal } from '@/hooks/useReveal';
import {
  landingFeatures,
  landingHeroDevices,
  landingPlans,
  landingSecurityCards,
  landingTrustLogos
} from '@/lib/landing/content';
import { publicExplorePaths, publicHeroStats, publicShowcaseTiles } from '@/lib/landing/publicSiteContent';
import { PublicFooter } from './PublicFooter';
import { PublicHeader } from './PublicHeader';
import { CookieBanner } from './CookieBanner';
import { ProAccessForm, type ProPlan } from './ProAccessForm';

function revealClass(visible: boolean) {
  return `ps-reveal${visible ? ' ps-reveal--in' : ''}`;
}

export function LandingPage() {
  const [loggedOut, setLoggedOut] = useState(false);
  const [plan, setPlan] = useState<ProPlan>('pro_clinica');
  const [demoOpen, setDemoOpen] = useState(false);

  const heroR = useReveal();
  const pathsR = useReveal();
  const showR = useReveal();
  const featR = useReveal();
  const priceR = useReveal();

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

  const heroMockup = landingHeroDevices[1];

  return (
    <>
      <PublicHeader onWantDemo={() => openDemo('pro_clinica')} />
      <main className="ps-landing">
        {loggedOut ? (
          <div className="ps-shell ps-alert">
            <p>
              Sesión cerrada correctamente. Puedes volver a entrar desde el menú <strong>Entrar</strong>.
            </p>
          </div>
        ) : null}

        <section className="ps-hero" aria-labelledby="ps-hero-title">
          <div className={`ps-shell ps-hero__grid ${revealClass(heroR.visible)}`} ref={heroR.ref}>
            <div className="ps-hero__copy">
              <span className="ps-hero__eyebrow">
                <CalendarCheck className="h-3.5 w-3.5" aria-hidden />
                Citas odontológicas online
              </span>
              <h1 id="ps-hero-title">Gestiona citas dentales con precisión clínica</h1>
              <p className="ps-hero__lead">
                Reserva, agenda, portal del paciente e historial clínico en una plataforma segura diseñada para
                consultas dentales modernas.
              </p>
              <div className="ps-hero__ctas">
                <a href="/reserva" className="ps-btn ps-btn--primary ps-btn--lg">
                  Reservar cita dental
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </a>
                <button type="button" className="ps-btn ps-btn--outline ps-btn--lg" onClick={() => openDemo()}>
                  Demo para clínicas
                </button>
              </div>
            </div>

            <figure className="ps-hero__visual" aria-label="Panel de agenda clínica Dentista+">
              <div className="ps-hero__card">
                <img src={heroMockup.src} alt={heroMockup.alt} loading="eager" decoding="async" width={1280} height={800} />
              </div>
              <figcaption className="ps-hero__caption">{heroMockup.label}</figcaption>
            </figure>
          </div>

          <div className="ps-shell ps-hero__stats-wrap">
            <div className="ps-hero__stats">
              {publicHeroStats.map((s) => (
                <div key={s.label} className="ps-stat">
                  <strong>{s.value}</strong>
                  <span>{s.label}</span>
                  {s.hint ? <small>{s.hint}</small> : null}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="perfiles" className="ps-section ps-shell">
          <header className="ps-section__head">
            <span className="ps-kicker">Acceso rápido</span>
            <h2>Reserva, consulta o gestiona tu clínica</h2>
            <p>Tres accesos directos según tu perfil: paciente, reserva o equipo clínico.</p>
          </header>
          <div className={`ps-paths ${revealClass(pathsR.visible)}`} ref={pathsR.ref}>
            {publicExplorePaths.map((card) => {
              const Icon = card.icon;
              const inner = (
                <>
                  <span className="ps-path__eyebrow">{card.eyebrow}</span>
                  <span className="ps-path__icon" aria-hidden>
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3>{card.title}</h3>
                  <p>{card.text}</p>
                  <span className="ps-path__cta">
                    {'demo' in card && card.demo ? 'Solicitar demo' : card.cta}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </span>
                </>
              );
              if ('demo' in card && card.demo) {
                return (
                  <button
                    key={card.id}
                    type="button"
                    className={`ps-path ps-path--${card.tone}`}
                    onClick={() => openDemo()}
                  >
                    {inner}
                  </button>
                );
              }
              return (
                <a key={card.id} href={card.href} className={`ps-path ps-path--${card.tone}`}>
                  {inner}
                </a>
              );
            })}
          </div>
        </section>

        <section id="producto" className="ps-section ps-section--alt">
          <div className="ps-shell">
            <header className="ps-section__head">
              <span className="ps-kicker">Plataforma</span>
              <h2>Agenda, portal paciente y facturación</h2>
              <p>Interfaz clara para el día a día en recepción, gabinete y administración.</p>
            </header>
            <div className={`ps-bento ${revealClass(showR.visible)}`} ref={showR.ref}>
              {publicShowcaseTiles.map((tile) => (
                <article key={tile.id} className={`ps-tile ps-tile--${tile.span}`}>
                  <h3>{tile.title}</h3>
                  <p>{tile.text}</p>
                  <img className="ps-tile__img" src={tile.image} alt={tile.alt} loading="lazy" />
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="funcionalidades" className="ps-section ps-shell">
          <header className="ps-section__head">
            <span className="ps-kicker">Funcionalidades</span>
            <h2>Todo lo que necesita una clínica dental</h2>
          </header>
          <div className={`ps-features ${revealClass(featR.visible)}`} ref={featR.ref}>
            {landingFeatures.map((f) => {
              const Icon = f.icon;
              return (
                <article key={f.title} className="ps-feature">
                  <span className="ps-feature__icon" aria-hidden>
                    <Icon className="h-4 w-4" />
                  </span>
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section id="precios" className="ps-section ps-section--alt">
          <div className="ps-shell">
            <header className="ps-section__head">
              <span className="ps-kicker">Planes</span>
              <h2>Tarifas claras para tu clínica</h2>
              <p>Empieza gratis o activa el plan profesional con prueba de 14 días.</p>
            </header>
            <div className={`ps-pricing-wrap ${revealClass(priceR.visible)}`} ref={priceR.ref}>
              <div className="ps-pricing">
                {landingPlans.map((p) => (
                  <article key={p.id} className={`ps-price${p.featured ? ' ps-price--featured' : ''}`}>
                    {p.badge ? <span className="ps-price__badge">{p.badge}</span> : null}
                    <h3>{p.name}</h3>
                    <p className="ps-price__amount">
                      {p.price}
                      {p.period ? <small>{p.period}</small> : null}
                    </p>
                    {p.blurb ? <p className="ps-price__blurb">{p.blurb}</p> : null}
                    <ul>
                      {p.features.map((f) => (
                        <li key={f}>
                          <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          {f}
                        </li>
                      ))}
                    </ul>
                    {p.demoPlan ? (
                      <button
                        type="button"
                        className={`ps-btn ${p.featured ? 'ps-btn--primary' : 'ps-btn--outline'} ps-btn--block`}
                        onClick={() => openDemo(p.demoPlan!)}
                      >
                        {p.cta}
                      </button>
                    ) : (
                      <a
                        href={p.href}
                        className={`ps-btn ${p.featured ? 'ps-btn--primary' : 'ps-btn--outline'} ps-btn--block`}
                      >
                        {p.cta}
                      </a>
                    )}
                  </article>
                ))}
              </div>
              <aside className="ps-security" aria-labelledby="ps-security-title">
                <h2 id="ps-security-title">Seguridad y privacidad clínica</h2>
                <ul>
                  {landingSecurityCards.map((c) => {
                    const Icon = c.icon;
                    return (
                      <li key={c.title}>
                        <span className="ps-security__icon" aria-hidden>
                          <Icon className="h-4 w-4" />
                        </span>
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
          </div>
        </section>

        <section className="ps-trust ps-shell" aria-label="Clínicas que confían">
          <p className="ps-trust__label">Clínicas que confían en Dentista+</p>
          <ul className="ps-trust__logos">
            {landingTrustLogos.map((logo) => (
              <li key={logo.name}>
                <span className="ps-trust__mark" aria-hidden>
                  {logo.short.slice(0, 1)}
                </span>
                <span>{logo.name}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="ps-cta ps-shell" aria-labelledby="ps-cta-title">
          <div className="ps-cta__panel">
            <div className="ps-cta__copy">
              <h2 id="ps-cta-title">Empieza a digitalizar las citas de tu clínica</h2>
              <p>
                Reserva online para pacientes, agenda para recepción y panel clínico en un solo entorno seguro.
              </p>
              <div className="ps-cta__actions">
                <a href="/reserva" className="ps-btn ps-btn--primary">
                  Reservar cita
                </a>
                <button type="button" className="ps-btn ps-btn--ghost" onClick={() => openDemo()}>
                  Solicitar demo
                </button>
                <a href="/login/paciente" className="ps-btn ps-btn--outline ps-cta__portal-link">
                  Portal paciente
                </a>
              </div>
            </div>
          </div>
        </section>

        <div id="contacto-pro" className="ps-demo-anchor" tabIndex={-1} aria-hidden={!demoOpen} />
      </main>

      {demoOpen ? (
        <div className="ps-demo-modal" role="dialog" aria-modal aria-labelledby="ps-demo-title">
          <button type="button" className="ps-demo-modal__backdrop" aria-label="Cerrar" onClick={() => setDemoOpen(false)} />
          <div className="ps-demo-modal__panel">
            <button type="button" className="ps-demo-modal__close" onClick={() => setDemoOpen(false)} aria-label="Cerrar">
              <X className="h-5 w-5" />
            </button>
            <h2 id="ps-demo-title" className="ps-demo-modal__title">
              Solicitar demo para tu clínica
            </h2>
            <ProAccessForm plan={plan} onPlanChange={setPlan} compact />
          </div>
        </div>
      ) : null}

      <PublicFooter />
      <CookieBanner />
    </>
  );
}

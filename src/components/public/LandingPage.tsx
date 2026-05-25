import { useCallback, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { scrollToSection } from '@/lib/publicScroll';
import { landingTrustLogos } from '@/lib/landing/content';
import { PublicFooter } from './PublicFooter';
import { PublicHeader } from './PublicHeader';
import { CookieBanner } from './CookieBanner';
import { LandingAccessPlatformSection } from './LandingAccessPlatformSection';
import { LandingHeroSection } from './LandingHeroSection';
import { LandingMobileShowcase } from './LandingMobileShowcase';
import { LandingPricingExperienceSection } from './landingProduct/LandingPricingExperienceSection';
import { LandingProductExperienceSection } from './landingProduct/LandingProductExperienceSection';
import { ProAccessForm, type ProPlan } from './ProAccessForm';

export function LandingPage() {
  const [loggedOut, setLoggedOut] = useState(false);
  const [plan, setPlan] = useState<ProPlan>('pro_clinica');
  const [demoOpen, setDemoOpen] = useState(false);

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
      <PublicHeader activeHref="/" onWantDemo={() => openDemo('pro_clinica')} />
      <main className="ps-landing">
        {loggedOut ? (
          <div className="ps-shell ps-alert">
            <p>
              Sesión cerrada correctamente. Puedes volver a entrar desde el menú <strong>Entrar</strong>.
            </p>
          </div>
        ) : null}

        <LandingHeroSection onRequestDemo={() => openDemo('pro_clinica')} />
        <LandingMobileShowcase />
        <LandingAccessPlatformSection onRequestDemo={() => openDemo('pro_clinica')} />

        <LandingProductExperienceSection />
        <LandingPricingExperienceSection onRequestDemo={openDemo} />

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
              <h2 id="ps-cta-title">Digitaliza la gestión de tu clínica</h2>
              <p>
                Portal privado para pacientes, panel clínico para tu equipo y operaciones conectadas en un entorno
                seguro.
              </p>
              <div className="ps-cta__actions">
                <button type="button" className="ps-btn ps-btn--primary" onClick={() => openDemo()}>
                  Solicitar demo
                </button>
                <a href="/portal-paciente" className="ps-btn ps-btn--outline ps-cta__portal-link">
                  Portal del paciente
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

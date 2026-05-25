import { useCallback, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { scrollToSection } from '@/lib/publicScroll';
import { PublicFooter } from './PublicFooter';
import { PublicHeader } from './PublicHeader';
import { CookieBanner } from './CookieBanner';
import { LandingAccessPlatformSection } from './LandingAccessPlatformSection';
import { LandingHeroSection } from './LandingHeroSection';
import { LandingMobileShowcase } from './LandingMobileShowcase';
import { LandingClosingSection } from './landingClosing/LandingClosingSection';
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

        <LandingClosingSection onRequestDemo={() => openDemo('pro_clinica')} />

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

import { ArrowRight } from 'lucide-react';
import { landingHeroBadges } from '@/lib/landing/content';
import { useReveal } from '@/hooks/useReveal';
import { LandingHeroMocks } from './LandingHeroMocks';

type Props = {
  onRequestDemo: () => void;
};

function revealClass(visible: boolean) {
  return visible ? ' ps-reveal--in' : '';
}

export function LandingHeroSection({ onRequestDemo }: Props) {
  const heroR = useReveal();

  return (
    <section className="ps-hero" aria-labelledby="ps-hero-title">
      <div className="ps-hero__glow" aria-hidden />
      <div className="ps-shell ps-shell--wide">
        <div className={`ps-hero__layout${revealClass(heroR.visible)}`} ref={heroR.ref}>
          <div className="ps-hero__grid">
            <div className="ps-hero__copy">
              <h1 id="ps-hero-title" className="ps-hero__title ps-hero__anim ps-hero__anim--1">
                La plataforma dental para digitalizar{' '}
                <span className="ps-hero__highlight">citas, pacientes y facturación</span>
              </h1>
              <p className="ps-hero__lead ps-hero__anim ps-hero__anim--2">
                Agenda, portal paciente, informes, documentos, facturas, pagos, consentimientos y soporte en una
                sola plataforma segura.
              </p>
              <div className="ps-hero__ctas ps-hero__anim ps-hero__anim--3">
                <button type="button" className="ps-btn ps-btn--primary ps-btn--lg" onClick={onRequestDemo}>
                  Solicitar demo para clínica
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </button>
                <a href="/reservar-con-ia" className="ps-btn ps-btn--ink ps-btn--lg">
                  Reservar con IA
                </a>
                <a href="/portal-paciente" className="ps-btn ps-btn--demo-outline ps-btn--lg">
                  Entrar como paciente
                </a>
              </div>
              <ul className="ps-hero__badges ps-hero__anim ps-hero__anim--4" aria-label="Funcionalidades destacadas">
                {landingHeroBadges.map((badge, i) => {
                  const Icon = badge.icon;
                  return (
                    <li
                      key={badge.label}
                      className="ps-hero__badge"
                      style={{ animationDelay: `${0.08 * i + 0.35}s` }}
                    >
                      <Icon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                      {badge.label}
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="ps-hero__stage">
              <LandingHeroMocks />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

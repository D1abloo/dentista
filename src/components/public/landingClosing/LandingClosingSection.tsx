import { ArrowRight, Calendar } from 'lucide-react';
import { useReveal } from '@/hooks/useReveal';
import { useAnimatedMetric } from '@/hooks/useAnimatedMetric';
import { scrollToSection } from '@/lib/publicScroll';
import { landingTrustLogos } from '@/lib/landing/content';
import {
  landingFinalCtaBenefits,
  landingTrustMetrics
} from '@/lib/landing/landingClosingContent';
import { FinalCtaVisual } from './FinalCtaVisual';

type Props = {
  onRequestDemo: () => void;
};

function revealClass(visible: boolean) {
  return visible ? ' ps-reveal--in' : '';
}

function TrustMetric({
  metric,
  animate
}: {
  metric: (typeof landingTrustMetrics)[number];
  animate: boolean;
}) {
  const counted = useAnimatedMetric({
    end: metric.value,
    decimals: 'decimals' in metric ? metric.decimals : 0,
    enabled: animate
  });
  const display = `${metric.prefix}${counted}${metric.suffix}`;

  return (
    <div className="ps-trust-strip__metric">
      <strong>{display}</strong>
      <span>{metric.label}</span>
    </div>
  );
}

export function LandingClosingSection({ onRequestDemo }: Props) {
  const trustR = useReveal(0.15);
  const ctaR = useReveal(0.12);

  return (
    <div className="ps-closing">
      {/* Trust strip */}
      <section
        className={`ps-trust-strip ps-shell ps-shell--wide ps-reveal${revealClass(trustR.visible)}`}
        ref={trustR.ref}
        aria-labelledby="ps-trust-strip-title"
      >
        <p id="ps-trust-strip-title" className="ps-trust-strip__kicker">
          CLÍNICAS QUE CONFÍAN EN DENTISTA+
        </p>
        <ul className="ps-trust-strip__logos">
          {landingTrustLogos.map((logo, i) => (
            <li
              key={logo.name}
              className="ps-trust-strip__logo ps-trust-strip__anim"
              style={{ animationDelay: `${0.06 * i}s` }}
            >
              <span className="ps-trust-strip__mark" aria-hidden>
                {logo.short.slice(0, 2)}
              </span>
              <span>{logo.name}</span>
            </li>
          ))}
        </ul>
        <div className="ps-trust-strip__metrics" aria-label="Métricas de confianza">
          {landingTrustMetrics.map((m, i) => (
            <TrustMetric key={m.label} metric={m} animate={trustR.visible} />
          ))}
        </div>
        <p className="ps-trust-strip__seo">
          Software dental y gestión clínica dental con agenda dental online, portal paciente dental y facturación
          dental para clínicas digitales.
        </p>
      </section>

      {/* Final CTA */}
      <section
        className="ps-final-cta ps-shell ps-shell--wide"
        aria-labelledby="ps-final-cta-title"
      >
        <div className={`ps-final-cta__panel ps-reveal${revealClass(ctaR.visible)}`} ref={ctaR.ref}>
          <div className="ps-final-cta__copy">
            <h2 id="ps-final-cta-title">
              Digitaliza tu clínica dental sin complicar a tu equipo
            </h2>
            <p>
              Agenda, pacientes, informes, documentos, facturación y portal del paciente conectados en un entorno
              seguro.
            </p>
            <p className="ps-final-cta__seo">
              Informes odontológicos, software odontológico y clínica dental digital en una sola plataforma.
            </p>
            <ul className="ps-final-cta__benefits" aria-label="Ventajas">
              {landingFinalCtaBenefits.map((b) => {
                const Icon = b.icon;
                return (
                  <li key={b.label}>
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                    {b.label}
                  </li>
                );
              })}
            </ul>
            <div className="ps-final-cta__actions">
              <button type="button" className="ps-btn ps-btn--primary ps-btn--lg" onClick={onRequestDemo}>
                <Calendar className="h-4 w-4" aria-hidden />
                Solicitar demo
              </button>
              <a href="/portal-paciente" className="ps-btn ps-btn--ghost-light ps-btn--lg">
                Entrar al portal paciente
              </a>
              <button
                type="button"
                className="ps-final-cta__link-plans"
                onClick={() => scrollToSection('precios')}
              >
                Ver planes
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
          <FinalCtaVisual />
        </div>
      </section>
    </div>
  );
}

import { ArrowRight, Calendar, UserRound } from 'lucide-react';
import { useReveal } from '@/hooks/useReveal';
import {
  landingAccessCards,
  landingProductShowcases,
  landingWorkflowSteps
} from '@/lib/landing/accessPlatformContent';

import { brandImages } from '@/lib/brand/assets';
import { BRAND_NAME } from '@/lib/brand/identity';

const LOGO_SRC = brandImages.logo;

type Props = {
  onRequestDemo: () => void;
};

function revealClass(visible: boolean) {
  return visible ? ' ps-reveal--in' : '';
}

export function LandingAccessPlatformSection({ onRequestDemo }: Props) {
  const accessR = useReveal();
  const connectedR = useReveal();
  const ctaR = useReveal();

  return (
    <section className="ps-acc-plat" aria-labelledby="ps-acc-plat-access-title">
      <div className="ps-acc-plat__deco ps-acc-plat__deco--blob" aria-hidden />
      <div className="ps-acc-plat__deco ps-acc-plat__deco--ring" aria-hidden />

      <div className="ps-shell ps-shell--wide">
        {/* Bloque 1: acceso rápido */}
        <div
          id="perfiles"
          className={`ps-acc-plat__panel ps-acc-plat__panel--access ps-reveal${revealClass(accessR.visible)}`}
          ref={accessR.ref}
        >
          <header className="ps-acc-plat__head ps-acc-plat__anim ps-acc-plat__anim--1">
            <span className="ps-acc-plat__kicker">ACCESO RÁPIDO</span>
            <h2 id="ps-acc-plat-access-title">Accede a AgendaClinic según tu perfil</h2>
            <p>
              Elige el acceso correcto para entrar como paciente, clínica o administrador de plataforma.
            </p>
            <p className="ps-acc-plat__seo">
              Software dental y portal paciente dental con acceso seguro para gestión de clínicas dentales y
              software odontológico en la nube.
            </p>
          </header>

          <div className="ps-acc-plat__access-grid">
            {landingAccessCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <article
                  key={card.id}
                  className={`ps-acc-card ps-acc-card--${card.tone} ps-acc-plat__anim ps-acc-plat__anim--${index + 2}`}
                >
                  <span className="ps-acc-card__badge">{card.badge}</span>
                  <span className="ps-acc-card__icon" aria-hidden>
                    <Icon className="h-6 w-6" strokeWidth={2} />
                  </span>
                  <h3>{card.title}</h3>
                  <p>{card.text}</p>
                  <ul className="ps-acc-card__bullets">
                    {card.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                  <a
                    href={card.href}
                    className={`ps-acc-card__btn ps-acc-card__btn--${card.tone}`}
                  >
                    {card.cta}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </a>
                </article>
              );
            })}
          </div>
        </div>

        {/* Bloque 2: plataforma conectada */}
        <div
          id="producto"
          className={`ps-acc-plat__panel ps-acc-plat__panel--connected ps-reveal${revealClass(connectedR.visible)}`}
          ref={connectedR.ref}
        >
          <header className="ps-acc-plat__head ps-acc-plat__head--connected ps-acc-plat__anim ps-acc-plat__anim--1">
            <span className="ps-acc-plat__kicker">PLATAFORMA</span>
            <h2 id="ps-acc-plat-connected-title">
              Todo conectado: agenda, portal paciente y facturación
            </h2>
            <p>
              La clínica trabaja desde el panel administrativo y el paciente ve automáticamente la información
              publicada en su portal.
            </p>
            <p className="ps-acc-plat__seo">
              Agenda clínica dental, facturación dental y citas dentales online en una clínica dental digital
              unificada.
            </p>
          </header>

          <div
            className="ps-acc-plat__workflow ps-acc-plat__anim ps-acc-plat__anim--2"
            aria-label="Flujo: cita creada, informe publicado, factura emitida, paciente informado"
          >
            {landingWorkflowSteps.map((step, i) => {
              const StepIcon = step.icon;
              return (
                <div key={step.title} className="ps-acc-plat__workflow-step">
                  <span className="ps-acc-plat__workflow-icon" aria-hidden>
                    <StepIcon className="h-4 w-4" strokeWidth={2.25} />
                  </span>
                  <div>
                    <strong>{step.title}</strong>
                    <span>{step.subtitle}</span>
                  </div>
                  {i < landingWorkflowSteps.length - 1 ? (
                    <span className="ps-acc-plat__workflow-arrow" aria-hidden>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="ps-acc-plat__products">
            {landingProductShowcases.map((product, index) => {
              const Icon = product.icon;
              return (
                <article
                  key={product.id}
                  className={`ps-acc-product ps-acc-plat__anim ps-acc-plat__anim--${index + 3}`}
                >
                  <div className="ps-acc-product__copy">
                    <span className={`ps-acc-product__icon ps-acc-product__icon--${product.iconTone}`} aria-hidden>
                      <Icon className="h-4 w-4" strokeWidth={2.25} />
                    </span>
                    <h3>
                      <a href={product.href}>{product.title}</a>
                    </h3>
                    <p>{product.text}</p>
                    <ul>
                      {product.bullets.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  </div>
                  <figure className="ps-acc-product__media" role="img" aria-label={product.alt}>
                    <img src={product.image} alt="" loading="lazy" decoding="async" />
                  </figure>
                </article>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div
          className={`ps-acc-plat__cta ps-reveal${revealClass(ctaR.visible)}`}
          ref={ctaR.ref}
        >
          <div className="ps-acc-plat__cta-copy">
            <span className="ps-acc-plat__cta-icon" aria-hidden>
              <img src={LOGO_SRC} alt="Logo de AgendaClinic" width={40} height={40} decoding="async" />
            </span>
            <div>
              <h3>¿Quieres verlo funcionando en tu clínica?</h3>
              <p>
                Solicita una demo y te mostramos cómo {BRAND_NAME} conecta agenda, portal paciente, informes y
                facturación.
              </p>
            </div>
          </div>
          <div className="ps-acc-plat__cta-actions">
            <button type="button" className="ps-btn ps-btn--primary" onClick={onRequestDemo}>
              <Calendar className="h-4 w-4" aria-hidden />
              Solicitar demo
            </button>
            <a href="/portal-paciente" className="ps-btn ps-btn--demo-outline">
              <UserRound className="h-4 w-4" aria-hidden />
              Entrar como paciente
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

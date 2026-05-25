import { useState } from 'react';
import { ArrowRight, Calendar, Check, MessageCircle } from 'lucide-react';
import { useReveal } from '@/hooks/useReveal';
import { scrollToSection } from '@/lib/publicScroll';
import {
  landingPlanComparisonRows,
  landingPlanDetails,
  landingPlanSelectorRows,
  landingPricingSecurity,
  type PricingPlanId
} from '@/lib/landing/productExperienceContent';
import type { ProPlan } from '../ProAccessForm';
import { PlanRecommenderModal } from './PlanRecommenderModal';

type Props = {
  onRequestDemo: (plan?: ProPlan) => void;
};

function revealClass(visible: boolean) {
  return visible ? ' ps-reveal--in' : '';
}

export function LandingPricingExperienceSection({ onRequestDemo }: Props) {
  const sectionR = useReveal();
  const [selected, setSelected] = useState<PricingPlanId>('profesional');
  const [showCompare, setShowCompare] = useState(false);
  const [recommenderOpen, setRecommenderOpen] = useState(false);

  const plan = landingPlanDetails[selected];

  return (
    <section id="precios" className="ps-price-exp" aria-labelledby="ps-price-exp-title">
      <div className="ps-shell ps-shell--wide">
        <div className={`ps-price-exp__inner ps-reveal${revealClass(sectionR.visible)}`} ref={sectionR.ref}>
          <header className="ps-price-exp__head ps-price-exp__anim ps-price-exp__anim--1">
            <span className="ps-price-exp__kicker">PLANES</span>
            <h2 id="ps-price-exp-title">Elige cómo quieres empezar</h2>
            <p>
              Empieza con lo básico o activa la gestión completa de tu clínica con el plan Profesional.
            </p>
            <p className="ps-price-exp__seo">
              Gestión de clínicas dentales con software odontológico, facturación dental y portal paciente en un
              plan flexible.
            </p>
          </header>

          <div
            className="ps-price-exp__layout ps-price-exp__anim ps-price-exp__anim--2"
            role="region"
            aria-label="Selector de planes"
          >
            <div
              className="ps-price-exp__selector"
              role="tablist"
              aria-label="Planes disponibles"
            >
              {landingPlanSelectorRows.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  role="tab"
                  aria-selected={selected === row.id}
                  className={`ps-price-exp__sel-row${selected === row.id ? ' ps-price-exp__sel-row--active' : ''}`}
                  onClick={() => setSelected(row.id)}
                >
                  <span className="ps-price-exp__sel-radio" aria-hidden />
                  <span className="ps-price-exp__sel-copy">
                    <strong>
                      {row.name}
                      {'badge' in row && row.badge ? (
                        <span className="ps-price-exp__sel-badge">{row.badge}</span>
                      ) : null}
                    </strong>
                    <small>{row.tagline}</small>
                  </span>
                  <span className="ps-price-exp__sel-price">{row.price}</span>
                </button>
              ))}
            </div>

            <article
              className={`ps-price-exp__highlight ps-price-exp__highlight--${selected}`}
              role="tabpanel"
              aria-label={`Plan ${plan.name}`}
            >
              {plan.badge ? <span className="ps-price-exp__badge">{plan.badge}</span> : null}
              <h3>{plan.name}</h3>
              <p className="ps-price-exp__amount">
                {plan.price}
                {plan.period ? <small>{plan.period}</small> : null}
              </p>
              <p className="ps-price-exp__desc">{plan.description}</p>
              <ul className="ps-price-exp__included">
                {plan.included.map((item) => (
                  <li key={item}>
                    <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="ps-price-exp__actions">
                {plan.demoPlan ? (
                  <button
                    type="button"
                    className="ps-btn ps-btn--primary"
                    onClick={() => onRequestDemo(plan.demoPlan)}
                  >
                    {plan.ctaPrimary}
                  </button>
                ) : (
                  <a href={plan.hrefPrimary} className="ps-btn ps-btn--primary">
                    {plan.ctaPrimary}
                  </a>
                )}
                <button
                  type="button"
                  className="ps-btn ps-btn--demo-outline"
                  onClick={() => onRequestDemo(plan.demoPlan ?? 'pro_clinica')}
                >
                  <Calendar className="h-4 w-4" aria-hidden />
                  {plan.ctaSecondary}
                </button>
              </div>
            </article>

            <aside className="ps-price-exp__security" aria-labelledby="ps-price-exp-security">
              <h3 id="ps-price-exp-security">Incluido en todos los planes</h3>
              <ul>
                {landingPricingSecurity.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.title}>
                      <span aria-hidden>
                        <Icon className="h-4 w-4" />
                      </span>
                      {item.title}
                    </li>
                  );
                })}
              </ul>
              <p className="ps-price-exp__note">Puedes cambiar de plan cuando tu clínica crezca.</p>
            </aside>
          </div>

          {showCompare ? (
            <div
              id="precios-comparacion"
              className="ps-price-exp__compare ps-price-exp__anim ps-price-exp__anim--3"
              tabIndex={-1}
            >
              <h3>Comparar todos los planes</h3>
              <div className="ps-price-exp__table-wrap">
                <table className="ps-price-exp__table">
                  <thead>
                    <tr>
                      <th scope="col">Funcionalidad</th>
                      <th scope="col">Esencial</th>
                      <th scope="col">Profesional</th>
                      <th scope="col">Multi-sede</th>
                      <th scope="col">Enterprise</th>
                    </tr>
                  </thead>
                  <tbody>
                    {landingPlanComparisonRows.map((row) => (
                      <tr key={row.feature}>
                        <th scope="row">{row.feature}</th>
                        <td>{cellValue(row.esencial)}</td>
                        <td>{cellValue(row.profesional)}</td>
                        <td>{cellValue(row.multi)}</td>
                        <td>{cellValue(row.enterprise)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          <div className="ps-price-exp__recommender ps-price-exp__anim ps-price-exp__anim--4">
            <div className="ps-price-exp__recommender-copy">
              <span className="ps-price-exp__recommender-icon" aria-hidden>
                <MessageCircle className="h-5 w-5" />
              </span>
              <div>
                <h3>¿No sabes qué plan elegir?</h3>
                <p>
                  Dinos cuántas clínicas, profesionales y pacientes gestionas y te recomendamos el plan adecuado.
                </p>
              </div>
            </div>
            <div className="ps-price-exp__recommender-actions">
              <button
                type="button"
                className="ps-btn ps-btn--primary"
                onClick={() => setRecommenderOpen(true)}
              >
                Recomendarme un plan
              </button>
              <button
                type="button"
                className="ps-btn ps-btn--demo-outline"
                onClick={() => {
                  setShowCompare(true);
                  requestAnimationFrame(() => scrollToSection('precios-comparacion'));
                }}
              >
                Comparar todos los planes
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        </div>
      </div>

      <PlanRecommenderModal
        open={recommenderOpen}
        onClose={() => setRecommenderOpen(false)}
        onRecommended={(planId) => setSelected(planId)}
      />
    </section>
  );
}

function cellValue(v: boolean | string): string {
  if (v === true) return '✓';
  if (v === false) return '—';
  return String(v);
}

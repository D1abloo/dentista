import { ArrowRight, Check } from 'lucide-react';
import { useState } from 'react';
import { useReveal } from '@/hooks/useReveal';
import { scrollToSection } from '@/lib/publicScroll';
import {
  landingFeaturePills,
  landingRoleModules,
  landingWorkflowSteps
} from '@/lib/landing/productExperienceContent';
import { RoleModuleIllustration } from './RoleModuleIllustration';
import { WorkflowStepMock } from './WorkflowStepMock';

function revealClass(visible: boolean) {
  return visible ? ' ps-reveal--in' : '';
}

export function LandingProductExperienceSection() {
  const sectionR = useReveal();
  const [activePill, setActivePill] = useState<string | null>(null);


  return (
    <section id="funcionalidades" className="ps-prod-exp" aria-labelledby="ps-prod-exp-workflow-title">
      <div className="ps-shell ps-shell--wide">
        {/* Workflow */}
        <div className={`ps-prod-exp__block ps-reveal${revealClass(sectionR.visible)}`} ref={sectionR.ref}>
          <header className="ps-prod-exp__head ps-prod-exp__anim ps-prod-exp__anim--1">
            <span className="ps-prod-exp__kicker">FUNCIONAMIENTO</span>
            <h2 id="ps-prod-exp-workflow-title">Así trabaja una clínica con Dentista+</h2>
            <p>
              Desde la reserva de cita hasta el informe, la factura y el portal del paciente, todo queda conectado
              en una sola plataforma.
            </p>
            <p className="ps-prod-exp__seo">
              Software dental para clínicas con agenda clínica dental, portal paciente dental, facturación dental e
              informes odontológicos en citas dentales online.
            </p>
          </header>

          <div className="ps-flow" aria-label="Flujo clínico en cinco pasos">
            <div className="ps-flow__track" aria-hidden>
              <span className="ps-flow__line" />
              {landingWorkflowSteps.map((s) => (
                <span key={s.step} className="ps-flow__dot">
                  {s.step}
                </span>
              ))}
            </div>
            <div className="ps-flow__cards">
              {landingWorkflowSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <article
                    key={step.step}
                    className={`ps-flow__card ps-prod-exp__anim ps-prod-exp__anim--${index + 2}`}
                  >
                    <button
                      type="button"
                      className="ps-flow__card-hit"
                      onClick={() => scrollToSection(step.scrollTo)}
                    >
                      <span className="ps-flow__card-icon" aria-hidden>
                        <Icon className="h-4 w-4" strokeWidth={2.25} />
                      </span>
                      <h3>{step.title}</h3>
                      <p>{step.text}</p>
                      <WorkflowStepMock variant={step.mock} />
                    </button>
                  </article>
                );
              })}
            </div>
          </div>
        </div>

        {/* Módulos por rol */}
        <div className="ps-prod-exp__block ps-prod-exp__block--modules">
          <header className="ps-prod-exp__head ps-prod-exp__anim ps-prod-exp__anim--1">
            <span className="ps-prod-exp__kicker">MÓDULOS</span>
            <h2 id="ps-prod-exp-modules-title">Cada equipo tiene su espacio</h2>
            <p>
              Dentista+ está organizado para que recepción, doctores, administración y pacientes trabajen sin
              mezclarse.
            </p>
          </header>

          <div className="ps-role-grid">
            {landingRoleModules.map((mod, index) => {
              const Icon = mod.icon;
              const moduleId = `modulos-${mod.id}`;
              const dimmed = activePill !== null && !pillMatchesModule(activePill, mod.id);
              return (
                <article
                  key={mod.id}
                  id={moduleId}
                  className={`ps-role-mod ps-role-mod--${mod.tone} ps-prod-exp__anim ps-prod-exp__anim--${index + 2}${dimmed ? ' ps-role-mod--dim' : ''}`}
                  data-module={mod.id}
                >
                  <RoleModuleIllustration illustration={mod.illustration} />
                  <div className="ps-role-mod__body">
                    <span className="ps-role-mod__icon" aria-hidden>
                      <Icon className="h-5 w-5" strokeWidth={2} />
                    </span>
                    <h3>{mod.title}</h3>
                    <p className="ps-role-mod__sub">{mod.subtitle}</p>
                    <ul>
                      {mod.features.map((f) => (
                        <li key={f}>
                          <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <a href={mod.href} className="ps-role-mod__cta">
                      {mod.cta}
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </a>
                  </div>
                </article>
              );
            })}
          </div>

          <ul className="ps-feature-pills ps-prod-exp__anim ps-prod-exp__anim--5" aria-label="Funcionalidades destacadas">
            {landingFeaturePills.map((pill) => {
              const Icon = pill.icon;
              const active = activePill === pill.label;
              return (
                <li key={pill.label}>
                  <button
                    type="button"
                    className={`ps-feature-pill${active ? ' ps-feature-pill--active' : ''}`}
                    aria-pressed={active}
                    onClick={() => setActivePill(active ? null : pill.label)}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                    {pill.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

function pillMatchesModule(pill: string, moduleId: string): boolean {
  const map: Record<string, string[]> = {
    'Reservas online': ['pacientes'],
    'Agenda clínica': ['recepcion'],
    'Informes clínicos': ['doctores'],
    'Documentos seguros': ['doctores', 'pacientes'],
    'Facturas PDF': ['admin'],
    'Pagos y recibos': ['admin'],
    'Consentimientos': ['pacientes'],
    'Seguridad multi-tenant': ['recepcion', 'doctores', 'admin', 'pacientes']
  };
  return map[pill]?.includes(moduleId) ?? true;
}

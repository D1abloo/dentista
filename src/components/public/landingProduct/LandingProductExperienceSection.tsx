import { ArrowRight, Check } from 'lucide-react'
import { useCallback, useState, type KeyboardEvent } from 'react'
import { useReveal } from '@/hooks/useReveal'
import {
  landingFeaturePills,
  landingRoleModules,
  landingWorkflowBenefits,
  landingWorkflowSteps
} from '@/lib/landing/productExperienceContent'
import { scrollToSection } from '@/lib/publicScroll'
import { RoleModuleIllustration } from './RoleModuleIllustration'
import { WorkflowPreviewPanel } from './WorkflowPreviewPanel'
import { WorkflowStepMock } from './WorkflowStepMock'

type Props = {
  onRequestDemo?: () => void
}

function revealClass(visible: boolean) {
  return visible ? ' ps-reveal--in' : ''
}

export function LandingProductExperienceSection({ onRequestDemo }: Props) {
  const sectionR = useReveal()
  const [activePill, setActivePill] = useState<string | null>(null)
  const [activeStep, setActiveStep] = useState(0)

  const active = landingWorkflowSteps[activeStep]
  const panelId = 'ps-workflow-preview-panel'

  const handleStepSelect = useCallback((index: number) => {
    setActiveStep(index)
  }, [])

  const handleStepKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = landingWorkflowSteps.length - 1
    let next = index
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault()
      next = index >= last ? 0 : index + 1
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault()
      next = index <= 0 ? last : index - 1
    } else if (event.key === 'Home') {
      event.preventDefault()
      next = 0
    } else if (event.key === 'End') {
      event.preventDefault()
      next = last
    } else {
      return
    }
    handleStepSelect(next)
    document.getElementById(`ps-workflow-tab-${next}`)?.focus()
  }

  return (
    <section id="funcionalidades" className="ps-prod-exp" aria-labelledby="ps-prod-exp-workflow-title">
      <div className="ps-shell ps-shell--wide">
        <div
          id="como-funciona"
          className={`ps-prod-exp__block ps-prod-exp__block--workflow ps-reveal${revealClass(sectionR.visible)}`}
          ref={sectionR.ref}
        >
          <header className="ps-prod-exp__head ps-prod-exp__head--wide ps-prod-exp__anim ps-prod-exp__anim--1">
            <span className="ps-prod-exp__kicker">FUNCIONAMIENTO</span>
            <h2 id="ps-prod-exp-workflow-title">Así trabaja una clínica con AgendaClinic</h2>
            <p>
              Desde la reserva de cita hasta el informe, la factura y el portal del paciente, todo queda conectado
              en una sola plataforma.
            </p>
            <p className="ps-prod-exp__seo">
              Software dental para clínicas con agenda clínica, portal paciente, facturación dental e informes
              odontológicos conectados en tiempo real.
            </p>
          </header>

          <div className="ps-flow ps-flow--premium" aria-label="Flujo clínico en cinco pasos">
            <div className="ps-flow__track" aria-hidden>
              <span className="ps-flow__line" />
              {landingWorkflowSteps.map((s) => (
                <span
                  key={s.step}
                  className={`ps-flow__dot${activeStep === s.step - 1 ? ' ps-flow__dot--active' : ''}`}
                >
                  {s.step}
                </span>
              ))}
            </div>

            <div
              className="ps-flow__cards"
              role="tablist"
              aria-label="Pasos del flujo de trabajo"
            >
              {landingWorkflowSteps.map((step, index) => {
                const Icon = step.icon
                const isActive = activeStep === index
                const tabId = `ps-workflow-tab-${index}`
                return (
                  <article
                    key={step.step}
                    className={`ps-flow__card ps-flow__card--reveal ps-flow__card--reveal-${index + 1}${isActive ? ' ps-flow__card--active' : ''}`}
                  >
                    <button
                      type="button"
                      id={tabId}
                      role="tab"
                      aria-selected={isActive}
                      aria-controls={panelId}
                      tabIndex={isActive ? 0 : -1}
                      className="ps-flow__card-hit"
                      onClick={() => handleStepSelect(index)}
                      onMouseEnter={() => handleStepSelect(index)}
                      onFocus={() => handleStepSelect(index)}
                      onKeyDown={(e) => handleStepKeyDown(e, index)}
                    >
                      <span className="ps-flow__card-num" aria-hidden>
                        {step.step}
                      </span>
                      <span className="ps-flow__card-icon" aria-hidden>
                        <Icon className="ps-flow__card-icon-svg" strokeWidth={2.25} />
                      </span>
                      <h3>{step.title}</h3>
                      <p>{step.text}</p>
                      <WorkflowStepMock variant={step.mock} />
                    </button>
                  </article>
                )
              })}
            </div>
          </div>

          <div
            className={`ps-flow-preview-wrap ps-prod-exp__anim ps-prod-exp__anim--3${sectionR.visible ? ' ps-flow-preview-wrap--in' : ''}`}
            key={activeStep}
          >
            <WorkflowPreviewPanel
              step={active}
              panelId={panelId}
              labelledBy={`ps-workflow-tab-${activeStep}`}
            />
          </div>

          <ul className="ps-flow-benefits ps-prod-exp__anim ps-prod-exp__anim--4" aria-label="Beneficios del flujo conectado">
            {landingWorkflowBenefits.map((item) => (
              <li key={item.title}>
                <strong>{item.title}</strong>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>

          <div className="ps-flow-cta ps-prod-exp__anim ps-prod-exp__anim--5">
            <p className="ps-flow-cta__title">¿Quieres ver este flujo funcionando en tu clínica?</p>
            <div className="ps-flow-cta__actions">
              <button
                type="button"
                className="ps-btn ps-btn--primary"
                onClick={() => onRequestDemo?.()}
              >
                Solicitar demo
              </button>
              <button
                type="button"
                className="ps-btn ps-btn--ghost"
                onClick={() => scrollToSection('precios')}
              >
                Ver planes
              </button>
            </div>
          </div>
        </div>

        <div className="ps-prod-exp__block ps-prod-exp__block--modules">
          <header className="ps-prod-exp__head ps-prod-exp__anim ps-prod-exp__anim--1">
            <span className="ps-prod-exp__kicker">MÓDULOS</span>
            <h2 id="ps-prod-exp-modules-title">Cada equipo tiene su espacio</h2>
            <p>
              AgendaClinic está organizado para que recepción, doctores, administración y pacientes trabajen sin
              mezclarse.
            </p>
          </header>

          <div className="ps-role-grid">
            {landingRoleModules.map((mod, index) => {
              const Icon = mod.icon
              const moduleId = `modulos-${mod.id}`
              const dimmed = activePill !== null && !pillMatchesModule(activePill, mod.id)
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
              )
            })}
          </div>

          <ul className="ps-feature-pills ps-prod-exp__anim ps-prod-exp__anim--5" aria-label="Funcionalidades destacadas">
            {landingFeaturePills.map((pill) => {
              const Icon = pill.icon
              const active = activePill === pill.label
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
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
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
  }
  return map[pill]?.includes(moduleId) ?? true
}

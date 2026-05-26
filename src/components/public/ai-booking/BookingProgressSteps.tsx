import { BOOKING_STEPS, getStepIndex, type BookingStepId } from './bookingSteps'

type Props = {
  currentStep: BookingStepId
  compact?: boolean
}

export function BookingProgressSteps({ currentStep, compact = false }: Props) {
  const activeIndex = getStepIndex(currentStep)

  return (
    <nav
      className={`ai-progress${compact ? ' ai-progress--compact' : ''}`}
      aria-label="Progreso de la reserva"
    >
      <ol className="ai-progress__list">
        {BOOKING_STEPS.map((step, index) => {
          const done = index < activeIndex
          const active = step.id === currentStep
          return (
            <li
              key={step.id}
              className={`ai-progress__item${active ? ' ai-progress__item--active' : ''}${done ? ' ai-progress__item--done' : ''}`}
              aria-current={active ? 'step' : undefined}
            >
              <span className="ai-progress__dot" aria-hidden>
                {done ? '✓' : index + 1}
              </span>
              <span className="ai-progress__label">
                {compact ? step.shortLabel : step.label}
              </span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

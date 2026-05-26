import { MANAGE_STEPS, getCurrentManageStep, getManageStepIndex } from './manageSteps'
import type { AssistantContext, AssistantUiState } from './types'

type Props = {
  status: AssistantUiState
  context: AssistantContext
  hasAppointments: boolean
  compact?: boolean
}

export function ManageProgressSteps({ status, context, hasAppointments, compact = false }: Props) {
  const current = getCurrentManageStep(status, context, hasAppointments)
  const activeIndex = getManageStepIndex(current)

  return (
    <nav className={`ai-progress ai-progress--manage${compact ? ' ai-progress--compact' : ''}`} aria-label="Progreso gestión de citas">
      <ol className="ai-progress__list">
        {MANAGE_STEPS.map((step, index) => {
          const done = index < activeIndex
          const active = step.id === current
          return (
            <li
              key={step.id}
              className={`ai-progress__item${active ? ' ai-progress__item--active' : ''}${done ? ' ai-progress__item--done' : ''}`}
              aria-current={active ? 'step' : undefined}
            >
              <span className="ai-progress__dot" aria-hidden>
                {done ? '✓' : index + 1}
              </span>
              <span className="ai-progress__label">{compact ? step.shortLabel : step.label}</span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

import { ArrowRight, Check } from 'lucide-react'
import { landingWorkflowSteps } from '@/lib/landing/productExperienceContent'

type WorkflowStep = (typeof landingWorkflowSteps)[number]
import { scrollToSection } from '@/lib/publicScroll'
import { WorkflowPreviewMock } from './WorkflowPreviewMock'

type Props = {
  step: WorkflowStep
  panelId: string
  labelledBy: string
}

export function WorkflowPreviewPanel({ step, panelId, labelledBy }: Props) {
  const { preview, mock } = step

  const handleCtaClick = () => {
    scrollToSection(preview.ctaScrollTo)
  }

  return (
    <div
      id={panelId}
      role="tabpanel"
      aria-labelledby={labelledBy}
      className="ps-flow-preview"
    >
      <div className="ps-flow-preview__inner">
        <div className="ps-flow-preview__copy">
          <h3>{preview.title}</h3>
          <p>{preview.text}</p>
          <ul>
            {preview.bullets.map((bullet) => (
              <li key={bullet}>
                <Check className="h-4 w-4 shrink-0" aria-hidden />
                {bullet}
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="ps-flow-preview__cta"
            onClick={handleCtaClick}
          >
            {preview.cta}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <div className="ps-flow-preview__visual">
          <WorkflowPreviewMock variant={mock} imageKey={preview.image} />
        </div>
      </div>
    </div>
  )
}

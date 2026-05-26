import { brandImageAlts, brandImages } from '@/lib/brand/assets'
import type { WorkflowMock, WorkflowPreviewImage } from '@/lib/landing/productExperienceContent'
import { WorkflowStepMock } from './WorkflowStepMock'

type Props = {
  variant: WorkflowMock
  imageKey: WorkflowPreviewImage
}

const PREVIEW_IMAGES: Record<WorkflowPreviewImage, { src: string; alt: string }> = {
  citas: { src: brandImages.citas, alt: brandImageAlts.citas },
  informes: { src: brandImages.informes, alt: brandImageAlts.informes },
  inicio: { src: brandImages.inicio, alt: brandImageAlts.inicio },
  doctor: { src: brandImages.doctor, alt: brandImageAlts.doctor },
  mensajes: { src: brandImages.mensajes, alt: brandImageAlts.mensajes }
}

export function WorkflowPreviewMock({ variant, imageKey }: Props) {
  const img = PREVIEW_IMAGES[imageKey]

  return (
    <div className="ps-flow-preview-mock">
      <div className="ps-flow-preview-mock__chrome" aria-hidden>
        <span />
        <span />
        <span />
      </div>
      <div className="ps-flow-preview-mock__body">
        <img
          src={img.src}
          alt={img.alt}
          className="ps-flow-preview-mock__img"
          loading="lazy"
          decoding="async"
        />
        <div className="ps-flow-preview-mock__float" aria-hidden>
          <WorkflowStepMock variant={variant} />
        </div>
      </div>
    </div>
  )
}

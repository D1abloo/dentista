import { brandImageAlts, brandImages } from '@/lib/brand/assets'
import { ProductScreenshot } from './ProductScreenshot'

type Variant = 'agenda' | 'portal' | 'billing' | 'security' | 'reports' | 'messages'

type Props = {
  variant: Variant
  title: string
}

const CAPTURES: Record<Variant, { src: string; alt: string; frame: 'laptop' | 'phone' }> = {
  agenda: { src: brandImages.agenda, alt: brandImageAlts.agenda, frame: 'laptop' },
  portal: { src: brandImages.inicio, alt: brandImageAlts.inicio, frame: 'phone' },
  billing: { src: brandImages.informes, alt: brandImageAlts.informes, frame: 'laptop' },
  security: { src: brandImages.doctor, alt: brandImageAlts.doctor, frame: 'laptop' },
  reports: { src: brandImages.informes, alt: brandImageAlts.informes, frame: 'laptop' },
  messages: { src: brandImages.mensajes, alt: brandImageAlts.mensajes, frame: 'phone' }
}

export function FeatureVisualMocks({ variant, title }: Props) {
  const capture = CAPTURES[variant]

  return (
    <div className={`ac-feature-visual ac-feature-visual--capture ac-feature-visual--${variant}`} role="img" aria-label={title}>
      <ProductScreenshot src={capture.src} alt={capture.alt} frame={capture.frame} />
      <p className="ac-feature-visual__caption">Captura real · {title}</p>
    </div>
  )
}

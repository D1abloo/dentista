import { CheckCircle2 } from 'lucide-react'
import { brandImageAlts, brandImages } from '@/lib/brand/assets'

type Props = {
  laptopSrc?: string
  phoneSrc?: string
  laptopAlt?: string
  phoneAlt?: string
}

/** Composición hero estilo Docfav: capturas reales en marco portátil + móvil. */
export function HeroProductShowcase({
  laptopSrc = brandImages.agenda,
  phoneSrc = brandImages.inicio,
  laptopAlt = brandImageAlts.agenda,
  phoneAlt = brandImageAlts.inicio
}: Props) {
  return (
    <div className="ac-hero-showcase" aria-label="Capturas reales de AgendaClinic en ordenador y móvil">
      <div className="ac-hero-showcase__laptop">
        <div className="ac-device-frame ac-device-frame--laptop">
          <div className="ac-device-frame__chrome" aria-hidden>
            <span />
            <span />
            <span />
          </div>
          <img
            src={laptopSrc}
            alt={laptopAlt}
            className="ac-device-frame__shot"
            width={960}
            height={540}
            loading="eager"
            decoding="async"
          />
        </div>
      </div>
      <div className="ac-hero-showcase__phone">
        <div className="ac-device-frame ac-device-frame--phone">
          <div className="ac-device-frame__notch" aria-hidden />
          <img
            src={phoneSrc}
            alt={phoneAlt}
            className="ac-device-frame__shot"
            width={390}
            height={780}
            loading="eager"
            decoding="async"
          />
        </div>
      </div>
      <div className="ac-hero-showcase__toast" role="status" aria-live="polite">
        <CheckCircle2 className="h-4 w-4" aria-hidden />
        <span>
          <strong>Cita agendada</strong>
          <small>Confirmación enviada al paciente</small>
        </span>
      </div>
    </div>
  )
}

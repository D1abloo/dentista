import type { CSSProperties } from 'react'
import { TRUST_CLINICS } from '@/lib/public/trustClinics'

type Props = {
  compact?: boolean
}

export function ClinicTrustLogos({ compact = false }: Props) {
  return (
    <ul className={`ac-clinic-logos${compact ? ' ac-clinic-logos--compact' : ''}`} aria-label="Clínicas que usan AgendaClinic">
      {TRUST_CLINICS.map((clinic) => (
        <li key={clinic.name} className="ac-clinic-logos__item">
          <span
            className="ac-clinic-logos__mark"
            style={{ '--clinic-accent': clinic.accent } as CSSProperties}
            aria-hidden
          >
            {clinic.initials}
          </span>
          <span className="ac-clinic-logos__name">{compact ? clinic.short : clinic.name}</span>
        </li>
      ))}
    </ul>
  )
}

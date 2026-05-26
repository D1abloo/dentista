import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import type { SlotOption } from './types'

type Props = {
  slot: SlotOption
  onSelect: (slot: SlotOption) => void
}

export function SlotCard({ slot, onSelect }: Props) {
  const duration =
    slot.durationMinutes ??
    Math.max(15, Math.round((new Date(slot.endsAt).getTime() - new Date(slot.startsAt).getTime()) / 60000))

  return (
    <article className="ai-slot-card">
      <div className="ai-slot-card__when">
        <p className="ai-slot-card__date">
          {format(parseISO(slot.startsAt), 'EEEE dd/MM', { locale: es })}
        </p>
        <p className="ai-slot-card__time">{format(parseISO(slot.startsAt), 'HH:mm')}</p>
      </div>
      <div className="ai-slot-card__meta">
        <p className="ai-slot-card__pro">{slot.professionalName}</p>
        <p className="ai-slot-card__treatment">
          {slot.treatmentName} · {duration} min
        </p>
        {slot.clinicName ? <p className="ai-slot-card__clinic">{slot.clinicName}</p> : null}
      </div>
      <button
        type="button"
        onClick={() => onSelect(slot)}
        className="ai-btn ai-btn--primary ai-slot-card__cta"
      >
        Reservar este hueco
      </button>
    </article>
  )
}

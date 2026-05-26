import { SlotCard } from './SlotCard'
import type { SlotOption } from './types'

const DEFAULT_VISIBLE = 5

type Props = {
  slots: SlotOption[]
  showAll: boolean
  onToggleShowAll: () => void
  onSelect: (slot: SlotOption) => void
}

export function SlotsPanel({ slots, showAll, onToggleShowAll, onSelect }: Props) {
  if (!slots.length) return null

  const visible = showAll ? slots : slots.slice(0, DEFAULT_VISIBLE)
  const hasMore = slots.length > DEFAULT_VISIBLE

  return (
    <section className="ai-slots" aria-label="Huecos disponibles">
      <h3 className="ai-slots__title">Huecos disponibles</h3>
      <div className="ai-slots__list">
        {visible.map((slot, index) => (
          <div
            key={`${slot.startsAt}-${slot.professionalName}`}
            className="ai-slots__item"
            style={{ animationDelay: `${index * 0.06}s` }}
          >
            <SlotCard slot={slot} onSelect={onSelect} />
          </div>
        ))}
      </div>
      {hasMore ? (
        <button type="button" className="ai-btn ai-btn--ghost ai-slots__more" onClick={onToggleShowAll}>
          {showAll ? 'Ver menos huecos' : 'Ver más huecos'}
        </button>
      ) : null}
    </section>
  )
}

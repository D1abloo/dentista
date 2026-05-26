import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import type { SlotOption } from './types'

type Props = {
  slot: SlotOption
  onSelect: (slot: SlotOption) => void
}

export function SlotCard({ slot, onSelect }: Props) {
  return (
    <article className="rounded-3xl bg-white/95 p-3 shadow-sm ring-1 ring-slate-200/70">
      <p className="text-sm font-semibold text-slate-900">
        {format(parseISO(slot.startsAt), "EEEE dd/MM · HH:mm", { locale: es })}
      </p>
      <p className="mt-1 text-xs text-slate-600">{slot.professionalName}</p>
      <button
        type="button"
        onClick={() => onSelect(slot)}
        className="mt-3 w-full rounded-2xl bg-teal-700 px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
      >
        Reservar este hueco
      </button>
    </article>
  )
}

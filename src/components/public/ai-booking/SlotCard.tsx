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
    <article className="rounded-3xl bg-white/95 p-4 shadow-sm ring-1 ring-slate-200/70">
      <p className="text-sm font-semibold text-slate-900">
        {format(parseISO(slot.startsAt), "EEEE dd/MM · HH:mm", { locale: es })}
      </p>
      {slot.clinicName ? <p className="mt-1 text-xs text-slate-600">{slot.clinicName}</p> : null}
      <p className="mt-1 text-xs text-slate-600">{slot.professionalName}</p>
      <p className="mt-1 text-xs font-semibold text-teal-800">
        {slot.treatmentName} · {duration} min
      </p>
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

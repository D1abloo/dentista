import { useMemo, useState } from 'react'
import {
  ClinicColorScheduleCalendar,
  slotOptionToSchedule,
  type ScheduleCalendarProfessional
} from '@/components/shared/ClinicColorScheduleCalendar'
import type { SlotOption } from './types'

type Props = {
  slots: SlotOption[]
  onSelect: (slot: SlotOption) => void
  selectLabel?: string
  /** Listado compacto para widget / chat estrecho. */
  compact?: boolean
}

function slotDateKey(startsAt: string) {
  return startsAt.slice(0, 10)
}

export function AiBookingSlotCalendar({ slots, onSelect, selectLabel = 'Reservar este hueco', compact = false }: Props) {
  const availableDates = useMemo(
    () => [...new Set(slots.map((slot) => slotDateKey(slot.startsAt)))].sort(),
    [slots]
  )

  const [date, setDate] = useState(availableDates[0] ?? '')

  const scheduleSlots = useMemo(() => slots.map(slotOptionToSchedule), [slots])

  const professionals = useMemo(() => {
    const map = new Map<string, ScheduleCalendarProfessional>()
    for (const slot of slots) {
      const id = slot.professionalId ?? 'any'
      if (!map.has(id)) {
        map.set(id, {
          id,
          fullName: slot.professionalName,
          specialty: slot.treatmentName
        })
      }
    }
    return [...map.values()]
  }, [slots])

  if (!slots.length || !date) return null

  const handleSelect = (picked: { id: string }) => {
    const match = slots.find((slot) => slot.startsAt === picked.id)
    if (match) onSelect(match)
  }

  return (
    <ClinicColorScheduleCalendar
      date={date}
      onDateChange={setDate}
      availableDates={availableDates}
      slots={scheduleSlots}
      professionals={professionals}
      onSelectSlot={handleSelect}
      confirmLabel={selectLabel}
      title="Elige día y hora"
      subtitle={`${availableDates.length} día(s) · ${slots.length} huecos disponibles`}
      compact={compact}
    />
  )
}

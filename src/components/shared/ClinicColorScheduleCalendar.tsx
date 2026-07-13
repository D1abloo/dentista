import { useEffect, useMemo, useRef, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Stethoscope,
  X
} from 'lucide-react'
import {
  SCHEDULE_COLOR_TONES,
  SCHEDULE_HOURS,
  formatTimeRange,
  hourKeyFromIso,
  initialsFromName,
  toneForKey
} from '@/lib/calendar/colorSchedule'

export type ScheduleCalendarSlot = {
  id: string
  startsAt: string
  endsAt: string
  professionalId: string
  professionalName: string
  professionalPhotoUrl?: string
  title: string
  subtitle?: string
  colorKey?: string
  statusLabel?: string
  phone?: string
  email?: string
  notes?: string
}

export type ScheduleCalendarProfessional = {
  id: string
  fullName: string
  photoUrl?: string
  specialty?: string
}

type Props = {
  date: string
  onDateChange?: (date: string) => void
  availableDates?: string[]
  slots: ScheduleCalendarSlot[]
  professionals: ScheduleCalendarProfessional[]
  selectedSlotId?: string
  onSelectSlot: (slot: ScheduleCalendarSlot) => void
  confirmLabel?: string
  title?: string
  subtitle?: string
  /** Vista compacta en listado (ideal para widget / chat estrecho). */
  compact?: boolean
}

function slotAtHour(list: ScheduleCalendarSlot[], hour: string) {
  return list.find((slot) => hourKeyFromIso(slot.startsAt) === hour)
}

export function ClinicColorScheduleCalendar({
  date,
  onDateChange,
  availableDates = [],
  slots,
  professionals,
  selectedSlotId,
  onSelectSlot,
  confirmLabel = 'Reservar este hueco',
  title = 'Calendario de citas',
  subtitle = 'Elige un hueco disponible en la agenda del profesional',
  compact = false
}: Props) {
  const [activeSlot, setActiveSlot] = useState<ScheduleCalendarSlot | null>(null)
  const detailRef = useRef<HTMLDivElement>(null)

  const daySlots = useMemo(
    () => slots.filter((slot) => slot.startsAt.slice(0, 10) === date),
    [slots, date]
  )

  const cols = useMemo(() => {
    if (professionals.length) return professionals
    const map = new Map<string, ScheduleCalendarProfessional>()
    for (const slot of daySlots) {
      if (!map.has(slot.professionalId)) {
        map.set(slot.professionalId, {
          id: slot.professionalId,
          fullName: slot.professionalName,
          photoUrl: slot.professionalPhotoUrl
        })
      }
    }
    return [...map.values()]
  }, [professionals, daySlots])

  const sortedDates = useMemo(() => {
    const set = new Set(availableDates.length ? availableDates : slots.map((s) => s.startsAt.slice(0, 10)))
    return [...set].sort()
  }, [availableDates, slots])

  useEffect(() => {
    if (!activeSlot || !detailRef.current) return
    detailRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [activeSlot])

  const handlePickSlot = (slot: ScheduleCalendarSlot) => {
    setActiveSlot((prev) => (prev?.id === slot.id ? null : slot))
  }

  const handleConfirm = () => {
    if (!activeSlot) return
    onSelectSlot(activeSlot)
    setActiveSlot(null)
  }

  const renderDetailPanel = () => {
    if (!activeSlot) return null
    return (
      <div ref={detailRef} className="ccs-cal__detail" role="region" aria-label="Detalle del hueco seleccionado">
        <header className="ccs-cal__detail-head">
          <div>
            <strong>{activeSlot.title}</strong>
            <p>{activeSlot.subtitle ?? 'Hueco disponible'}</p>
          </div>
          <button type="button" className="ccs-cal__detail-close" onClick={() => setActiveSlot(null)} aria-label="Cerrar detalle">
            <X className="h-4 w-4" />
          </button>
        </header>
        <ul className="ccs-cal__detail-meta">
          <li>
            <Calendar className="h-4 w-4" aria-hidden />
            {format(parseISO(activeSlot.startsAt), "EEEE dd 'de' MMMM", { locale: es })}
          </li>
          <li>
            <Clock className="h-4 w-4" aria-hidden />
            {formatTimeRange(activeSlot.startsAt, activeSlot.endsAt)}
          </li>
          <li>
            <Stethoscope className="h-4 w-4" aria-hidden />
            {activeSlot.professionalName}
          </li>
        </ul>
        <p className="ccs-cal__detail-status">
          <span className="ccs-cal__detail-status-dot" aria-hidden />
          {activeSlot.statusLabel ?? 'Disponible para reservar'}
        </p>
        <button type="button" className="ccs-cal__detail-confirm" onClick={handleConfirm}>
          {confirmLabel}
        </button>
      </div>
    )
  }

  const shiftDate = (delta: number) => {
    if (!onDateChange || !sortedDates.length) return
    const idx = sortedDates.indexOf(date)
    const next = sortedDates[Math.max(0, Math.min(sortedDates.length - 1, idx + delta))]
    if (next) onDateChange(next)
  }

  return (
    <section className={`ccs-cal${compact ? ' ccs-cal--compact' : ''}`} aria-label={title}>
      <header className="ccs-cal__head">
        <div>
          <h3 className="ccs-cal__title">{title}</h3>
          <p className="ccs-cal__subtitle">{subtitle}</p>
        </div>
        {onDateChange && sortedDates.length > 1 ? (
          <div className="ccs-cal__date-nav">
            <button type="button" className="ccs-cal__nav-btn" onClick={() => shiftDate(-1)} aria-label="Día anterior">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="ccs-cal__date-label">
              {format(parseISO(`${date}T12:00:00`), "EEE d MMM", { locale: es })}
            </span>
            <button type="button" className="ccs-cal__nav-btn" onClick={() => shiftDate(1)} aria-label="Día siguiente">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <span className="ccs-cal__date-pill">
            <Calendar className="h-3.5 w-3.5" aria-hidden />
            {format(parseISO(`${date}T12:00:00`), "EEEE d 'de' MMMM", { locale: es })}
          </span>
        )}
      </header>

      {sortedDates.length > 1 ? (
        <div className="ccs-cal__dates" role="tablist" aria-label="Días disponibles">
          {sortedDates.map((d) => (
            <button
              key={d}
              type="button"
              role="tab"
              aria-selected={d === date}
              className={`ccs-cal__date-chip${d === date ? ' is-active' : ''}`}
              onClick={() => onDateChange?.(d)}
            >
              {format(parseISO(`${d}T12:00:00`), 'd MMM', { locale: es })}
            </button>
          ))}
        </div>
      ) : null}

      {compact ? (
        <div className="ccs-cal__list-wrap">
          <ul className="ccs-cal__slot-list">
            {daySlots.length === 0 ? (
              <li className="ccs-cal__slot-empty">No hay huecos disponibles este día.</li>
            ) : (
              daySlots.map((slot) => {
                const tone = toneForKey(slot.colorKey ?? slot.professionalId)
                const colors = SCHEDULE_COLOR_TONES[tone]
                const picked = selectedSlotId === slot.id
                const active = activeSlot?.id === slot.id
                return (
                  <li key={slot.id}>
                    <button
                      type="button"
                      className={`ccs-cal__slot-row${picked ? ' is-selected' : ''}${active ? ' is-active' : ''}`}
                      style={{
                        ['--ccs-accent' as string]: colors.accent,
                        borderColor: active ? colors.border : undefined,
                        background: active ? colors.bg : undefined
                      }}
                      onClick={() => handlePickSlot(slot)}
                    >
                      <span className="ccs-cal__slot-row-time">{formatTimeRange(slot.startsAt, slot.endsAt)}</span>
                      <span className="ccs-cal__slot-row-body">
                        <strong style={{ color: colors.text }}>{slot.title}</strong>
                        <small>{slot.professionalName}</small>
                      </span>
                    </button>
                    {active ? renderDetailPanel() : null}
                  </li>
                )
              })
            )}
          </ul>
        </div>
      ) : (
        <>
          <div className="ccs-cal__grid-wrap">
            <div className="ccs-cal__grid" style={{ ['--ccs-cols' as string]: String(Math.max(cols.length, 1)) }}>
              <div className="ccs-cal__header-row">
                <span className="ccs-cal__corner" aria-hidden />
                {cols.map((pro) => (
                  <div key={pro.id} className="ccs-cal__pro-head">
                    <span className="ccs-cal__pro-avatar" aria-hidden>
                      {pro.photoUrl ? (
                        <img src={pro.photoUrl} alt="" />
                      ) : (
                        initialsFromName(pro.fullName)
                      )}
                    </span>
                    <span className="ccs-cal__pro-name">{pro.fullName}</span>
                    {pro.specialty ? <small>{pro.specialty}</small> : null}
                  </div>
                ))}
              </div>

              <div className="ccs-cal__body">
                {SCHEDULE_HOURS.map((hour) => (
                  <div key={hour} className="ccs-cal__row">
                    <span className="ccs-cal__time">{hour}</span>
                    {cols.map((pro) => {
                      const colSlots = daySlots.filter((s) => s.professionalId === pro.id)
                      const slot = slotAtHour(colSlots, hour)
                      if (!slot) {
                        return (
                          <div key={`${pro.id}-${hour}`} className="ccs-cal__cell ccs-cal__cell--empty" aria-hidden />
                        )
                      }

                      const tone = toneForKey(slot.colorKey ?? slot.professionalId)
                      const colors = SCHEDULE_COLOR_TONES[tone]
                      const picked = selectedSlotId === slot.id
                      const active = activeSlot?.id === slot.id

                      return (
                        <div key={`${pro.id}-${hour}`} className="ccs-cal__cell">
                          <button
                            type="button"
                            className={`ccs-cal__event${picked ? ' is-selected' : ''}${active ? ' is-active' : ''}`}
                            style={{
                              background: colors.bg,
                              borderColor: colors.border,
                              ['--ccs-accent' as string]: colors.accent
                            }}
                            onClick={() => handlePickSlot(slot)}
                          >
                            <strong style={{ color: colors.text }}>{slot.title}</strong>
                            <span>{slot.subtitle ?? 'Hueco disponible'}</span>
                            <em>
                              <Clock className="h-3 w-3" aria-hidden />
                              {formatTimeRange(slot.startsAt, slot.endsAt)}
                            </em>
                          </button>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
          {renderDetailPanel()}
        </>
      )}
    </section>
  )
}

export function slotOptionToSchedule(slot: {
  startsAt: string
  endsAt: string
  professionalId?: string | null
  professionalName: string
  treatmentId: string
  treatmentName: string
  clinicName?: string
}): ScheduleCalendarSlot {
  return {
    id: slot.startsAt,
    startsAt: slot.startsAt,
    endsAt: slot.endsAt,
    professionalId: slot.professionalId ?? 'any',
    professionalName: slot.professionalName,
    title: slot.treatmentName,
    subtitle: slot.clinicName ? `En ${slot.clinicName}` : 'Hueco disponible',
    colorKey: slot.treatmentId,
    statusLabel: 'Disponible para reservar'
  }
}

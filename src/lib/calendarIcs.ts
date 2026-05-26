type CalendarEvent = {
  title: string
  startsAt: string
  endsAt: string
  location?: string
  description?: string
}

const formatIcsUtc = (iso: string) => {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
}

export const buildCalendarIcs = (event: CalendarEvent) => {
  const start = formatIcsUtc(event.startsAt)
  const end = formatIcsUtc(event.endsAt)
  if (!start || !end) return ''

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AgendaClinic//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@agendaclinic.app`,
    `DTSTAMP:${formatIcsUtc(new Date().toISOString())}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${event.title.replace(/\n/g, ' ')}`
  ]

  if (event.location) lines.push(`LOCATION:${event.location.replace(/\n/g, ' ')}`)
  if (event.description) lines.push(`DESCRIPTION:${event.description.replace(/\n/g, ' ')}`)
  lines.push('END:VEVENT', 'END:VCALENDAR')
  return `${lines.join('\r\n')}\r\n`
}

export const downloadCalendarIcs = (event: CalendarEvent, filename = 'cita-agendaclinic.ics') => {
  const ics = buildCalendarIcs(event)
  if (!ics) return
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

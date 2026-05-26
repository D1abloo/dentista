import { downloadCalendarIcs } from '@/lib/calendarIcs'

type Props = {
  hasPortalAccount: boolean
  onBookAnother: () => void
  calendarEvent?: {
    title: string
    startsAt: string
    endsAt: string
    location?: string
    description?: string
  }
}

export function BookingSuccessCard({ hasPortalAccount, onBookAnother, calendarEvent }: Props) {
  const handleAddToCalendar = () => {
    if (!calendarEvent) return
    downloadCalendarIcs(calendarEvent)
  }
  return (
    <article className="rounded-3xl bg-emerald-50 p-4 shadow-sm ring-1 ring-emerald-200">
      <h3 className="text-base font-semibold text-emerald-800">Cita reservada correctamente.</h3>
      <p className="mt-2 text-sm text-emerald-900">
        Te hemos enviado la confirmación por email. Si tu clínica tiene Portal del Paciente activo, podrás
        consultar la cita desde tu cuenta.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={hasPortalAccount ? '/login?next=/paciente/citas' : '/registro-paciente'}
          className="rounded-2xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white"
        >
          Ir al Portal del Paciente
        </a>
        <button
          type="button"
          onClick={onBookAnother}
          className="rounded-2xl border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-800"
        >
          Reservar otra cita
        </button>
        <button
          type="button"
          onClick={handleAddToCalendar}
          disabled={!calendarEvent}
          className="rounded-2xl border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Añadir al calendario
        </button>
      </div>
    </article>
  )
}

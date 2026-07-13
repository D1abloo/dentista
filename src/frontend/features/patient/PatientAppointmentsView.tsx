import { useAsync } from '@/frontend/hooks/useAsync'
import { PageState } from '@/frontend/ds'
import { PatientBookingSection } from '@/components/booking'

type AppointmentRow = {
  id?: string
  startsAt?: string
  treatment?: string
  status?: string
}

export const PatientAppointmentsView = ({ endpoint }: { endpoint: string }) => {
  const state = useAsync(async () => {
    const res = await fetch(endpoint, { credentials: 'include' })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error?.message ?? 'No se pudieron cargar las citas.')
    return json.data
  }, [endpoint])

  if (state.status === 'loading' || state.status === 'idle') {
    return <PageState variant="loading" title="Cargando citas" />
  }

  if (state.status === 'error') {
    return (
      <PageState
        variant="error"
        title="No se pudieron cargar las citas"
        description={state.error.message}
      />
    )
  }

  const rows = Array.isArray(state.data)
    ? (state.data as AppointmentRow[])
    : Array.isArray((state.data as { appointments?: AppointmentRow[] })?.appointments)
      ? ((state.data as { appointments: AppointmentRow[] }).appointments ?? [])
      : []

  if (!rows.length) {
    return (
      <div className="space-y-4">
        <PageState
          variant="empty"
          title="Aún no tienes citas"
          description="Reserva tu primera cita con el calendario online."
          action={<PatientBookingSection compact />}
        />
        <PatientBookingSection />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">{rows.length} cita(s) registrada(s).</p>
        <PatientBookingSection compact />
      </div>
      <ul className="space-y-2">
        {rows.map((row, index) => (
          <li key={row.id ?? `apt-${index}`} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
            <p className="font-semibold text-ink">{row.treatment ?? 'Cita dental'}</p>
            <p className="text-slate-600">{row.startsAt ?? 'Fecha por confirmar'}</p>
            {row.status ? <p className="text-xs uppercase tracking-wide text-slate-500">{row.status}</p> : null}
          </li>
        ))}
      </ul>
    </div>
  )
}

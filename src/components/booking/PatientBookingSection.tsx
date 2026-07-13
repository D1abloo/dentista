import { MapPin } from 'lucide-react'
import { Card } from '@/frontend/ds'
import { ReserveAppointmentButton } from './BookingCalendarModal'
import { useBookingCalendar } from './BookingCalendarProvider'

export const PatientBookingSection = ({ clinicId, compact = false }: { clinicId?: string | null; compact?: boolean }) => {
  const { openCalendar } = useBookingCalendar()

  const handleOpen = () => {
    openCalendar({ clinicId: clinicId ?? null, source: 'patient_portal' })
  }

  if (compact) {
    return <ReserveAppointmentButton onClick={handleOpen} label="Reservar cita" />
  }

  return (
    <Card className="pf-card pf-card--lift p-5">
      <p className="text-xs font-bold uppercase tracking-wide text-brand-700">Pedir cita</p>
      <h2 className="mt-1 font-display text-xl font-semibold text-ink">Reserva online</h2>
      <p className="mt-2 text-sm text-slate-600">
        Consulta disponibilidad real de la clínica y confirma tu cita en pocos pasos.
      </p>
      <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
        <MapPin className="h-3.5 w-3.5" aria-hidden />
        Calendario con huecos verificados
      </p>
      <div className="mt-4">
        <ReserveAppointmentButton onClick={handleOpen} />
      </div>
    </Card>
  )
}

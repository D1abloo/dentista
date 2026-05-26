import { useEffect, useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { AiAppointmentsAssistant } from '@/components/public/ai-booking/AiBookingAssistant'
import { useAiAppointmentsFlow } from '@/components/public/ai-booking/useAiAppointmentsFlow'

export function AiAppointmentsWidget() {
  const [open, setOpen] = useState(false)
  const flow = useAiAppointmentsFlow()

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  return (
    <div className={`ai-widget${open ? ' ai-widget--open' : ''}`}>
      {open ? (
        <>
          <button
            type="button"
            className="ai-widget__backdrop"
            aria-label="Cerrar asistente de citas"
            onClick={() => setOpen(false)}
          />
          <aside
            className="ai-widget__drawer ai-widget__drawer--enter"
            role="dialog"
            aria-modal="true"
            aria-label="Asistente de citas con IA"
          >
            <p className="ai-widget__drawer-tagline">Reserva, revisa o cambia tus citas de forma guiada.</p>
            <AiAppointmentsAssistant
              variant="widget"
              flow={flow}
              inputId="ai-widget-appointments-input"
              expandHref="/citas-con-ia"
              onClose={() => setOpen(false)}
            />
          </aside>
        </>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="ai-widget__btn"
        aria-expanded={open}
        aria-label="Citas con IA"
      >
        <span className="ai-widget__pulse" aria-hidden />
        <MessageCircle className="h-4 w-4" aria-hidden />
        Citas con IA
      </button>
    </div>
  )
}

export const AiBookingWidget = AiAppointmentsWidget

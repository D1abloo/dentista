import { useEffect, useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { AiBookingAssistant } from '@/components/public/ai-booking/AiBookingAssistant'
import { useAiBookingFlow } from '@/components/public/ai-booking/useAiBookingFlow'

export function AiBookingWidget() {
  const [open, setOpen] = useState(false)
  const flow = useAiBookingFlow()

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
            <p className="ai-widget__drawer-tagline">Te guiamos hasta confirmar tu reserva.</p>
            <AiBookingAssistant
              variant="widget"
              flow={flow}
              inputId="ai-widget-booking-input"
              expandHref="/reservar-con-ia"
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
        aria-label="Reservar cita"
      >
        <span className="ai-widget__pulse" aria-hidden />
        <MessageCircle className="h-4 w-4" aria-hidden />
        Reservar cita
      </button>
    </div>
  )
}

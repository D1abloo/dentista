import { useEffect, useState } from 'react'
import { ExternalLink, MessageCircle, Sparkles, X } from 'lucide-react'
import { AiBookingSidePanel } from '@/components/public/ai-booking/AiBookingSidePanel'
import { AiChatWindow } from '@/components/public/ai-booking/AiChatWindow'
import {
  AI_BOOKING_QUICK_REPLIES,
  useAiBookingFlow
} from '@/components/public/ai-booking/useAiBookingFlow'

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

  const handleClose = () => setOpen(false)

  return (
    <div className="ai-widget">
      {open ? (
        <>
          <button
            type="button"
            className="ai-widget__backdrop"
            aria-label="Cerrar asistente de citas"
            onClick={handleClose}
          />
          <aside className="ai-widget__drawer" role="dialog" aria-modal="true" aria-label="Asistente de citas">
            <div className="ai-widget__drawer-head">
              <div className="ai-widget__drawer-brand">
                <span className="ai-widget__drawer-icon" aria-hidden>
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <strong>Asistente de citas con IA</strong>
                  <span>Te ayudamos a reservar tu cita en pocos pasos.</span>
                </div>
              </div>
              <div className="ai-widget__drawer-actions">
                <a href="/reservar-con-ia" className="ai-widget__expand" title="Abrir en pantalla completa">
                  <ExternalLink className="h-4 w-4" aria-hidden />
                  <span className="sr-only">Abrir en pantalla completa</span>
                </a>
                <button
                  type="button"
                  onClick={handleClose}
                  className="ai-widget__close"
                  aria-label="Cerrar asistente de citas"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <p className="ai-widget__drawer-sub">
              Cuéntanos qué necesitas y te ayudamos a encontrar el mejor hueco disponible.
            </p>

            <div className="ai-widget__drawer-body">
              <AiChatWindow
                variant="widget"
                inputId="ai-widget-booking-input"
                messages={flow.messages}
                quickReplies={AI_BOOKING_QUICK_REPLIES}
                chatInput={flow.chatInput}
                status={flow.status}
                onInputChange={flow.setChatInput}
                onSend={(value) => void flow.handleSendMessage(value)}
                onQuickReply={(value) => void flow.handleSendMessage(value)}
              />
              <AiBookingSidePanel
                variant="widget"
                status={flow.status}
                errorMessage={flow.errorMessage}
                slots={flow.slots}
                selectedSlot={flow.selectedSlot}
                readyForSummary={flow.readyForSummary}
                bookingState={flow.bookingState}
                patientForm={flow.patientForm}
                hasPortalAccount={flow.hasPortalAccount}
                onSelectSlot={flow.handleSelectSlot}
                onConfirmBooking={() => void flow.handleConfirmBooking()}
                onEditSummary={() => void flow.handleEditSummary()}
                onBookAnother={() => {
                  flow.resetFlow()
                  setOpen(true)
                }}
              />
            </div>
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
        <MessageCircle className="h-4 w-4" />
        Reservar cita
      </button>
    </div>
  )
}

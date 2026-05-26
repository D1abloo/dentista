import { Bot, ExternalLink, X } from 'lucide-react'
import { AiBookingErrorPanel } from './AiBookingErrorPanel'
import { AiBookingSuccessView } from './AiBookingSuccessView'
import { AiHelpContextCard } from './AiHelpContextCard'
import { BookingContextSummary } from './BookingContextSummary'
import { BookingProgressSteps } from './BookingProgressSteps'
import { BookingSummaryCard } from './BookingSummaryCard'
import { ChatMessage } from './ChatMessage'
import { NoAvailabilityPanel } from './NoAvailabilityPanel'
import { PatientDetailsForm } from './PatientDetailsForm'
import { QuickReplyChips } from './QuickReplyChips'
import { SlotsPanel } from './SlotsPanel'
import { getCurrentBookingStep } from './bookingSteps'
import { AI_BOOKING_QUICK_REPLIES } from './quickReplies'
import type { useAiBookingFlow } from './useAiBookingFlow'

type Flow = ReturnType<typeof useAiBookingFlow>

type Props = {
  variant: 'page' | 'widget'
  flow: Flow
  inputId?: string
  showHeader?: boolean
  expandHref?: string
  onClose?: () => void
}

const STATUS_LABEL: Partial<Record<Flow['status'], string>> = {
  thinking: 'Pensando…',
  asking_followup: 'Pensando…',
  fetching_availability: 'Buscando huecos disponibles…',
  booking: 'Reservando cita…'
}

const isBusy = (status: Flow['status']) =>
  status === 'thinking' || status === 'booking' || status === 'fetching_availability'

export function AiBookingAssistant({
  variant,
  flow,
  inputId = 'ai-booking-input',
  showHeader = true,
  expandHref,
  onClose
}: Props) {
  const isWidget = variant === 'widget'
  const currentStep = getCurrentBookingStep(
    flow.status,
    flow.bookingState,
    flow.selectedSlot,
    flow.readyForSummary
  )
  const statusLabel = STATUS_LABEL[flow.status]
  const busy = isBusy(flow.status)

  if (flow.status === 'success' && flow.selectedSlot) {
    return (
      <div className={`ai-assistant${isWidget ? ' ai-assistant--widget' : ' ai-assistant--page'}`}>
        <AiBookingSuccessView
          bookingState={flow.bookingState}
          slot={flow.selectedSlot}
          hasPortalAccount={flow.hasPortalAccount}
          onBookAnother={flow.resetFlow}
        />
      </div>
    )
  }

  return (
    <div className={`ai-assistant${isWidget ? ' ai-assistant--widget' : ' ai-assistant--page'}`}>
      {showHeader ? (
        <header className="ai-assistant__header">
          <div className="ai-assistant__brand">
            <span className="ai-assistant__avatar" aria-hidden>
              <Bot className="h-5 w-5" />
            </span>
            <div>
              <p className="ai-assistant__eyebrow">Asistente de citas con IA</p>
              <h2 className="ai-assistant__title">Asistente de citas</h2>
              <p className="ai-assistant__subtitle">Reserva guiada con IA</p>
            </div>
            <span className="ai-assistant__pill">Online</span>
          </div>
          <div className="ai-assistant__header-actions">
            {expandHref ? (
              <a href={expandHref} className="ai-assistant__icon-btn" title="Abrir en pantalla completa">
                <ExternalLink className="h-4 w-4" aria-hidden />
                <span className="sr-only">Abrir en pantalla completa</span>
              </a>
            ) : null}
            {onClose ? (
              <button type="button" className="ai-assistant__icon-btn" onClick={onClose} aria-label="Cerrar">
                <X className="h-4 w-4" aria-hidden />
              </button>
            ) : null}
          </div>
          <BookingProgressSteps currentStep={currentStep} compact={isWidget} />
        </header>
      ) : (
        <div className="ai-assistant__progress-only">
          <BookingProgressSteps currentStep={currentStep} compact={isWidget} />
        </div>
      )}

      <div className="ai-assistant__body">
        <section className="ai-assistant__chat" aria-label="Conversación">
          <div className="ai-assistant__messages" aria-live="polite" aria-relevant="additions">
            {flow.messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {flow.showHelpCard ? <AiHelpContextCard /> : null}
          </div>

          <QuickReplyChips
            options={AI_BOOKING_QUICK_REPLIES}
            onSelect={(value) => void flow.handleSendMessage(value)}
            disabled={busy}
          />

          {statusLabel ? (
            <p className="ai-assistant__typing" role="status">
              <span className="ai-assistant__typing-dot" aria-hidden />
              {statusLabel}
            </p>
          ) : null}

          <label htmlFor={inputId} className="sr-only">
            Mensaje para el asistente de citas
          </label>
          <div className="ai-assistant__composer">
            <input
              id={inputId}
              value={flow.chatInput}
              onChange={(event) => flow.setChatInput(event.target.value)}
              placeholder="Escribe, por ejemplo: quiero una limpieza dental esta semana…"
              disabled={busy}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void flow.handleSendMessage(flow.chatInput)
              }}
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => void flow.handleSendMessage(flow.chatInput)}
              className="ai-btn ai-btn--primary"
            >
              Enviar
            </button>
          </div>
        </section>

        <aside className="ai-assistant__panel" aria-label="Detalles de la reserva">
          <BookingContextSummary bookingState={flow.bookingState} collapsible={isWidget} />

          {flow.status === 'error' ? (
            <AiBookingErrorPanel message={flow.errorMessage} onRetry={() => void flow.handleRetry()} />
          ) : null}

          {flow.status === 'no_availability' ? (
            <NoAvailabilityPanel
              onSearchOtherDay={() => void flow.handleSendMessage('Buscar otro día')}
              onSearchOtherProfessional={() => void flow.handleSendMessage('Buscar otro profesional')}
              onFirstAvailable={() => void flow.handleSendMessage('Buscar el primer hueco disponible')}
              onContactClinic={() => undefined}
            />
          ) : null}

          {flow.slots.length && flow.status !== 'collecting_patient_data' && !flow.readyForSummary ? (
            <SlotsPanel
              slots={flow.slots}
              showAll={flow.showAllSlots}
              onToggleShowAll={() => flow.setShowAllSlots((value) => !value)}
              onSelect={flow.handleSelectSlot}
            />
          ) : null}

          {flow.status === 'collecting_patient_data' && flow.selectedSlot ? (
            <PatientDetailsForm
              value={flow.patientForm}
              errors={flow.patientErrors}
              onChange={flow.setPatientForm}
              onSubmit={() => flow.handlePatientContinue()}
            />
          ) : null}

          {flow.selectedSlot && flow.readyForSummary && flow.status !== 'success' ? (
            <BookingSummaryCard
              clinicName={flow.bookingState.clinicName ?? flow.selectedSlot.clinicName}
              treatmentName={flow.bookingState.treatmentName ?? flow.selectedSlot.treatmentName}
              slot={flow.selectedSlot}
              patient={flow.patientForm}
              onConfirm={() => void flow.handleConfirmBooking()}
              onEdit={flow.handleEditSummary}
              loading={flow.status === 'booking'}
            />
          ) : null}
        </aside>
      </div>
    </div>
  )
}

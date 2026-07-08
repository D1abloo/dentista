import { useRef, useState, type FormEvent } from 'react'
import { Bot, ExternalLink, X } from 'lucide-react'
import { AiBookingErrorPanel } from './AiBookingErrorPanel'
import { AiBookingSuccessView } from './AiBookingSuccessView'
import { AiHelpContextCard } from './AiHelpContextCard'
import { AppointmentIntentTabs } from './AppointmentIntentTabs'
import { BookingContextSummary } from './BookingContextSummary'
import { BookingProgressSteps } from './BookingProgressSteps'
import { BookingSummaryCard } from './BookingSummaryCard'
import { CancelAppointmentConfirm } from './CancelAppointmentConfirm'
import { ChatMessage } from './ChatMessage'
import { ExistingAppointmentsList } from './ExistingAppointmentsList'
import { ManageProgressSteps } from './ManageProgressSteps'
import { NoAvailabilityPanel } from './NoAvailabilityPanel'
import { PatientDetailsForm } from './PatientDetailsForm'
import { AppointmentLookupForm } from './AppointmentLookupForm'
import { PatientVerificationForm } from './PatientVerificationForm'
import { VerificationRequiredCard } from './VerificationRequiredCard'
import { QuickReplyChips } from './QuickReplyChips'
import { SlotsPanel } from './SlotsPanel'
import { SlotCard } from './SlotCard'
import { AppointmentCard } from './AppointmentCard'
import { getCurrentBookingStep } from './bookingSteps'
import { AI_APPOINTMENTS_QUICK_REPLIES } from './quickReplies'
import type { useAiAppointmentsFlow } from './useAiAppointmentsFlow'

type Flow = ReturnType<typeof useAiAppointmentsFlow>

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
  verifying_identity: 'Verificando identidad…',
  checking_appointments: 'Buscando tus citas…',
  fetching_appointments: 'Buscando tus citas…',
  fetching_availability: 'Buscando huecos disponibles…',
  booking: 'Procesando…'
}

const isBusy = (status: Flow['status']) =>
  status === 'thinking' ||
  status === 'booking' ||
  status === 'fetching_availability' ||
  status === 'fetching_appointments' ||
  status === 'verifying_identity' ||
  status === 'checking_appointments'

export function AiBookingAssistant({
  variant,
  flow,
  inputId = 'ai-booking-input',
  showHeader = true,
  expandHref,
  onClose
}: Props) {
  const isWidget = variant === 'widget'
  const composerRef = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState('')
  const busy = isBusy(flow.status)

  const handleComposerSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy) return
    const text = (draft.trim() || composerRef.current?.value.trim() || (flow.chatInput ?? '').trim())
    if (!text) return
    setDraft('')
    if (composerRef.current) composerRef.current.value = ''
    void flow.handleSendMessage(text)
  }
  const statusLabel = STATUS_LABEL[flow.status]
  const bookStep = getCurrentBookingStep(
    flow.status,
    flow.bookingState,
    flow.selectedSlot,
    flow.readyForSummary
  )

  if (flow.status === 'success') {
    const slot = flow.selectedSlot
    const appt = flow.selectedAppointment
    if (flow.successKind === 'booked' && slot) {
      return (
        <div className={`ai-assistant${isWidget ? ' ai-assistant--widget' : ' ai-assistant--page'}`}>
          <AiBookingSuccessView
            bookingState={flow.bookingState}
            slot={slot}
            hasPortalAccount={flow.hasPortalAccount}
            onBookAnother={flow.resetFlow}
            title="Cita reservada correctamente"
          />
        </div>
      )
    }
    return (
      <div className={`ai-assistant ai-success${isWidget ? ' ai-assistant--widget' : ' ai-assistant--page'}`}>
        <h2 className="ai-success__title">
          {flow.successKind === 'cancelled'
            ? 'Cita cancelada correctamente'
            : 'Cita cambiada correctamente'}
        </h2>
        <p className="ai-success__text">
          También puedes consultar todos los detalles desde tu Portal del Paciente.
        </p>
        {appt ? <AppointmentCard appointment={appt} compact /> : null}
        <div className="ai-success__actions">
          <a href="/login?next=/paciente/citas" className="ai-btn ai-btn--primary">
            Ir al Portal del Paciente
          </a>
          <button type="button" className="ai-btn ai-btn--secondary" onClick={flow.resetFlow}>
            Volver al asistente
          </button>
        </div>
      </div>
    )
  }

  const showBookProgress = flow.mode === 'book' || flow.activeTab === 'book'
  const showManageProgress = flow.mode === 'manage' && flow.activeTab !== 'book'

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
              <p className="ai-assistant__subtitle">Reserva, revisa o cambia tus citas de forma guiada.</p>
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
          <AppointmentIntentTabs activeTab={flow.activeTab} onTabChange={flow.handleTabChange} />
          {showBookProgress ? <BookingProgressSteps currentStep={bookStep} compact={isWidget} /> : null}
          {showManageProgress ? (
            <ManageProgressSteps
              status={flow.status}
              context={flow.assistantContext}
              hasAppointments={!!flow.appointments.length}
              compact={isWidget}
            />
          ) : null}
        </header>
      ) : (
        <div className="ai-assistant__progress-only">
          <AppointmentIntentTabs activeTab={flow.activeTab} onTabChange={flow.handleTabChange} />
          {showBookProgress ? <BookingProgressSteps currentStep={bookStep} compact={isWidget} /> : null}
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
            options={AI_APPOINTMENTS_QUICK_REPLIES}
            onSelect={(value) => void flow.handleSendMessage(value)}
            disabled={busy}
          />

          {statusLabel ? (
            <p className="ai-assistant__typing" role="status">
              <span className="ai-assistant__typing-dot" aria-hidden />
              {statusLabel}
            </p>
          ) : null}

          <form className="ai-assistant__composer" onSubmit={handleComposerSubmit} aria-label="Enviar mensaje al asistente">
            <label htmlFor={inputId} className="sr-only">
              Mensaje para el asistente de citas
            </label>
            <input
              ref={composerRef}
              id={inputId}
              name="message"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Escribe tu consulta sobre citas…"
              disabled={busy}
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={busy}
              className="ai-btn ai-btn--primary"
              aria-disabled={busy}
            >
              Enviar
            </button>
          </form>
        </section>

        <aside className="ai-assistant__panel" aria-label="Resumen y acciones">
          <BookingContextSummary bookingState={flow.bookingState} collapsible={isWidget} />

          {flow.status === 'error' ? (
            <AiBookingErrorPanel message={flow.errorMessage} onRetry={() => void flow.handleRetry()} />
          ) : null}

          {flow.activeTab !== 'book' &&
          (flow.mode === 'manage' || flow.activeTab === 'mine' || flow.activeTab === 'change') ? (
            <AppointmentLookupForm
              value={flow.lookupIdentifier}
              onChange={flow.setLookupIdentifier}
              onSubmit={() => void flow.handleLookupAppointments()}
              loading={flow.status === 'checking_appointments'}
              error={
                flow.status === 'error' && flow.activeTab === 'mine' ? flow.errorMessage : undefined
              }
              compact={isWidget}
            />
          ) : null}

          {flow.needsStrongVerification && flow.status === 'verifying_identity' ? (
            <PatientVerificationForm
              email={flow.verifyEmail}
              phone={flow.verifyPhone}
              onEmailChange={flow.setVerifyEmail}
              onPhoneChange={flow.setVerifyPhone}
              onVerify={() => void flow.handleVerifyIdentity()}
              onLogin={() => undefined}
              onSecureLink={() => void flow.handleVerifyIdentity()}
              loading={flow.status === 'verifying_identity'}
              error={flow.errorMessage}
            />
          ) : null}

          {flow.needsStrongVerification && flow.status !== 'verifying_identity' ? (
            <VerificationRequiredCard
              onVerify={flow.handleRequestStrongVerification}
              onLogin={() => undefined}
            />
          ) : null}

          {flow.status === 'no_appointments' ? (
            <section className="ai-empty">
              <h3 className="ai-empty__title">No hemos encontrado citas próximas</h3>
              <p className="ai-empty__text">
                No hemos encontrado citas próximas asociadas a esos datos.
              </p>
              <div className="ai-empty__actions">
                <button
                  type="button"
                  className="ai-btn ai-btn--primary"
                  onClick={() => void flow.handleSendMessage('Reservar nueva cita', 'book')}
                >
                  Reservar nueva cita
                </button>
                <a href="/contacto" className="ai-btn ai-btn--secondary">
                  Contactar con la clínica
                </a>
              </div>
            </section>
          ) : null}

          {flow.nextAppointment && flow.activeTab === 'mine' ? (
            <section className="ai-next-appt">
              <h3 className="ai-next-appt__title">Próxima cita</h3>
              <AppointmentCard
                appointment={flow.nextAppointment}
                onReschedule={() => flow.handleStartReschedule(flow.nextAppointment!)}
                onCancel={() => flow.handleStartCancel(flow.nextAppointment!)}
              />
              <a href="/login?next=/paciente/citas" className="ai-btn ai-btn--ghost">
                Ver en Portal del Paciente
              </a>
            </section>
          ) : null}

          {flow.appointments.length && flow.status !== 'confirming_cancel' ? (
            <ExistingAppointmentsList
              appointments={flow.appointments}
              selectedId={flow.selectedAppointment?.id}
              onSelect={flow.handleSelectAppointment}
              onReschedule={flow.handleStartReschedule}
              onCancel={flow.handleStartCancel}
            />
          ) : null}

          {flow.status === 'confirming_cancel' && flow.selectedAppointment ? (
            <CancelAppointmentConfirm
              appointment={flow.selectedAppointment}
              onConfirm={() => void flow.handleConfirmCancel()}
              onKeep={() => flow.resetFlow()}
              loading={busy}
            />
          ) : null}

          {flow.status === 'confirming_reschedule' && flow.selectedSlot && flow.selectedAppointment ? (
            <section className="ai-reschedule-confirm">
              <h3 className="ai-reschedule-confirm__title">¿Confirmas cambiar tu cita al nuevo horario?</h3>
              <SlotCard slot={flow.selectedSlot} onSelect={() => undefined} selectLabel="Nuevo horario" />
              <div className="ai-reschedule-confirm__actions">
                <button
                  type="button"
                  className="ai-btn ai-btn--primary"
                  onClick={() => void flow.handleConfirmReschedule()}
                >
                  Confirmar cambio
                </button>
                <button type="button" className="ai-btn ai-btn--secondary" onClick={flow.resetFlow}>
                  Cancelar
                </button>
              </div>
            </section>
          ) : null}

          {flow.status === 'no_availability' ? (
            <NoAvailabilityPanel
              onSearchOtherDay={() => void flow.handleSendMessage('Buscar otro día')}
              onSearchOtherProfessional={() => void flow.handleSendMessage('Buscar otro profesional')}
              onFirstAvailable={() => void flow.handleSendMessage('Buscar el primer hueco disponible')}
              onContactClinic={() => undefined}
            />
          ) : null}

          {flow.slots.length &&
          !['collecting_patient_data', 'confirming_cancel'].includes(flow.status) ? (
            <SlotsPanel
              slots={flow.slots}
              showAll={flow.showAllSlots}
              onToggleShowAll={() => flow.setShowAllSlots((v) => !v)}
              onSelect={flow.handleSelectSlot}
              selectLabel={flow.rescheduleMode ? 'Cambiar a este hueco' : 'Reservar este hueco'}
            />
          ) : null}

          {flow.status === 'collecting_patient_data' && flow.selectedSlot && !flow.rescheduleMode ? (
            <PatientDetailsForm
              value={flow.patientForm}
              errors={flow.patientErrors}
              onChange={flow.setPatientForm}
              onSubmit={flow.handlePatientContinue}
            />
          ) : null}

          {flow.selectedSlot && flow.readyForSummary && flow.status === 'confirming_booking' ? (
            <BookingSummaryCard
              clinicName={flow.bookingState.clinicName ?? flow.selectedSlot.clinicName}
              treatmentName={flow.bookingState.treatmentName ?? flow.selectedSlot.treatmentName}
              slot={flow.selectedSlot}
              patient={flow.patientForm}
              onConfirm={() => void flow.handleConfirmBooking()}
              onEdit={() => {
                flow.resetFlow()
              }}
              loading={busy}
            />
          ) : null}

          {flow.activeTab === 'help' ? (
            <section className="ai-help-panel">
              <p>
                Puedes reservar citas, consultar las tuyas (con verificación), cambiar o cancelar según la política de
                la clínica.
              </p>
              <a href="/contacto" className="ai-btn ai-btn--primary">
                Contactar con la clínica
              </a>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  )
}

export const AiAppointmentsAssistant = AiBookingAssistant

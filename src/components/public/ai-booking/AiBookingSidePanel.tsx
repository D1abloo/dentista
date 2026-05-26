import { BookingErrorState } from './BookingErrorState'
import { BookingSuccessCard } from './BookingSuccessCard'
import { BookingSummaryCard } from './BookingSummaryCard'
import { SlotCard } from './SlotCard'
import type { AssistantUiState, BookingState, PatientFormValue, SlotOption } from './types'

type Props = {
  variant?: 'page' | 'widget'
  status: AssistantUiState
  errorMessage: string
  slots: SlotOption[]
  selectedSlot: SlotOption | null
  readyForSummary: boolean
  bookingState: BookingState
  patientForm: PatientFormValue
  hasPortalAccount: boolean
  onSelectSlot: (slot: SlotOption) => void
  onConfirmBooking: () => void
  onEditSummary: () => void
  onBookAnother: () => void
}

export function AiBookingSidePanel({
  variant = 'page',
  status,
  errorMessage,
  slots,
  selectedSlot,
  readyForSummary,
  bookingState,
  patientForm,
  hasPortalAccount,
  onSelectSlot,
  onConfirmBooking,
  onEditSummary,
  onBookAnother
}: Props) {
  const compact = variant === 'widget'

  return (
    <div className={compact ? 'ai-widget__side' : 'space-y-3'}>
      {status === 'error' && errorMessage ? <BookingErrorState message={errorMessage} /> : null}

      {!!slots.length ? (
        <article className={compact ? 'ai-widget__slots' : 'space-y-2 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200'}>
          <h3 className="px-1 text-sm font-semibold text-slate-900">Huecos disponibles</h3>
          <div className={compact ? 'ai-widget__slots-list' : 'space-y-2'}>
            {slots.map((slot) => (
              <SlotCard
                key={`${slot.startsAt}-${slot.professionalName}`}
                slot={slot}
                onSelect={onSelectSlot}
              />
            ))}
          </div>
        </article>
      ) : null}

      {selectedSlot && readyForSummary && status !== 'success' ? (
        <BookingSummaryCard
          clinicName={bookingState.clinicName}
          treatmentName={bookingState.treatmentName ?? selectedSlot.treatmentName}
          slot={selectedSlot}
          patient={patientForm}
          onConfirm={onConfirmBooking}
          onEdit={onEditSummary}
          loading={status === 'booking'}
        />
      ) : null}

      {status === 'success' && selectedSlot ? (
        <BookingSuccessCard
          hasPortalAccount={hasPortalAccount}
          onBookAnother={onBookAnother}
          calendarEvent={{
            title: `Cita: ${bookingState.treatmentName ?? selectedSlot.treatmentName}`,
            startsAt: selectedSlot.startsAt,
            endsAt: selectedSlot.endsAt,
            location: bookingState.clinicName ?? selectedSlot.clinicName,
            description: `Profesional: ${selectedSlot.professionalName}`
          }}
        />
      ) : null}
    </div>
  )
}

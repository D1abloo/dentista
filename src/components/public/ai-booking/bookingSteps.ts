import type { AssistantUiState, BookingState } from './types'

export const BOOKING_STEPS = [
  { id: 'need', label: 'Necesidad', shortLabel: 'Nec.' },
  { id: 'clinic', label: 'Clínica', shortLabel: 'Clín.' },
  { id: 'schedule', label: 'Horario', shortLabel: 'Hor.' },
  { id: 'data', label: 'Datos', shortLabel: 'Dat.' },
  { id: 'confirm', label: 'Confirmar', shortLabel: 'Conf.' }
] as const

export type BookingStepId = (typeof BOOKING_STEPS)[number]['id']

export function getCurrentBookingStep(
  status: AssistantUiState,
  bookingState: BookingState,
  selectedSlot: { startsAt: string } | null,
  readyForSummary: boolean
): BookingStepId {
  if (status === 'success' || status === 'booking' || (readyForSummary && selectedSlot)) return 'confirm'
  if (status === 'collecting_patient_data' || (selectedSlot && !readyForSummary)) return 'data'
  if (
    status === 'showing_slots' ||
    status === 'fetching_availability' ||
    status === 'no_availability' ||
    bookingState.selectedSlot
  ) {
    return 'schedule'
  }
  if (bookingState.treatmentId || bookingState.treatmentName) {
    if (bookingState.clinicId && bookingState.dateRange) return 'schedule'
    return 'clinic'
  }
  return 'need'
}

export function getStepIndex(stepId: BookingStepId) {
  return BOOKING_STEPS.findIndex((step) => step.id === stepId)
}

const TIME_LABELS: Record<string, string> = {
  morning: 'Por la mañana',
  afternoon: 'Por la tarde',
  any: 'Cualquier hora'
}

export function getBookingContextRows(state: BookingState) {
  const dateLabel = state.datePreferenceLabel
    ?? (state.dateRange ? `${state.dateRange.from} → ${state.dateRange.to}` : 'Pendiente')

  return [
    { key: 'treatment', label: 'Tratamiento', value: state.treatmentName || 'Pendiente' },
    { key: 'clinic', label: 'Clínica', value: state.clinicName || 'Pendiente' },
    {
      key: 'professional',
      label: 'Profesional',
      value: state.professionalName || 'Cualquiera'
    },
    { key: 'date', label: 'Fecha', value: dateLabel },
    {
      key: 'time',
      label: 'Hora',
      value: state.timePreferenceLabel || TIME_LABELS[state.preferredTime ?? ''] || 'Pendiente'
    }
  ]
}

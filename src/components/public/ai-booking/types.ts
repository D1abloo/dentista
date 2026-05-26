export type AssistantUiState =
  | 'idle'
  | 'thinking'
  | 'asking_followup'
  | 'fetching_availability'
  | 'showing_slots'
  | 'collecting_patient_data'
  | 'confirming'
  | 'booking'
  | 'success'
  | 'error'
  | 'no_availability'

export type ChatRole = 'assistant' | 'user'

export type ChatEntry = {
  id: string
  role: ChatRole
  text: string
}

export type BookingState = {
  clinicId?: string
  clinicName?: string
  treatmentId?: string
  treatmentName?: string
  professionalId?: string
  professionalName?: string
  preferredTime?: 'morning' | 'afternoon' | 'any'
  dateRange?: { from: string; to: string }
  patientName?: string
  patientEmail?: string
  patientPhone?: string
  patientDni?: string
  reason?: string
  notes?: string
  datePreferenceLabel?: string
  timePreferenceLabel?: string
  selectedSlot?: {
    startsAt: string
    endsAt: string
    professionalId: string
  }
}

export type SlotOption = {
  clinicId: string
  clinicName?: string
  treatmentId: string
  treatmentName: string
  durationMinutes?: number
  professionalId: string | null
  professionalName: string
  startsAt: string
  endsAt: string
  label: string
}

export type PatientFormValue = {
  fullName: string
  email: string
  phone: string
  dni: string
  reason: string
  notes: string
  hasPortalAccount: boolean | null
}

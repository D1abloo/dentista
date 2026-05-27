import type { PublicPatientAppointment } from '@/lib/services/patientAppointmentsPublic'

export type AssistantUiState =
  | 'idle'
  | 'thinking'
  | 'asking_followup'
  | 'checking_appointments'
  | 'verifying_identity'
  | 'identity_verified'
  | 'fetching_appointments'
  | 'fetching_availability'
  | 'showing_existing_appointments'
  | 'showing_slots'
  | 'collecting_patient_data'
  | 'confirming'
  | 'confirming_booking'
  | 'confirming_reschedule'
  | 'confirming_cancel'
  | 'booking'
  | 'success'
  | 'error'
  | 'no_availability'
  | 'no_appointments'

export type AssistantTab = 'book' | 'mine' | 'change' | 'help'
export type AssistantMode = 'book' | 'manage' | 'help'
export type SuccessKind = 'booked' | 'cancelled' | 'rescheduled' | null

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

export type VerificationScope = 'lookup' | 'full'

export type AssistantContext = {
  mode: AssistantMode
  verificationToken?: string
  verificationScope?: VerificationScope
  selectedAppointmentId?: string
  pendingIntent?: string
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

export type PatientAppointment = PublicPatientAppointment

export type PatientFormValue = {
  fullName: string
  email: string
  phone: string
  dni: string
  reason: string
  notes: string
  hasPortalAccount: boolean | null
}

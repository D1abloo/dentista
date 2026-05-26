export type AssistantUiState =
  | 'idle'
  | 'thinking'
  | 'fetching_availability'
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

export type ClinicOption = {
  id: string
  name: string
  address?: string | null
}

export type TreatmentOption = {
  id: string
  name: string
  durationMinutes: number
}

export type ProfessionalOption = {
  id: string
  fullName: string
  specialty?: string | null
}

export type SlotOption = {
  clinicId: string
  treatmentId: string
  treatmentName: string
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

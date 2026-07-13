import type { BookingSource } from '@/lib/booking/phrases'

export type BookingPatientContext = {
  fullName?: string
  email?: string
  phone?: string
  dni?: string
}

export type BookingCalendarModalProps = {
  isOpen: boolean
  onClose: () => void
  clinicId?: string | null
  patientContext?: BookingPatientContext
  source: BookingSource
}

export type PublicBookingSlot = {
  clinicId: string
  clinicName?: string
  treatmentId: string
  treatmentName: string
  professionalId: string | null
  professionalName: string
  startsAt: string
  endsAt: string
  label: string
}

export type BookingCatalogClinic = { id: string; name: string; address?: string | null }
export type BookingCatalogTreatment = { id: string; clinicId: string; name: string; durationMinutes: number }
export type BookingCatalogProfessional = { id: string; clinicId: string; fullName: string; specialty?: string | null }

export type BookingCalendarAction = {
  clinicId: string | null
  clinicName: string
}

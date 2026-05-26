import type { PatientFormValue } from './types'

export type PatientFormErrors = Partial<Record<keyof PatientFormValue, string>>

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^[+]?[\d\s()-]{8,}$/

export function validatePatientForm(value: PatientFormValue): PatientFormErrors | null {
  const errors: PatientFormErrors = {}
  if (!value.fullName.trim()) errors.fullName = 'Introduce tu nombre.'
  if (!EMAIL_RE.test(value.email.trim())) errors.email = 'Introduce un email válido.'
  if (!PHONE_RE.test(value.phone.trim())) errors.phone = 'Introduce un teléfono válido.'
  return Object.keys(errors).length ? errors : null
}

export const BOOKING_PHRASES = [
  'quiero pedir cita',
  'pedir cita',
  'necesito una consulta',
  'reservar cita',
  'reservar una cita',
  'que horarios hay',
  'qué horarios hay',
  'quiero cita para',
  'abrir calendario',
  'ver disponibilidad',
  'ver calendario',
  'hacer una cita',
  'agendar cita',
  'solicitar cita'
] as const

export type BookingSource = 'patient_portal' | 'ai_assistant'

const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()

export const matchesBookingPhrase = (message: string) => {
  const normalized = normalize(message)
  if (!normalized) return false
  return BOOKING_PHRASES.some((phrase) => normalized.includes(normalize(phrase)))
}

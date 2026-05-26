import type { APIRoute } from 'astro'
import { format, parseISO } from 'date-fns'
import { clientIp } from '@/lib/audit/sanitize'
import { logAiBookingMonitor } from '@/lib/ai/bookingMonitoring'
import { created, fail } from '@/lib/http'
import {
  createOrLinkPatient,
  createPublicAppointmentBooking,
  getAvailableSlotsForPublicBooking,
  getPublicClinics,
  getPublicProfessionals,
  getPublicTreatments,
  monitorAiBookingError,
  sendAppointmentConfirmation
} from '@/lib/services/publicAiBooking'
import { hasSupabaseConfig } from '@/lib/supabaseServer'
import { publicBookingCreateSchema } from '@/lib/validators'

export const prerender = false

const WINDOW_MS = 60_000
const bookRate = new Map<string, number[]>()

function isRateLimited(key: string, max: number) {
  const now = Date.now()
  const events = (bookRate.get(key) ?? []).filter((time) => now - time < WINDOW_MS)
  events.push(now)
  bookRate.set(key, events)
  return events.length > max
}

export const POST: APIRoute = async ({ request }) => {
  if (!hasSupabaseConfig()) return fail('Reserva pública no disponible.', 503)
  const ip = clientIp(request) ?? 'unknown'
  if (isRateLimited(`book:${ip}`, 8)) {
    return fail('Se alcanzó el límite de intentos de reserva.', 429)
  }

  try {
    const body = await request.json()
    const parsed = publicBookingCreateSchema.safeParse(body)
    if (!parsed.success) return fail('Datos de reserva inválidos.', 422, parsed.error.flatten())

    const payload = parsed.data
    const stillAvailable = await getAvailableSlotsForPublicBooking({
      clinicId: payload.clinicId,
      treatmentId: payload.treatmentId,
      professionalId: payload.professionalId,
      dateRange: {
        from: payload.startsAt.slice(0, 10),
        to: payload.startsAt.slice(0, 10)
      },
      preferredTime: 'any'
    })
    const slotOk = stillAvailable.some(
      (slot) =>
        slot.startsAt === payload.startsAt &&
        slot.endsAt === payload.endsAt &&
        slot.professionalId === payload.professionalId
    )
    if (!slotOk) {
      return fail('Ese hueco ya no está disponible.', 409)
    }

    const patient = await createOrLinkPatient({
      clinicId: payload.clinicId,
      fullName: payload.patient.fullName,
      email: payload.patient.email,
      phone: payload.patient.phone,
      dni: payload.patient.dni
    })

    const appointment = await createPublicAppointmentBooking({
      clinicId: payload.clinicId,
      treatmentId: payload.treatmentId,
      professionalId: payload.professionalId,
      startsAt: payload.startsAt,
      endsAt: payload.endsAt,
      patientId: patient.patientId,
      patientName: patient.patientName,
      notes: payload.reason
    })

    const [clinics, treatments, professionals] = await Promise.all([
      getPublicClinics(),
      getPublicTreatments(payload.clinicId),
      getPublicProfessionals(payload.clinicId)
    ])
    const clinicName = clinics.find((item) => item.id === payload.clinicId)?.name ?? 'AgendaClinic'
    const treatmentName =
      treatments.find((item) => item.id === payload.treatmentId)?.name ?? 'Tratamiento dental'
    const professionalName =
      professionals.find((item) => item.id === payload.professionalId)?.fullName ?? 'Profesional'

    await sendAppointmentConfirmation({
      appointmentId: appointment.id,
      patientId: patient.patientId,
      patientName: patient.patientName,
      patientEmail: patient.email,
      patientPhone: patient.phone,
      clinicName,
      treatmentName,
      professionalName,
      date: format(parseISO(payload.startsAt), 'yyyy-MM-dd'),
      time: format(parseISO(payload.startsAt), 'HH:mm')
    })

    await logAiBookingMonitor('ai.appointment_confirmed', {
      appointmentId: appointment.id,
      clinicId: payload.clinicId,
      patientId: patient.patientId
    })

    return created({
      appointmentId: appointment.id,
      patientId: patient.patientId,
      hasPortalAccount: patient.hasAccount
    })
  } catch (error) {
    monitorAiBookingError('create', error)
    await logAiBookingMonitor('ai.booking_failed', { scope: 'create' })
    const message = error instanceof Error ? error.message : 'No se pudo reservar la cita.'
    if (message.includes('no está disponible')) return fail(message, 409)
    return fail('No se pudo reservar la cita. Inténtalo de nuevo.', 500)
  }
}

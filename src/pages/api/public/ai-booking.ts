import type { APIRoute } from 'astro'
import { format, parseISO } from 'date-fns'
import { clientIp } from '@/lib/audit/sanitize'
import { created, fail, ok } from '@/lib/http'
import {
  buildAvailabilityQuery,
  createOrLinkPatient,
  createPublicAppointmentBooking,
  extractTreatmentIntent,
  generateAssistantResponse,
  getAvailableSlotsForPublicBooking,
  getPublicClinics,
  getPublicProfessionals,
  getPublicTreatments,
  monitorAiBookingError,
  parseBookingIntent,
  sendAppointmentConfirmation
} from '@/lib/services/publicAiBooking'
import { hasSupabaseConfig } from '@/lib/supabaseServer'
import { publicAiBookingActionSchema } from '@/lib/validators'

export const prerender = false

const WINDOW_MS = 60_000
const messageRate = new Map<string, number[]>()
const bookingRate = new Map<string, number[]>()

function isRateLimited(key: string, store: Map<string, number[]>, max: number) {
  const now = Date.now()
  const events = (store.get(key) ?? []).filter((time) => now - time < WINDOW_MS)
  events.push(now)
  store.set(key, events)
  return events.length > max
}

export const GET: APIRoute = async ({ url }) => {
  if (!hasSupabaseConfig()) {
    return ok({
      available: false,
      endpoint: '/api/public/ai-booking'
    })
  }
  try {
    const clinics = await getPublicClinics()
    const selectedClinicId = url.searchParams.get('clinicId') ?? clinics[0]?.id
    const firstClinicId = selectedClinicId
    const treatments = firstClinicId ? await getPublicTreatments(firstClinicId) : []
    const professionals = firstClinicId ? await getPublicProfessionals(firstClinicId) : []
    return ok({
      available: true,
      endpoint: '/api/public/ai-booking',
      clinics,
      treatments,
      professionals
    })
  } catch (error) {
    monitorAiBookingError('bootstrap.get', error)
    return fail('No se pudo inicializar el asistente de citas.', 500)
  }
}

export const POST: APIRoute = async ({ request }) => {
  if (!hasSupabaseConfig()) return fail('El asistente de citas no está disponible temporalmente.', 503)
  const ip = clientIp(request) ?? 'unknown'
  try {
    const body = await request.json()
    const parsed = publicAiBookingActionSchema.safeParse(body)
    if (!parsed.success) return fail('Petición del asistente inválida.', 422, parsed.error.flatten())

    if (parsed.data.action === 'bootstrap') {
      const clinics = await getPublicClinics()
      return ok({ clinics })
    }

    if (parsed.data.action === 'message') {
      if (isRateLimited(`msg:${ip}`, messageRate, 25)) {
        return fail('Has superado el límite de mensajes. Espera unos segundos e inténtalo de nuevo.', 429)
      }
      const intent = parseBookingIntent(parsed.data.payload.message)
      const treatmentHint = extractTreatmentIntent(parsed.data.payload.message)
      return ok({
        intent,
        response: generateAssistantResponse({
          intent,
          treatmentResolved: treatmentHint ?? undefined,
          needsClinic: !parsed.data.payload.clinicId,
          needsProfessional: !parsed.data.payload.professionalId,
          needsDate: true
        }),
        suggestion: treatmentHint
      })
    }

    if (parsed.data.action === 'slots') {
      if (isRateLimited(`slots:${ip}`, messageRate, 40)) {
        return fail('Demasiadas consultas de disponibilidad. Espera unos segundos.', 429)
      }
      const intent = parseBookingIntent(
        `${parsed.data.payload.preferredTime} ${parsed.data.payload.fromDate} ${parsed.data.payload.toDate}`
      )
      const query = buildAvailabilityQuery(intent, {
        clinicId: parsed.data.payload.clinicId,
        treatmentId: parsed.data.payload.treatmentId,
        professionalId: parsed.data.payload.professionalId,
        dateRange: {
          from: parsed.data.payload.fromDate,
          to: parsed.data.payload.toDate
        }
      })
      const slots = await getAvailableSlotsForPublicBooking(query)
      return ok({ slots, count: slots.length })
    }

    if (isRateLimited(`book:${ip}`, bookingRate, 8)) {
      return fail('Se alcanzó el límite de intentos de reserva. Espera un minuto.', 429)
    }

    const payload = parsed.data.payload
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

    return created({
      appointmentId: appointment.id,
      patientId: patient.patientId,
      hasPortalAccount: patient.hasAccount
    })
  } catch (error) {
    monitorAiBookingError('post', error)
    const message = error instanceof Error ? error.message : 'No se pudo reservar la cita.'
    if (message.includes('no está disponible')) return fail(message, 409)
    return fail(message, 500)
  }
}

import type { APIRoute } from 'astro'
import { clientIp } from '@/lib/audit/sanitize'
import { logAiBookingMonitor } from '@/lib/ai/bookingMonitoring'
import { fail, ok } from '@/lib/http'
import {
  getAvailableSlotsForPublicBooking,
  getPublicClinics,
  monitorAiBookingError
} from '@/lib/services/publicAiBooking'
import { hasSupabaseConfig } from '@/lib/supabaseServer'
import { publicBookingSlotsRequestSchema } from '@/lib/validators'

export const prerender = false

const WINDOW_MS = 60_000
const slotRate = new Map<string, number[]>()

function isRateLimited(key: string, max: number) {
  const now = Date.now()
  const events = (slotRate.get(key) ?? []).filter((time) => now - time < WINDOW_MS)
  events.push(now)
  slotRate.set(key, events)
  return events.length > max
}

export const POST: APIRoute = async ({ request }) => {
  if (!hasSupabaseConfig()) return fail('Reserva pública no disponible.', 503)
  const ip = clientIp(request) ?? 'unknown'
  if (isRateLimited(`slots:${ip}`, 40)) {
    return fail('Demasiadas consultas de disponibilidad.', 429)
  }

  try {
    const body = await request.json()
    const parsed = publicBookingSlotsRequestSchema.safeParse(body)
    if (!parsed.success) return fail('Consulta de disponibilidad inválida.', 422, parsed.error.flatten())

    await logAiBookingMonitor('ai.availability_requested', {
      clinicId: parsed.data.clinicId,
      treatmentId: parsed.data.treatmentId
    })

    const slots = await getAvailableSlotsForPublicBooking({
      clinicId: parsed.data.clinicId,
      treatmentId: parsed.data.treatmentId,
      professionalId: parsed.data.professionalId,
      dateRange: { from: parsed.data.fromDate, to: parsed.data.toDate },
      preferredTime: parsed.data.preferredTime
    })

    const clinics = await getPublicClinics()
    const enriched = slots.map((slot) => ({
      ...slot,
      clinicName: clinics.find((c) => c.id === slot.clinicId)?.name ?? ''
    }))

    if (!enriched.length) {
      await logAiBookingMonitor('ai.no_slots_found', { clinicId: parsed.data.clinicId })
    }

    return ok({ slots: enriched, count: enriched.length })
  } catch (error) {
    monitorAiBookingError('available-slots', error)
    return fail('No se pudo comprobar la disponibilidad.', 500)
  }
}

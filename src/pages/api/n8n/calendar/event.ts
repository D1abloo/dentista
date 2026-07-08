import type { APIRoute } from 'astro'
import { requireN8nService } from '@/lib/n8n/requireService'
import { ok, fail } from '@/lib/http'
import { buildCalendarEventPayload } from '@/lib/services/n8nAutomationNotifications'
import { getSupabaseAdmin, hasSupabaseConfig } from '@/lib/supabaseServer'
import { n8nCalendarEventSchema } from '@/lib/validators'

export const prerender = false

export const POST: APIRoute = async (context) => {
  const denied = requireN8nService(context)
  if (denied) return denied
  if (!hasSupabaseConfig()) return fail('Calendario no disponible.', 503)
  try {
    const body = await context.request.json()
    const parsed = n8nCalendarEventSchema.safeParse(body)
    if (!parsed.success) return fail('Payload inválido.', 422, parsed.error.flatten())

    const db = getSupabaseAdmin()
    const { data: row } = await db
      .from('appointments')
      .select('id, clinic_id, patient_id, dentist_id, treatment_id, starts_at, ends_at, status, room_name, notes')
      .eq('id', parsed.data.appointmentId)
      .eq('clinic_id', parsed.data.clinicId)
      .maybeSingle()
    if (!row) return fail('Cita no encontrada.', 404)

    const { data: patient } = row.patient_id
      ? await db.from('profiles').select('full_name').eq('id', row.patient_id).maybeSingle()
      : { data: null }
    const { data: dentist } = await db.from('dentists').select('name').eq('id', row.dentist_id).maybeSingle()
    const { data: treatment } = await db.from('treatments').select('name').eq('id', row.treatment_id).maybeSingle()
    const { data: clinic } = await db.from('clinics').select('name, address').eq('id', row.clinic_id).maybeSingle()

    const payload = buildCalendarEventPayload({
      id: String(row.id),
      clinicId: String(row.clinic_id),
      patientId: String(row.patient_id),
      patientName: patient?.full_name ? String(patient.full_name) : 'Paciente',
      dentistId: String(row.dentist_id),
      dentistName: dentist?.name ? String(dentist.name) : 'Profesional',
      treatmentName: treatment?.name ? String(treatment.name) : 'Tratamiento',
      clinicName: clinic?.name ? String(clinic.name) : 'Clínica',
      clinicAddress: clinic?.address ? String(clinic.address) : '',
      startsAt: String(row.starts_at),
      endsAt: String(row.ends_at),
      status: String(row.status),
      roomName: String(row.room_name ?? 'Gabinete'),
      notes: row.notes ? String(row.notes) : undefined
    })

    return ok(payload, {
      message: 'Payload listo para n8n Google Calendar.',
      hint: 'Conecta credenciales Google Calendar en n8n y mapea summary, start, end, location.'
    })
  } catch (error) {
    return fail('No se pudo generar el evento de calendario.', 500, error instanceof Error ? error.message : error)
  }
}

import { addHours, isAfter, parseISO } from 'date-fns'
import { logEvent } from '@/lib/audit/logEvent'
import {
  createRawVerificationToken,
  hashVerificationToken,
  signVerificationPayload,
  verificationExpMs,
  verificationExpiresAt,
  verifySignedPayload
} from '@/lib/auth/patientVerificationToken'
import { invalidateCache } from '@/lib/cache'
import { logError } from '@/lib/logger'
import { getAvailableSlotsForPublicBooking } from '@/lib/services/publicAiBooking'
import { getSupabaseAdmin, hasSupabaseConfig, isDemoMode } from '@/lib/supabaseServer'
import type { AppointmentStatus } from '@/lib/types'

export type PublicPatientAppointment = {
  id: string
  clinicId: string
  clinicName: string
  clinicAddress: string | null
  treatmentId: string
  treatmentName: string
  professionalId: string
  professionalName: string
  startsAt: string
  endsAt: string
  status: AppointmentStatus
  statusLabel: string
  canCancel: boolean
  canReschedule: boolean
}

const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Confirmada',
  pending: 'Pendiente',
  cancelled: 'Cancelada',
  completed: 'Completada',
  no_show: 'No asistió'
}

function requireDb() {
  if (!hasSupabaseConfig()) throw new Error('Gestión de citas no disponible sin Supabase.')
  return getSupabaseAdmin()
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, '')
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

function statusLabel(status: string) {
  return STATUS_LABELS[status] ?? status
}

function canModifyOnline(startsAt: string, status: string) {
  if (!['pending', 'confirmed'].includes(status)) return false
  return isAfter(parseISO(startsAt), addHours(new Date(), 2))
}

export async function findPatientProfilesByEmailPhone(email: string, phone: string) {
  const db = requireDb()
  const normalizedEmail = normalizeEmail(email)
  const normalizedPhone = normalizePhone(phone)
  const { data, error } = await db
    .from('profiles')
    .select('id, clinic_id, full_name, email, phone')
    .eq('role', 'patient')
    .ilike('email', normalizedEmail)
  if (error) throw error
  return (data ?? []).filter((row) => normalizePhone(String(row.phone ?? '')) === normalizedPhone)
}

export async function verifyPatientIdentity(input: {
  email?: string
  phone?: string
  patientId?: string
  verificationToken?: string
}) {
  if (input.verificationToken) {
    const payload = verifySignedPayload(input.verificationToken)
    if (!payload) throw new Error('Verificación expirada o inválida. Identifícate de nuevo.')
    return { patientIds: payload.patientIds, email: payload.email, verificationToken: input.verificationToken }
  }

  if (input.patientId && input.email) {
    const token = signVerificationPayload({
      patientIds: [input.patientId],
      email: normalizeEmail(input.email),
      exp: verificationExpMs()
    })
    return { patientIds: [input.patientId], email: normalizeEmail(input.email), verificationToken: token }
  }

  if (!input.email?.trim() || !input.phone?.trim()) {
    throw new Error('Introduce email y teléfono para verificar tu identidad.')
  }

  const matches = await findPatientProfilesByEmailPhone(input.email, input.phone)
  if (!matches.length) {
    throw new Error('No hemos encontrado un paciente con esos datos. Revisa email y teléfono.')
  }

  const patientIds = matches.map((row) => row.id)
  const email = normalizeEmail(input.email)
  const raw = createRawVerificationToken()
  const tokenHash = hashVerificationToken(raw)
  const db = requireDb()

  await Promise.all(
    matches.map((row) =>
      db.from('patient_verification_tokens').insert({
        patient_id: row.id,
        email,
        phone: input.phone!.trim(),
        token_hash: tokenHash,
        expires_at: verificationExpiresAt()
      })
    )
  )

  await logEvent({
    event_type: 'patient.verification_requested',
    module: 'patient',
    action: 'verification_requested',
    patient_id: patientIds[0],
    resource_type: 'patient',
    resource_id: patientIds[0],
    metadata: { channel: 'ai_assistant', count: patientIds.length }
  })

  const signed = signVerificationPayload({ patientIds, email, exp: verificationExpMs() })
  return { patientIds, email, verificationToken: signed, rawToken: raw }
}

async function assertVerification(verificationToken: string) {
  const payload = verifySignedPayload(verificationToken)
  if (!payload) throw new Error('Verificación expirada. Identifícate de nuevo.')
  return payload
}

export async function getPatientAppointments(input: {
  verificationToken: string
  upcomingOnly?: boolean
}): Promise<PublicPatientAppointment[]> {
  const { patientIds } = await assertVerification(input.verificationToken)
  if (isDemoMode() || !hasSupabaseConfig()) return []

  const db = requireDb()
  const now = new Date().toISOString()
  let query = db
    .from('appointments')
    .select(
      'id, clinic_id, patient_id, dentist_id, treatment_id, starts_at, ends_at, status, dentists(name), treatments(name)'
    )
    .in('patient_id', patientIds)
    .eq('visible_to_patient', true)
    .order('starts_at', { ascending: true })

  if (input.upcomingOnly !== false) {
    query = query.gte('starts_at', now).in('status', ['pending', 'confirmed'])
  }

  const { data, error } = await query
  if (error) throw error

  const rows = data ?? []
  const clinicIds = [...new Set(rows.map((row: { clinic_id: string }) => row.clinic_id))]
  const { data: clinics } = await db.from('clinics').select('id, name, address').in('id', clinicIds)
  const clinicMap = new Map((clinics ?? []).map((c) => [c.id, c]))

  return rows.map((row: Record<string, unknown>) => {
    const dentist = row.dentists as { name?: string } | null
    const treatment = row.treatments as { name?: string } | null
    const startsAt = String(row.starts_at)
    const status = String(row.status)
    return {
      id: String(row.id),
      clinicId: String(row.clinic_id),
      clinicName: clinicMap.get(String(row.clinic_id))?.name ?? 'Clínica',
      clinicAddress: clinicMap.get(String(row.clinic_id))?.address ?? null,
      treatmentId: String(row.treatment_id),
      treatmentName: treatment?.name ?? 'Tratamiento',
      professionalId: String(row.dentist_id),
      professionalName: dentist?.name ?? 'Profesional',
      startsAt,
      endsAt: String(row.ends_at),
      status: status as AppointmentStatus,
      statusLabel: statusLabel(status),
      canCancel: canModifyOnline(startsAt, status),
      canReschedule: canModifyOnline(startsAt, status)
    }
  })
}

export async function getNextPatientAppointment(verificationToken: string) {
  const list = await getPatientAppointments({ verificationToken, upcomingOnly: true })
  return list[0] ?? null
}

export async function cancelAppointmentPublic(input: {
  verificationToken: string
  appointmentId: string
  clinicId: string
}) {
  const { patientIds, email } = await assertVerification(input.verificationToken)
  const db = requireDb()

  const { data: appointment, error } = await db
    .from('appointments')
    .select('id, patient_id, clinic_id, status, starts_at')
    .eq('id', input.appointmentId)
    .eq('clinic_id', input.clinicId)
    .single()
  if (error || !appointment) throw new Error('Cita no encontrada.')
  if (!patientIds.includes(appointment.patient_id)) {
    throw new Error('No tienes permiso para cancelar esta cita.')
  }
  if (!canModifyOnline(appointment.starts_at, appointment.status)) {
    throw new Error('Esta cita no se puede cancelar online. Contacta con la clínica.')
  }

  const { error: updateError } = await db
    .from('appointments')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancelled_by: 'public_ai_assistant',
      cancellation_reason: 'Cancelada por el paciente desde el asistente',
      updated_at: new Date().toISOString()
    })
    .eq('id', input.appointmentId)
    .eq('clinic_id', input.clinicId)

  if (updateError) throw updateError
  await invalidateCache(`clinic:${input.clinicId}:`)
  await logEvent({
    event_type: 'appointment.cancelled_by_ai',
    module: 'appointments',
    action: 'cancel_public_ai',
    clinic_id: input.clinicId,
    resource_type: 'appointment',
    resource_id: input.appointmentId,
    metadata: { clinicId: input.clinicId, email }
  })
  return { cancelled: true }
}

export async function rescheduleAppointmentPublic(input: {
  verificationToken: string
  appointmentId: string
  clinicId: string
  startsAt: string
  endsAt: string
  professionalId: string
}) {
  const { patientIds, email } = await assertVerification(input.verificationToken)
  const db = requireDb()

  const { data: appointment, error } = await db
    .from('appointments')
    .select('id, patient_id, clinic_id, treatment_id, status, starts_at')
    .eq('id', input.appointmentId)
    .eq('clinic_id', input.clinicId)
    .single()
  if (error || !appointment) throw new Error('Cita no encontrada.')
  if (!patientIds.includes(appointment.patient_id)) {
    throw new Error('No tienes permiso para cambiar esta cita.')
  }
  if (!canModifyOnline(appointment.starts_at, appointment.status)) {
    throw new Error('Esta cita no se puede cambiar online. Contacta con la clínica.')
  }

  const slots = await getAvailableSlotsForPublicBooking({
    clinicId: input.clinicId,
    treatmentId: appointment.treatment_id,
    professionalId: input.professionalId,
    dateRange: {
      from: input.startsAt.slice(0, 10),
      to: input.startsAt.slice(0, 10)
    },
    preferredTime: 'any'
  })
  const ok = slots.some(
    (slot) =>
      slot.startsAt === input.startsAt &&
      slot.endsAt === input.endsAt &&
      slot.professionalId === input.professionalId
  )
  if (!ok) throw new Error('Ese hueco ya no está disponible. Te muestro alternativas.')

  const { error: updateError } = await db
    .from('appointments')
    .update({
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      dentist_id: input.professionalId,
      status: 'confirmed',
      rescheduled_from_id: appointment.id,
      rescheduled_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', input.appointmentId)
    .eq('clinic_id', input.clinicId)

  if (updateError) throw updateError
  await invalidateCache(`clinic:${input.clinicId}:`)
  await logEvent({
    event_type: 'appointment.rescheduled_by_ai',
    module: 'appointments',
    action: 'reschedule_public_ai',
    clinic_id: input.clinicId,
    resource_type: 'appointment',
    resource_id: input.appointmentId,
    metadata: { clinicId: input.clinicId, email, startsAt: input.startsAt }
  })
  return { rescheduled: true }
}

export async function sendPatientSecureLink(input: { email: string; phone: string }) {
  const result = await verifyPatientIdentity({ email: input.email, phone: input.phone })
  await logEvent({
    event_type: 'patient.verification_completed',
    module: 'patient',
    action: 'verification_completed',
    patient_id: result.patientIds[0],
    resource_type: 'patient',
    resource_id: result.patientIds[0],
    metadata: { channel: 'secure_link' }
  })
  return {
    sent: true,
    message: 'Si tus datos son correctos, ya puedes continuar con la verificación en este asistente.',
    verificationToken: result.verificationToken
  }
}

export function monitorPatientAppointmentsError(scope: string, error: unknown) {
  logError(`patient-appointments.${scope}`, error)
}

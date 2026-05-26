import { addMinutes, format, isAfter, parseISO, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { invalidateCache } from '@/lib/cache'
import { logEvent } from '@/lib/audit/logEvent'
import { logError } from '@/lib/logger'
import { sendAppointmentNotifications } from '@/lib/notifications'
import { allocateNextNhc } from '@/lib/services/nhc'
import { getSupabaseAdmin, hasSupabaseConfig } from '@/lib/supabaseServer'

type PreferredTime = 'morning' | 'afternoon' | 'any'
type UrgencyLevel = 'low' | 'normal' | 'high'

export type BookingIntent = {
  rawMessage: string
  treatmentQuery?: string
  professionalQuery?: string
  preferredDateLabel?: string
  preferredTime: PreferredTime
  urgency: UrgencyLevel
}

export type PublicBookingClinic = {
  id: string
  name: string
  address: string | null
  tenantId: string | null
}

export type PublicBookingTreatment = {
  id: string
  clinicId: string
  name: string
  durationMinutes: number
}

export type PublicBookingProfessional = {
  id: string
  clinicId: string
  fullName: string
  specialty: string | null
}

export type PublicBookingSlot = {
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

export type PublicAvailabilityQuery = {
  clinicId: string
  treatmentId: string
  professionalId?: string
  dateRange: { from: string; to: string }
  preferredTime?: PreferredTime
}

function requireDb() {
  if (!hasSupabaseConfig()) throw new Error('Reserva asistida no disponible sin Supabase.')
  return getSupabaseAdmin()
}

function normalize(text: string) {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

function toPreferredTime(value?: string): PreferredTime {
  if (!value) return 'any'
  if (value === 'morning' || value === 'afternoon' || value === 'any') return value
  return 'any'
}

function slotMatchesPreferredTime(isoDate: string, preferredTime: PreferredTime) {
  if (preferredTime === 'any') return true
  const hour = parseISO(isoDate).getHours()
  if (preferredTime === 'morning') return hour < 14
  return hour >= 14
}

function overlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd
}

function isSlotBlockedByBlock(
  block: {
    starts_at: string
    ends_at: string
    dentist_id: string | null
    applies_to_all_professionals?: boolean | null
    dentist_ids?: string[] | null
  },
  dentistId: string,
  slotStart: Date,
  slotEnd: Date
) {
  const blockStart = new Date(block.starts_at)
  const blockEnd = new Date(block.ends_at)
  if (!overlap(slotStart, slotEnd, blockStart, blockEnd)) return false
  if (block.applies_to_all_professionals) return true
  if (block.dentist_id && block.dentist_id === dentistId) return true
  if (Array.isArray(block.dentist_ids) && block.dentist_ids.includes(dentistId)) return true
  return false
}

export function parseBookingIntent(message: string): BookingIntent {
  const normalized = normalize(message)
  return {
    rawMessage: message,
    treatmentQuery: extractTreatmentIntent(message) ?? undefined,
    professionalQuery: extractProfessionalPreference(message) ?? undefined,
    preferredDateLabel: extractDatePreference(message) ?? undefined,
    preferredTime: normalized.includes('tarde')
      ? 'afternoon'
      : normalized.includes('manana') || normalized.includes('mañana')
        ? 'morning'
        : 'any',
    urgency: extractUrgencyLevel(message)
  }
}

export function extractTreatmentIntent(message: string): string | null {
  const normalized = normalize(message)
  const map = [
    'limpieza dental',
    'revision',
    'revisión',
    'urgencia',
    'blanqueamiento',
    'ortodoncia',
    'endodoncia',
    'dolor dental'
  ]
  const found = map.find((item) => normalized.includes(normalize(item)))
  return found ?? null
}

export function extractDatePreference(message: string): string | null {
  const normalized = normalize(message)
  if (normalized.includes('manana') || normalized.includes('mañana')) return 'Mañana'
  if (normalized.includes('hoy')) return 'Hoy'
  if (normalized.includes('esta semana')) return 'Esta semana'
  if (normalized.includes('proxima semana') || normalized.includes('próxima semana')) return 'Próxima semana'
  if (normalized.includes('viernes')) return 'Viernes'
  return null
}

export function extractProfessionalPreference(message: string): string | null {
  const normalized = normalize(message)
  const doctorMatch = normalized.match(/(?:dra?\.?\s+)?([a-z]+\s+[a-z]+)/)
  if (doctorMatch?.[1] && normalized.includes('dra')) return `Dra. ${doctorMatch[1]}`
  if (doctorMatch?.[1] && normalized.includes('dr')) return `Dr. ${doctorMatch[1]}`
  return null
}

export function extractUrgencyLevel(message: string): UrgencyLevel {
  const normalized = normalize(message)
  if (normalized.includes('urgencia') || normalized.includes('me duele') || normalized.includes('dolor')) return 'high'
  if (normalized.includes('cuanto antes') || normalized.includes('primer hueco')) return 'high'
  return 'normal'
}

export function buildAvailabilityQuery(intent: BookingIntent, base: Omit<PublicAvailabilityQuery, 'preferredTime'>) {
  return {
    ...base,
    preferredTime: intent.preferredTime
  } satisfies PublicAvailabilityQuery
}

export async function getPublicClinics() {
  const db = requireDb()
  const { data, error } = await db
    .from('clinics')
    .select('id, name, address, tenant_id, status')
    .eq('status', 'active')
    .order('name', { ascending: true })
  if (error) throw error

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    address: row.address,
    tenantId: row.tenant_id ?? null
  })) satisfies PublicBookingClinic[]
}

export async function getPublicTreatments(clinicId: string) {
  const db = requireDb()
  const { data, error } = await db
    .from('treatments')
    .select('id, clinic_id, name, duration_minutes')
    .eq('clinic_id', clinicId)
    .eq('active', true)
    .order('name', { ascending: true })
  if (error) throw error
  return (data ?? []).map((row) => ({
    id: row.id,
    clinicId: row.clinic_id,
    name: row.name,
    durationMinutes: row.duration_minutes
  })) satisfies PublicBookingTreatment[]
}

export async function getPublicProfessionals(clinicId: string) {
  const db = requireDb()
  const { data, error } = await db
    .from('dentists')
    .select('id, clinic_id, name, specialty')
    .eq('clinic_id', clinicId)
    .eq('active', true)
    .order('name', { ascending: true })
  if (error) throw error
  return (data ?? []).map((row) => ({
    id: row.id,
    clinicId: row.clinic_id,
    fullName: row.name,
    specialty: row.specialty
  })) satisfies PublicBookingProfessional[]
}

export async function getAvailableSlotsForPublicBooking(query: PublicAvailabilityQuery) {
  const db = requireDb()
  const treatmentRows = await getPublicTreatments(query.clinicId)
  const treatment = treatmentRows.find((item) => item.id === query.treatmentId)
  if (!treatment) return []

  const professionals = await getPublicProfessionals(query.clinicId)
  const candidateProfessionals = query.professionalId
    ? professionals.filter((item) => item.id === query.professionalId)
    : professionals

  if (!candidateProfessionals.length) return []

  const from = new Date(`${query.dateRange.from}T00:00:00`)
  const to = new Date(`${query.dateRange.to}T23:59:59`)
  const now = new Date()
  const { data: rules, error: rulesError } = await db
    .from('availability_rules')
    .select('id, clinic_id, dentist_id, weekday, starts_at, ends_at, slot_minutes, active')
    .eq('clinic_id', query.clinicId)
    .eq('active', true)
  if (rulesError) throw rulesError

  const { data: blocks, error: blocksError } = await db
    .from('schedule_blocks')
    .select('starts_at, ends_at, dentist_id, applies_to_all_professionals, dentist_ids')
    .eq('clinic_id', query.clinicId)
    .gte('ends_at', from.toISOString())
    .lte('starts_at', to.toISOString())
  if (blocksError) throw blocksError

  const { data: appointments, error: appointmentsError } = await db
    .from('appointments')
    .select('dentist_id, starts_at, ends_at, status')
    .eq('clinic_id', query.clinicId)
    .in('status', ['pending', 'confirmed'])
    .gte('ends_at', from.toISOString())
    .lte('starts_at', to.toISOString())
  if (appointmentsError) throw appointmentsError

  const output: PublicBookingSlot[] = []
  for (let d = startOfDay(from); d <= to; d = addMinutes(d, 60 * 24)) {
    const weekday = d.getDay()
    const yyyyMmDd = format(d, 'yyyy-MM-dd')
    const dayRules = (rules ?? []).filter((rule) => rule.weekday === weekday)
    for (const professional of candidateProfessionals) {
      const professionalRules = dayRules.filter((rule) => !rule.dentist_id || rule.dentist_id === professional.id)
      for (const rule of professionalRules) {
        let cursor = new Date(`${yyyyMmDd}T${String(rule.starts_at).slice(0, 8)}`)
        const ruleEnd = new Date(`${yyyyMmDd}T${String(rule.ends_at).slice(0, 8)}`)
        while (cursor < ruleEnd) {
          const slotEnd = addMinutes(cursor, treatment.durationMinutes)
          if (slotEnd > ruleEnd) break
          if (isAfter(now, cursor)) {
            cursor = addMinutes(cursor, rule.slot_minutes ?? 30)
            continue
          }
          if (!slotMatchesPreferredTime(cursor.toISOString(), toPreferredTime(query.preferredTime))) {
            cursor = addMinutes(cursor, rule.slot_minutes ?? 30)
            continue
          }

          const blocked = (blocks ?? []).some((block) =>
            isSlotBlockedByBlock(block, professional.id, cursor, slotEnd)
          )
          if (blocked) {
            cursor = addMinutes(cursor, rule.slot_minutes ?? 30)
            continue
          }
          const occupied = (appointments ?? []).some((appointment) => {
            if (appointment.dentist_id !== professional.id) return false
            const apptStart = new Date(appointment.starts_at)
            const apptEnd = new Date(appointment.ends_at)
            return overlap(cursor, slotEnd, apptStart, apptEnd)
          })
          if (!occupied) {
            output.push({
              clinicId: query.clinicId,
              treatmentId: treatment.id,
              treatmentName: treatment.name,
              durationMinutes: treatment.durationMinutes,
              professionalId: professional.id,
              professionalName: professional.fullName,
              startsAt: cursor.toISOString(),
              endsAt: slotEnd.toISOString(),
              label: `${format(cursor, "EEEE dd/MM · HH:mm", { locale: es })} · ${professional.fullName}`
            })
          }
          cursor = addMinutes(cursor, rule.slot_minutes ?? 30)
        }
      }
    }
  }
  return output.slice(0, 18)
}

type PatientData = {
  clinicId: string
  fullName: string
  email: string
  phone: string
  dni?: string
}

export async function createOrLinkPatient(input: PatientData) {
  const db = requireDb()
  const email = input.email.trim().toLowerCase()
  const { data: existing, error: existingError } = await db
    .from('profiles')
    .select('id, full_name, email, phone')
    .eq('clinic_id', input.clinicId)
    .eq('role', 'patient')
    .ilike('email', email)
    .maybeSingle()
  if (existingError) throw existingError
  if (existing) {
    return {
      patientId: existing.id,
      patientName: existing.full_name,
      email: existing.email,
      phone: existing.phone ?? input.phone,
      hasAccount: true
    }
  }

  const { data: clinic, error: clinicError } = await db
    .from('clinics')
    .select('tenant_id')
    .eq('id', input.clinicId)
    .single()
  if (clinicError) throw clinicError

  const nhc = await allocateNextNhc(input.clinicId)
  const { data: created, error: createdError } = await db
    .from('profiles')
    .insert({
      clinic_id: input.clinicId,
      tenant_id: clinic.tenant_id ?? null,
      role: 'patient',
      full_name: input.fullName.trim(),
      email,
      phone: input.phone.trim(),
      dni: input.dni?.trim() || null,
      nhc
    })
    .select('id, full_name, email, phone')
    .single()
  if (createdError) throw createdError

  return {
    patientId: created.id,
    patientName: created.full_name,
    email: created.email,
    phone: created.phone ?? input.phone,
    hasAccount: false
  }
}

type CreatePublicAppointmentInput = {
  clinicId: string
  treatmentId: string
  professionalId: string
  startsAt: string
  endsAt: string
  patientId: string
  patientName: string
  notes?: string
}

function friendlyError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  if (message.toLowerCase().includes('duplicate') || message.toLowerCase().includes('unique')) {
    return 'Este hueco ya no está disponible.'
  }
  return message
}

export async function createPublicAppointmentBooking(input: CreatePublicAppointmentInput) {
  const db = requireDb()
  const start = new Date(input.startsAt)
  const end = new Date(input.endsAt)

  const { data: overlapRows, error: overlapError } = await db
    .from('appointments')
    .select('id')
    .eq('clinic_id', input.clinicId)
    .eq('dentist_id', input.professionalId)
    .in('status', ['pending', 'confirmed'])
    .lt('starts_at', end.toISOString())
    .gt('ends_at', start.toISOString())
    .limit(1)
  if (overlapError) throw overlapError
  if ((overlapRows ?? []).length > 0) throw new Error('Este hueco ya no está disponible.')

  const { data: row, error } = await db
    .from('appointments')
    .insert({
      clinic_id: input.clinicId,
      patient_id: input.patientId,
      dentist_id: input.professionalId,
      treatment_id: input.treatmentId,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      status: 'confirmed',
      room_name: 'Asignación automática',
      notes: input.notes ?? null,
      source: 'public_ai_assistant'
    })
    .select('id, clinic_id, patient_id, dentist_id, treatment_id, starts_at, ends_at, status')
    .single()
  if (error) throw new Error(friendlyError(error))

  await db.from('appointment_events').insert({
    clinic_id: row.clinic_id,
    appointment_id: row.id,
    event_type: 'appointment.created_by_ai',
    payload: {
      source: 'public_ai_assistant'
    }
  })

  await logEvent({
    event_type: 'appointment.created_by_ai',
    module: 'appointments',
    action: 'create_public_ai_booking',
    clinic_id: row.clinic_id,
    patient_id: row.patient_id,
    professional_id: row.dentist_id,
    resource_type: 'appointment',
    resource_id: row.id,
    metadata: {
      clinic_id: row.clinic_id,
      patient_id: row.patient_id,
      professional_id: row.dentist_id,
      treatment_id: row.treatment_id,
      appointment_id: row.id,
      source: 'public_ai_assistant',
      created_at: new Date().toISOString()
    }
  })

  await invalidateCache(`clinic:${input.clinicId}:`)
  return row
}

export async function sendAppointmentConfirmation(input: {
  appointmentId: string
  patientId: string
  patientName: string
  patientEmail: string
  patientPhone?: string
  clinicName: string
  treatmentName: string
  professionalName: string
  date: string
  time: string
}) {
  return sendAppointmentNotifications({
    channels: input.patientEmail ? ['email'] : ['whatsapp'],
    appointmentId: input.appointmentId,
    patientId: input.patientId,
    patientName: input.patientName,
    patientEmail: input.patientEmail,
    patientPhone: input.patientPhone,
    clinicName: input.clinicName,
    treatmentName: input.treatmentName,
    dentistName: input.professionalName,
    cabinetName: 'Asignación automática',
    date: input.date,
    time: input.time
  })
}

export function generateAssistantResponse(context: {
  intent: BookingIntent
  treatmentResolved?: string
  needsClinic: boolean
  needsProfessional: boolean
  needsDate: boolean
}) {
  if (!context.treatmentResolved) {
    return 'Puedo ayudarte a reservar una cita de urgencia o revisión dental. ¿Quieres que busque el primer hueco disponible?'
  }
  if (context.needsClinic) return '¿En qué clínica quieres reservar?'
  if (context.needsProfessional) {
    return '¿Quieres elegir un profesional concreto o te vale cualquiera disponible?'
  }
  if (context.needsDate) return '¿Qué día o franja te viene mejor?'
  return 'Perfecto. Ya puedo buscar huecos disponibles reales para tu cita.'
}

export function monitorAiBookingError(scope: string, detail: unknown) {
  logError(`public.ai-booking.${scope}`, detail)
}

import { logEvent } from '@/lib/audit/logEvent'
import type { PublicPatientAppointment } from '@/lib/services/patientAppointmentsPublic'
import { getPatientAppointments } from '@/lib/services/patientAppointmentsPublic'
import { signVerificationPayload, verificationExpMs } from '@/lib/auth/patientVerificationToken'
import { getSupabaseAdmin, hasSupabaseConfig, isDemoMode } from '@/lib/supabaseServer'

export type IdentifierType = 'email' | 'dni' | 'nhc'

export type PublicLookupResult = {
  identifierType: IdentifierType
  matchCount: number
  appointments: PublicPatientAppointment[]
  requiresStrongVerification: boolean
  requiresExtraVerification: boolean
  lookupOnly: boolean
  verificationToken?: string
  message: string
}

function requireDb() {
  if (!hasSupabaseConfig()) throw new Error('Consulta de citas no disponible sin Supabase.')
  return getSupabaseAdmin()
}

export function detectIdentifierType(raw: string): IdentifierType {
  const value = raw.trim()
  if (value.includes('@')) return 'email'
  const digits = value.replace(/\s/g, '')
  if (/^\d{1,6}$/.test(digits)) return 'nhc'
  return 'dni'
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

function normalizeDni(value: string) {
  return value.trim().toUpperCase().replace(/\s/g, '')
}

function normalizeNhc(value: string) {
  return value.trim().replace(/^0+/, '') || '0'
}

export async function findPatientIdsByIdentifier(identifier: string): Promise<{
  identifierType: IdentifierType
  patientIds: string[]
  emailForToken?: string
}> {
  const identifierType = detectIdentifierType(identifier)
  const db = requireDb()
  const value = identifier.trim()

  if (identifierType === 'email') {
    const email = normalizeEmail(value)
    const { data, error } = await db
      .from('profiles')
      .select('id, email')
      .eq('role', 'patient')
      .ilike('email', email)
    if (error) throw error
    const rows = data ?? []
    return {
      identifierType,
      patientIds: rows.map((r) => r.id),
      emailForToken: email
    }
  }

  if (identifierType === 'nhc') {
    const nhc = normalizeNhc(value)
    const { data, error } = await db
      .from('profiles')
      .select('id, email, nhc')
      .eq('role', 'patient')
      .not('nhc', 'is', null)
    if (error) throw error
    const rows = (data ?? []).filter(
      (r) =>
        normalizeNhc(String(r.nhc ?? '')) === nhc ||
        String(r.nhc ?? '').trim() === value.trim()
    )
    return {
      identifierType,
      patientIds: rows.map((r) => r.id),
      emailForToken: rows[0]?.email ? normalizeEmail(String(rows[0].email)) : undefined
    }
  }

  const dni = normalizeDni(value)
  const { data, error } = await db
    .from('profiles')
    .select('id, email, dni')
    .eq('role', 'patient')
    .ilike('dni', dni)
  if (error) throw error
  const rows = (data ?? []).filter((r) => normalizeDni(String(r.dni ?? '')) === dni)
  return {
    identifierType,
    patientIds: rows.map((r) => r.id),
    emailForToken: rows[0]?.email ? normalizeEmail(String(rows[0].email)) : undefined
  }
}

export async function lookupPublicAppointments(identifier: string): Promise<PublicLookupResult> {
  if (isDemoMode() || !hasSupabaseConfig()) {
    return {
      identifierType: detectIdentifierType(identifier),
      matchCount: 0,
      appointments: [],
      requiresStrongVerification: true,
      requiresExtraVerification: false,
      lookupOnly: true,
      message: 'Modo demo: conecta Supabase para consultar citas reales.'
    }
  }

  const trimmed = identifier.trim()
  if (trimmed.length < 3) {
    throw new Error('Introduce un email, DNI o NHC válido.')
  }

  const { identifierType, patientIds, emailForToken } = await findPatientIdsByIdentifier(trimmed)

  await logEvent({
    event_type: 'public_appointment.lookup_requested',
    module: 'appointments',
    action: 'lookup_requested',
    metadata: { identifierType, matchCount: patientIds.length }
  })

  if (!patientIds.length) {
    await logEvent({
      event_type: 'public_appointment.lookup_not_found',
      module: 'appointments',
      action: 'lookup_not_found',
      metadata: { identifierType }
    })
    return {
      identifierType,
      matchCount: 0,
      appointments: [],
      requiresStrongVerification: true,
      requiresExtraVerification: false,
      lookupOnly: true,
      message: 'No hemos encontrado citas próximas asociadas a esos datos.'
    }
  }

  if (patientIds.length > 1) {
    return {
      identifierType,
      matchCount: patientIds.length,
      appointments: [],
      requiresStrongVerification: true,
      requiresExtraVerification: true,
      lookupOnly: true,
      message:
        'Necesitamos confirmar tu identidad. Introduce tu teléfono o inicia sesión en el Portal del Paciente.'
    }
  }

  const email = emailForToken ?? 'lookup@agendaclinic.local'
  const verificationToken = signVerificationPayload({
    patientIds,
    email,
    exp: verificationExpMs(),
    scope: 'lookup'
  })

  const appointments = await getPatientAppointments({
    verificationToken,
    upcomingOnly: true
  })

  await logEvent({
    event_type: appointments.length
      ? 'public_appointment.lookup_found'
      : 'public_appointment.lookup_not_found',
    module: 'appointments',
    action: appointments.length ? 'lookup_found' : 'lookup_not_found',
    patient_id: patientIds[0],
    resource_type: 'patient',
    resource_id: patientIds[0],
    metadata: { identifierType, count: appointments.length }
  })

  return {
    identifierType,
    matchCount: 1,
    appointments,
    requiresStrongVerification: true,
    requiresExtraVerification: false,
    lookupOnly: true,
    verificationToken,
    message: appointments.length
      ? 'Hemos encontrado estas citas próximas.'
      : 'No hemos encontrado citas próximas asociadas a esos datos.'
  }
}

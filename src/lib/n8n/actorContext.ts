import { listAssignedClinicIdsForSession } from '@/lib/services/staffContext'
import { getSupabaseAdmin, hasSupabaseConfig } from '@/lib/supabaseServer'
import type { SessionUser } from '@/lib/auth'
import type { AutomationActor } from './types'

const STAFF_ROLES = new Set(['clinic_admin', 'admin', 'owner', 'dentist', 'receptionist'])

export function sessionToAutomationActor(user: SessionUser, companyId: string): AutomationActor {
  const staffRole = user.staffRole ?? user.role
  const isPatient = user.role === 'patient' || Boolean(user.patientId)
  return {
    userId: user.profileId ?? user.patientId ?? user.email,
    companyId,
    tenantId: user.tenantId ?? null,
    role: isPatient ? 'patient' : staffRole,
    patientId: user.patientId ?? null,
    staffRole: isPatient ? null : staffRole,
    dentistId: null,
    email: user.email,
    fullName: user.name,
    agendaScope: staffRole === 'dentist' ? 'own' : 'clinic'
  }
}

export async function resolveAutomationActor(input: {
  userId: string
  companyId: string
}): Promise<AutomationActor | null> {
  if (!hasSupabaseConfig()) return null
  const db = getSupabaseAdmin()

  const { data: profile } = await db
    .from('profiles')
    .select('id, clinic_id, tenant_id, role, email, full_name')
    .eq('id', input.userId)
    .maybeSingle()

  if (!profile?.clinic_id) return null

  const clinicId = String(profile.clinic_id)
  const role = String(profile.role)
  if (clinicId !== input.companyId) {
    const sessionLike = {
      role: profile.role as SessionUser['role'],
      email: String(profile.email ?? ''),
      name: String(profile.full_name ?? ''),
      profileId: String(profile.id),
      clinicId,
      tenantId: profile.tenant_id ? String(profile.tenant_id) : undefined,
      patientId: role === 'patient' ? String(profile.id) : undefined,
      expiresAt: Date.now() + 3600_000
    }
    const assigned = await listAssignedClinicIdsForSession(sessionLike)
    if (!assigned.includes(input.companyId)) return null
  }

  const isPatient = role === 'patient'
  let dentistId: string | null = null
  if (STAFF_ROLES.has(role) && role === 'dentist') {
    const { data: dentist } = await db
      .from('dentists')
      .select('id')
      .eq('clinic_id', input.companyId)
      .eq('profile_id', profile.id)
      .maybeSingle()
    dentistId = dentist?.id ? String(dentist.id) : null
  }

  return {
    userId: String(profile.id),
    companyId: input.companyId,
    tenantId: profile.tenant_id ? String(profile.tenant_id) : null,
    role,
    patientId: isPatient ? String(profile.id) : null,
    staffRole: isPatient ? null : role,
    dentistId,
    email: profile.email ? String(profile.email) : null,
    fullName: profile.full_name ? String(profile.full_name) : null,
    agendaScope: role === 'dentist' ? 'own' : 'clinic'
  }
}

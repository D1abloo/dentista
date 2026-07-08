import type { APIContext } from 'astro'
import type { SessionUser } from '@/lib/auth'
import { getSessionUser } from '@/lib/auth'
import {
  assertClinicScopeAsync,
  assertOwnPatient,
  isPatientSession,
  requireSession
} from '@/lib/api/guards'
import { fail } from '@/lib/http'
import { resolveAutomationActor } from '@/lib/n8n/actorContext'
import { isN8nServiceRequest, readAutomationActorHeaders } from '@/lib/n8n/serviceAuth'
import type { AutomationActor } from '@/lib/n8n/types'

export type AppointmentAccess =
  | { mode: 'session'; user: SessionUser; actor: AutomationActor }
  | { mode: 'n8n'; user: null; actor: AutomationActor }

export async function requireAppointmentAccess(
  context: APIContext,
  clinicId: string
): Promise<{ access: AppointmentAccess | null; response: Response | null }> {
  if (isN8nServiceRequest(context.request)) {
    const headers = readAutomationActorHeaders(context.request)
    if (!headers.userId || !headers.companyId) {
      return { access: null, response: fail('Cabeceras de automatización incompletas.', 401) }
    }
    if (headers.companyId !== clinicId) {
      return { access: null, response: fail('companyId no coincide con la clínica solicitada.', 403) }
    }
    const actor = await resolveAutomationActor({
      userId: headers.userId,
      companyId: headers.companyId
    })
    if (!actor) return { access: null, response: fail('Actor de automatización no autorizado.', 403) }
    return { access: { mode: 'n8n', user: null, actor }, response: null }
  }

  const gate = requireSession(context)
  if (gate.response) return { access: null, response: gate.response }
  const scope = await assertClinicScopeAsync(gate.user, clinicId)
  if (scope) return { access: null, response: scope }

  const actor: AutomationActor = {
    userId: gate.user.profileId ?? gate.user.patientId ?? gate.user.email,
    companyId: clinicId,
    tenantId: gate.user.tenantId ?? null,
    role: isPatientSession(gate.user) ? 'patient' : gate.user.staffRole ?? gate.user.role,
    patientId: gate.user.patientId ?? null,
    staffRole: isPatientSession(gate.user) ? null : gate.user.staffRole ?? gate.user.role,
    dentistId: null,
    email: gate.user.email,
    fullName: gate.user.name,
    agendaScope: gate.user.staffRole === 'dentist' ? 'own' : 'clinic'
  }

  return { access: { mode: 'session', user: gate.user, actor }, response: null }
}

export function assertPatientOwnsAppointment(
  access: AppointmentAccess,
  patientId: string
): Response | null {
  if (access.actor.role === 'patient' || access.actor.patientId) {
    const own = access.actor.patientId ?? access.actor.userId
    if (own !== patientId) return fail('No puedes gestionar citas de otro paciente.', 403)
  }
  if (access.mode === 'session' && isPatientSession(access.user)) {
    return assertOwnPatient(access.user, patientId)
  }
  return null
}

export function resolveClinicIdFromContext(context: APIContext, fallback?: string) {
  const session = getSessionUser(context.cookies)
  return fallback ?? session?.clinicId ?? ''
}

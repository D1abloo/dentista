import { addHours, isAfter, parseISO } from 'date-fns'
import { logEvent } from '@/lib/audit/logEvent'
import { invalidateCache } from '@/lib/cache'
import {
  createAppointment,
  listAppointments,
  updateAppointment
} from '@/lib/services/appointments'
import { getAvailableSlotsForPublicBooking } from '@/lib/services/publicAiBooking'
import { getSupabaseAdmin, hasSupabaseConfig } from '@/lib/supabaseServer'
import type { Appointment } from '@/lib/types'
import type { AutomationActor } from '@/lib/n8n/types'
import type {
  AppointmentAutomationAuditInput,
  AppointmentAutomationAvailabilityInput,
  AppointmentAutomationCreateInput,
  AppointmentAutomationRescheduleInput
} from '@/lib/validators'

const ACTIVE_STATUSES = new Set(['pending', 'confirmed'])

function canModifyOnline(startsAt: string, status: string) {
  if (!ACTIVE_STATUSES.has(status)) return false
  return isAfter(parseISO(startsAt), addHours(new Date(), 2))
}

function filterAppointmentsForActor(actor: AutomationActor, rows: Appointment[]) {
  let scoped = rows.filter((row) => row.clinicId === actor.companyId)
  if (actor.role === 'patient' || actor.patientId) {
    const patientId = actor.patientId ?? actor.userId
    scoped = scoped.filter((row) => row.patientId === patientId)
  } else if (actor.agendaScope === 'own' && actor.dentistId) {
    scoped = scoped.filter((row) => row.dentistId === actor.dentistId)
  }
  return scoped
}

export async function checkAppointmentAvailability(
  actor: AutomationActor,
  input: AppointmentAutomationAvailabilityInput
) {
  if (input.clinicId !== actor.companyId) {
    throw new Error('No tienes permiso para consultar disponibilidad en otra empresa.')
  }

  const slots = await getAvailableSlotsForPublicBooking({
    clinicId: input.clinicId,
    treatmentId: input.treatmentId,
    professionalId: input.professionalId,
    dateRange: { from: input.fromDate, to: input.toDate },
    preferredTime: input.preferredTime ?? 'any'
  })

  const filtered = input.time
    ? slots.filter((slot) => slot.startsAt.slice(11, 16) === input.time)
  : slots

  return {
    available: filtered.length > 0,
    slots: filtered,
    alternatives: filtered.length ? [] : slots.slice(0, 6)
  }
}

export async function listScopedAppointments(
  actor: AutomationActor,
  input: { clinicId: string; dentistId?: string; upcomingOnly?: boolean; pastOnly?: boolean }
) {
  if (input.clinicId !== actor.companyId) {
    throw new Error('No tienes permiso para ver citas de otra empresa.')
  }

  const all = await listAppointments(input.clinicId)
  let scoped = filterAppointmentsForActor(actor, all)

  if (input.dentistId) {
    scoped = scoped.filter((row) => row.dentistId === input.dentistId)
  }

  const now = new Date()
  if (input.upcomingOnly) {
    scoped = scoped.filter(
      (row) => isAfter(parseISO(row.startsAt), now) && ACTIVE_STATUSES.has(row.status)
    )
  }
  if (input.pastOnly) {
    scoped = scoped.filter((row) => !isAfter(parseISO(row.startsAt), now) || row.status === 'completed')
  }

  return scoped
}

export async function getScopedAppointment(actor: AutomationActor, clinicId: string, appointmentId: string) {
  const rows = await listScopedAppointments(actor, { clinicId })
  const appointment = rows.find((row) => row.id === appointmentId)
  if (!appointment) throw new Error('Cita no encontrada o sin permiso.')
  return appointment
}

async function assertSlotStillAvailable(input: {
  clinicId: string
  treatmentId: string
  professionalId: string
  startsAt: string
  endsAt: string
}) {
  const slots = await getAvailableSlotsForPublicBooking({
    clinicId: input.clinicId,
    treatmentId: input.treatmentId,
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
  if (!ok) throw new Error('Ese horario ya no está disponible.')
}

export async function createAppointmentWithValidation(
  actor: AutomationActor,
  input: AppointmentAutomationCreateInput
) {
  if (input.clinicId !== actor.companyId) {
    throw new Error('No puedes reservar en otra empresa.')
  }
  if (actor.role === 'patient' || actor.patientId) {
    const patientId = actor.patientId ?? actor.userId
    if (input.patientId !== patientId) {
      throw new Error('No puedes reservar citas para otro paciente.')
    }
  }

  const slots = await getAvailableSlotsForPublicBooking({
    clinicId: input.clinicId,
    treatmentId: input.treatmentId,
    professionalId: input.dentistId,
    dateRange: {
      from: input.startsAt.slice(0, 10),
      to: input.startsAt.slice(0, 10)
    },
    preferredTime: 'any'
  })
  const matched = slots.find(
    (slot) => slot.startsAt === input.startsAt && slot.professionalId === input.dentistId
  )
  if (!matched) throw new Error('Ese horario ya no está disponible.')

  if (!hasSupabaseConfig()) {
    return createAppointment(input)
  }

  const db = getSupabaseAdmin()
  const { data: existing } = await db
    .from('appointments')
    .select('id')
    .eq('clinic_id', input.clinicId)
    .eq('dentist_id', input.dentistId)
    .in('status', ['pending', 'confirmed'])
    .lte('starts_at', matched.endsAt)
    .gte('ends_at', matched.startsAt)
    .limit(1)

  if (existing?.length) {
    throw new Error('Conflicto de horario: la franja ya está ocupada.')
  }

  const appointment = await createAppointment(input)
  await logAutomationAudit(actor, {
    action: 'appointment.created',
    clinicId: input.clinicId,
    appointmentId: appointment.id,
    channel: input.channel ?? 'automation',
    metadata: { startsAt: input.startsAt, patientId: input.patientId }
  })
  return appointment
}

export async function cancelAppointmentWithValidation(
  actor: AutomationActor,
  input: { clinicId: string; appointmentId: string; reason?: string; channel?: string }
) {
  const current = await getScopedAppointment(actor, input.clinicId, input.appointmentId)
  if (!canModifyOnline(current.startsAt, current.status)) {
    throw new Error('Esta cita no se puede cancelar.')
  }

  const appointment = await updateAppointment({
    clinicId: input.clinicId,
    appointmentId: input.appointmentId,
    action: 'cancel',
    notes: input.reason
  })

  await logAutomationAudit(actor, {
    action: 'appointment.cancelled',
    clinicId: input.clinicId,
    appointmentId: input.appointmentId,
    channel: input.channel ?? 'automation',
    metadata: { reason: input.reason }
  })

  return appointment
}

export async function rescheduleAppointmentWithValidation(
  actor: AutomationActor,
  input: AppointmentAutomationRescheduleInput
) {
  const current = await getScopedAppointment(actor, input.clinicId, input.appointmentId)
  if (!canModifyOnline(current.startsAt, current.status)) {
    throw new Error('Esta cita no se puede modificar.')
  }

  await assertSlotStillAvailable({
    clinicId: input.clinicId,
    treatmentId: current.treatmentId,
    professionalId: input.dentistId ?? current.dentistId,
    startsAt: input.startsAt,
    endsAt: input.endsAt
  })

  const appointment = await updateAppointment({
    clinicId: input.clinicId,
    appointmentId: input.appointmentId,
    action: 'reschedule',
    startsAt: input.startsAt,
    roomName: input.roomName ?? current.roomName,
    notes: input.notes
  })

  await invalidateCache(`clinic:${input.clinicId}:`)
  await logAutomationAudit(actor, {
    action: 'appointment.rescheduled',
    clinicId: input.clinicId,
    appointmentId: input.appointmentId,
    channel: input.channel ?? 'automation',
    metadata: { startsAt: input.startsAt }
  })

  return appointment
}

export async function logAutomationAudit(
  actor: AutomationActor,
  input: {
    action: string
    clinicId: string
    appointmentId?: string
    channel?: string
    metadata?: Record<string, unknown>
    message?: string
  }
) {
  await logEvent({
    event_type: `n8n.${input.action}`,
    module: 'n8n_automation',
    action: input.action,
    clinic_id: input.clinicId,
    tenant_id: actor.tenantId ?? undefined,
    user_id: actor.userId,
    user_email: actor.email ?? undefined,
    user_role: actor.role,
    patient_id: actor.patientId ?? undefined,
    professional_id: actor.dentistId ?? undefined,
    resource_type: 'appointment',
    resource_id: input.appointmentId,
    message: input.message ?? input.action,
    metadata: {
      channel: input.channel ?? 'automation',
      companyId: actor.companyId,
      ...input.metadata
    }
  })
}

export async function logAutomationAuditEntry(
  actor: AutomationActor | null,
  input: AppointmentAutomationAuditInput
) {
  await logEvent({
    event_type: `n8n.${input.action}`,
    module: 'n8n_automation',
    action: input.action,
    clinic_id: input.clinicId,
    tenant_id: input.tenantId ?? actor?.tenantId ?? undefined,
    user_id: actor?.userId ?? input.userId,
    user_email: actor?.email ?? undefined,
    user_role: actor?.role ?? input.role,
    resource_type: input.resourceType ?? 'appointment',
    resource_id: input.resourceId,
    message: input.message ?? input.action,
    severity: input.level === 'error' ? 'high' : input.level === 'warn' ? 'medium' : 'info',
    result: input.level === 'error' ? 'error' : 'ok',
    metadata: {
      channel: input.channel,
      workflow: input.workflow ?? 'Appointment Automation',
      ...input.metadata
    }
  })
}

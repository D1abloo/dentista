import type { AssistantUiState, AssistantContext } from './types'

export const MANAGE_STEPS = [
  { id: 'identity', label: 'Identificación', shortLabel: 'ID' },
  { id: 'appointments', label: 'Citas', shortLabel: 'Citas' },
  { id: 'action', label: 'Acción', shortLabel: 'Acc.' },
  { id: 'confirm', label: 'Confirmar', shortLabel: 'Conf.' }
] as const

export type ManageStepId = (typeof MANAGE_STEPS)[number]['id']

export function getCurrentManageStep(
  status: AssistantUiState,
  context: AssistantContext,
  hasAppointments: boolean
): ManageStepId {
  if (status === 'confirming_cancel' || status === 'confirming_reschedule') return 'confirm'
  if (status === 'showing_slots' && context.selectedAppointmentId) return 'action'
  if (hasAppointments || status === 'showing_existing_appointments') return 'action'
  if (context.verificationToken || status === 'identity_verified') return 'appointments'
  return 'identity'
}

export function getManageStepIndex(stepId: ManageStepId) {
  return MANAGE_STEPS.findIndex((step) => step.id === stepId)
}

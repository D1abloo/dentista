import type { BlockedSlot } from '@/types/demo';
import type { StaffContext } from '@/lib/services/staffContext';

export type BlockDeleteOptions = {
  ownAgenda: boolean;
  dentistId?: string;
  assignedClinicIds?: string[];
  staffLoading?: boolean;
  /** Rol de sesión (p. ej. super_admin con acceso total al panel clínica). */
  sessionRole?: string;
};

function blockDentistIds(block: BlockedSlot): string[] {
  return block.dentistIds?.length ? block.dentistIds : [block.dentistId];
}

/** Mensaje para el usuario si no puede desbloquear; `null` si está permitido. */
export function scheduleBlockDeleteDenialReason(
  staff: StaffContext | null,
  block: BlockedSlot,
  options: BlockDeleteOptions
): string | null {
  const sessionRole = options.sessionRole ?? '';
  if (sessionRole === 'super_admin' || sessionRole === 'admin') {
    const assigned = staff?.assignedClinicIds ?? options.assignedClinicIds;
    if (assigned?.length && !assigned.includes(block.clinicId)) {
      return 'Este bloqueo pertenece a otra sede. Selecciona la clínica correcta en el panel superior.';
    }
    return null;
  }

  const assigned = staff?.assignedClinicIds ?? options.assignedClinicIds;
  if (assigned?.length && !assigned.includes(block.clinicId)) {
    return 'Este bloqueo pertenece a otra sede. Selecciona la clínica correcta en el panel superior.';
  }

  if (!staff) {
    if (options.ownAgenda && options.dentistId) {
      const ids = blockDentistIds(block);
      if (!ids.includes(options.dentistId)) {
        return 'Solo puedes desbloquear horarios de tu propia agenda.';
      }
    }
    return null;
  }

  if (staff.canManageBlocks) return null;

  if (staff.dentistId) {
    const ids = blockDentistIds(block);
    if (!ids.includes(staff.dentistId)) {
      return 'Solo puedes desbloquear tus propios bloqueos. Si necesitas quitar otro horario, contacta con recepción o administración.';
    }
    return null;
  }

  if (options.ownAgenda && options.dentistId) {
    const ids = blockDentistIds(block);
    if (!ids.includes(options.dentistId)) {
      return 'Solo puedes desbloquear horarios de tu propia agenda.';
    }
    return null;
  }

  if (options.ownAgenda) {
    return 'No tienes permiso para desbloquear horarios en la agenda completa de la clínica.';
  }

  return null;
}

/** Puede eliminar bloqueos de agenda (administración / recepción o dentista sobre sus tramos). */
export function canDeleteScheduleBlock(
  staff: StaffContext | null,
  block: BlockedSlot,
  options: BlockDeleteOptions
): boolean {
  return scheduleBlockDeleteDenialReason(staff, block, options) === null;
}

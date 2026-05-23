import type { BlockedSlot } from '@/types/demo';
import type { StaffContext } from '@/lib/services/staffContext';

/** Puede eliminar bloqueos de agenda (administración / recepción o dentista sobre sus tramos). */
export function canDeleteScheduleBlock(
  staff: StaffContext | null,
  block: BlockedSlot,
  options: { ownAgenda: boolean; dentistId?: string; assignedClinicIds?: string[] }
): boolean {
  const assigned = staff?.assignedClinicIds ?? options.assignedClinicIds;
  if (assigned?.length && !assigned.includes(block.clinicId)) return false;

  if (staff?.canManageBlocks) return true;

  if (staff?.dentistId) {
    const ids = block.dentistIds?.length ? block.dentistIds : [block.dentistId];
    return ids.includes(staff.dentistId);
  }

  if (options.ownAgenda && options.dentistId) {
    const ids = block.dentistIds?.length ? block.dentistIds : [block.dentistId];
    return ids.includes(options.dentistId);
  }

  return !options.ownAgenda;
}

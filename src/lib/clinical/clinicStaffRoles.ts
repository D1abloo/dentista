const MANAGER_ROLES = new Set(['clinic_admin', 'admin', 'owner']);

/** Roles que pueden gestionar perfiles clínicos de otros profesionales. */
export function isClinicProfileManager(role: string) {
  return MANAGER_ROLES.has(role);
}

const STAFF_ROLES = new Set(['admin', 'owner', 'clinic_admin', 'dentist', 'receptionist']);

export type ClinicProfileRow = {
  id: string;
  clinic_id: string;
  tenant_id: string | null;
  role: string;
  full_name: string;
  email: string;
  must_change_password?: boolean | null;
  password_expires_at?: string | null;
  activated_at?: string | null;
};

export function pickProfileForLogin(
  profiles: ClinicProfileRow[],
  intent: 'admin' | 'patient' | 'auto'
): ClinicProfileRow | null {
  if (!profiles.length) return null;

  const staff = profiles.filter((p) => STAFF_ROLES.has(p.role));
  const patients = profiles.filter((p) => p.role === 'patient');

  if (intent === 'admin') return staff[0] ?? null;
  if (intent === 'patient') return patients[0] ?? null;

  return staff[0] ?? patients[0] ?? null;
}

export function isPatientActivated(profile: { role: string; activated_at?: string | null }) {
  if (profile.role !== 'patient') return true;
  return Boolean(profile.activated_at);
}

import type { AuthenticatedIdentity } from '@/lib/auth/portalChoices'
import type { ClinicProfileRow } from '@/lib/auth/profilePick'
import { getSupabaseAdmin, hasSupabaseConfig } from '@/lib/supabaseServer'

export function isEnvSuperAdminCredentials(email: string, password: string): boolean {
  const envEmail = import.meta.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase()
  const envPassword = import.meta.env.SUPER_ADMIN_PASSWORD
  if (!envEmail || !envPassword) return false
  return email.trim().toLowerCase() === envEmail && password === envPassword
}

/** Misma contraseña de .env (SUPER_ADMIN_PASSWORD) válida en plataforma, clínica y paciente. */
export async function loadSuperAdminIdentityByEmail(
  email: string
): Promise<AuthenticatedIdentity | null> {
  if (!hasSupabaseConfig()) return null

  const normalized = email.trim().toLowerCase()
  const admin = getSupabaseAdmin()

  const { data: profiles, error } = await admin
    .from('profiles')
    .select(
      'id, clinic_id, tenant_id, role, full_name, email, must_change_password, password_expires_at, activated_at, auth_user_id'
    )
    .eq('email', normalized)

  if (error || !profiles?.length) return null

  const authUserId = String(profiles[0].auth_user_id ?? '')
  if (!authUserId) return null

  return {
    authUserId,
    email: normalized,
    profiles: profiles.map((row) => {
      const { auth_user_id: _auth, ...rest } = row as ClinicProfileRow & { auth_user_id?: string }
      return rest as ClinicProfileRow
    })
  }
}

export async function authenticateSuperAdminEnvFallback(
  email: string,
  password: string
): Promise<AuthenticatedIdentity | null> {
  if (!isEnvSuperAdminCredentials(email, password)) return null
  return loadSuperAdminIdentityByEmail(email)
}

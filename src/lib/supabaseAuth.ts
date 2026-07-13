import { getDbAdmin, hasDatabaseConfig } from '@/lib/db/client'
import { localSignInWithPassword } from '@/lib/db/auth'

export function getSupabaseAnon() {
  if (!hasDatabaseConfig()) throw new Error('Base de datos no configurada.')
  return getDbAdmin()
}

export async function signInWithEmailPassword(email: string, password: string) {
  return localSignInWithPassword(email, password)
}

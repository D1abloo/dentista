import { createClient } from '@supabase/supabase-js'
import { loadEnvFile } from './load-env.mjs'
import { patchLocalAuth } from './local-auth-pg.mjs'

loadEnvFile()

export function createDbClient() {
  const url = process.env.SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Faltan PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env')
  }
  const client = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
  if (process.env.LOCAL_POSTGRES === 'true') {
    patchLocalAuth(client)
  }
  return client
}

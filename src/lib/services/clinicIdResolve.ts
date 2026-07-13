import { getDbAdmin, hasDatabaseConfig } from '@/lib/db/client'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/** Convierte slug legacy demo-clinic al primer UUID de clínica activa. */
export async function resolveClinicId(clinicId: string): Promise<string> {
  if (UUID_RE.test(clinicId)) return clinicId
  if (!hasDatabaseConfig()) return clinicId

  const db = getDbAdmin()
  const bySlug = await db.from('clinics').select('id').eq('slug', clinicId).eq('status', 'active').maybeSingle()
  if (bySlug.data?.id) return String(bySlug.data.id)

  const first = await db
    .from('clinics')
    .select('id')
    .eq('status', 'active')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (!first.data?.id) throw new Error('No hay clínicas activas configuradas')
  return String(first.data.id)
}

import pg from 'pg'

let pool: pg.Pool | null = null

export function getDatabaseUrl(): string | undefined {
  return import.meta.env.DATABASE_URL ?? process.env.DATABASE_URL
}

export function hasDatabaseConfig(): boolean {
  const url = getDatabaseUrl()
  return Boolean(url && !url.includes('YOUR_'))
}

export function getPgPool(): pg.Pool {
  const url = getDatabaseUrl()
  if (!url) throw new Error('Falta DATABASE_URL. Configura PostgreSQL en .env')
  if (!pool) {
    const isLocal = /@(127\.0\.0\.1|localhost):/.test(url)
    const useSsl =
      import.meta.env.DATABASE_SSL === 'true' ||
      process.env.DATABASE_SSL === 'true' ||
      (!isLocal && /sslmode=require/i.test(url))
    pool = new pg.Pool({
      connectionString: url,
      max: 12,
      ssl: useSsl ? { rejectUnauthorized: false } : false
    })
  }
  return pool
}

export async function closePgPool() {
  if (pool) {
    await pool.end()
    pool = null
  }
}

import dns from 'node:dns'
import pg from 'pg'

dns.setDefaultResultOrder('ipv4first')

export async function connectPostgres(databaseUrl = process.env.DATABASE_URL) {
  if (!databaseUrl) throw new Error('Falta DATABASE_URL en .env')

  const isLocal = /@(127\.0\.0\.1|localhost):/.test(databaseUrl)
  const useSsl =
    process.env.DATABASE_SSL === 'true' || (!isLocal && /sslmode=require/i.test(databaseUrl))

  const client = new pg.Client({
    connectionString: databaseUrl,
    ssl: useSsl ? { rejectUnauthorized: false } : false
  })
  await client.connect()
  return client
}

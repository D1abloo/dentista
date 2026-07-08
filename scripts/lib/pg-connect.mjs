import dns from 'node:dns'
import pg from 'pg'

dns.setDefaultResultOrder('ipv4first')

export async function connectPostgres(databaseUrl = process.env.DATABASE_URL) {
  if (!databaseUrl) throw new Error('Falta DATABASE_URL en .env')

  const isLocal =
    process.env.LOCAL_POSTGRES === 'true' ||
    /@(127\.0\.0\.1|localhost):/.test(databaseUrl)

  const direct = new pg.Client({
    connectionString: databaseUrl,
    ssl: isLocal ? false : { rejectUnauthorized: false }
  })
  try {
    await direct.connect()
    return direct
  } catch (err) {
    await direct.end().catch(() => undefined)
    if (isLocal || (!String(err.code).includes('ENETUNREACH') && !String(err.message).includes('ENETUNREACH'))) {
      throw err
    }
  }

  const parsed = new URL(databaseUrl)
  const password = encodeURIComponent(parsed.password)
  const db = parsed.pathname.replace(/^\//, '') || 'postgres'
  const projectRef =
    parsed.username?.replace(/^postgres\./, '') ||
    process.env.SUPABASE_PROJECT_REF ||
    parsed.hostname.replace(/^db\./, '').split('.')[0]

  const regions = [
    'eu-central-1',
    'eu-west-1',
    'eu-west-2',
    'eu-west-3',
    'eu-north-1',
    'us-east-1',
    'us-west-1',
    'ap-southeast-1'
  ]
  const errors = []

  for (const region of regions) {
    const host = `aws-0-${region}.pooler.supabase.com`
    for (const port of ['6543', '5432']) {
      for (const user of [`postgres.${projectRef}`, 'postgres']) {
        const poolerUrl = `postgresql://${user}:${password}@${host}:${port}/${db}`
        const client = new pg.Client({ connectionString: poolerUrl, ssl: { rejectUnauthorized: false } })
        try {
          await client.connect()
          console.log(`✓ PostgreSQL vía ${host}:${port} (${user})`)
          return client
        } catch (poolErr) {
          errors.push(`${host}:${port} ${user} → ${poolErr.message}`)
          await client.end().catch(() => undefined)
        }
      }
    }
  }

  throw new Error(
    `No se pudo conectar a PostgreSQL.\n${errors.slice(-4).join('\n')}\nCrea un proyecto nuevo en supabase.com y actualiza DATABASE_URL.`
  )
}

export async function checkSupabaseRest(url, serviceKey) {
  const res = await fetch(`${url.replace(/\/$/, '')}/rest/v1/`, {
    headers: {
      apikey: serviceKey,
      authorization: `Bearer ${serviceKey}`
    },
    signal: AbortSignal.timeout(8000)
  })
  return res.ok || res.status === 404
}

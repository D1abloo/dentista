#!/usr/bin/env node
/**
 * Bootstrap completo: Docker PostgreSQL + PostgREST + migraciones + semilla.
 *
 * Uso:
 *   npm run local:pg:setup    # escribe .env local
 *   npm run local:pg:bootstrap
 */
import { execSync } from 'node:child_process'
import { loadEnvFile, projectRoot } from './lib/load-env.mjs'
import { connectPostgres } from './lib/pg-connect.mjs'

loadEnvFile()

function fail(msg) {
  console.error(`\n✗ ${msg}`)
  process.exit(1)
}

async function waitRest(url, attempts = 25) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(`${url.replace(/\/$/, '')}/rest/v1/`, { signal: AbortSignal.timeout(3000) })
      if (res.ok || res.status === 404) return true
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 1000))
  }
  return false
}

console.log('── Bootstrap PostgreSQL local (sin Supabase cloud) ──\n')

if (process.env.LOCAL_POSTGRES !== 'true') {
  execSync('node scripts/setup-local-postgres-env.mjs', { cwd: projectRoot, stdio: 'inherit' })
  loadEnvFile()
}

console.log('→ Arrancando PostgreSQL (Docker)...')
execSync('bash scripts/postgres-local-dev.sh postgres', { cwd: projectRoot, stdio: 'inherit' })

try {
  const client = await connectPostgres()
  await client.query('select 1')
  await client.end()
  console.log('✓ PostgreSQL conecta')
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err)
  fail(`PostgreSQL no conecta: ${msg}`)
}

console.log('\n→ Roles + migraciones SQL...')
execSync('node scripts/apply-all-migrations.mjs', {
  cwd: projectRoot,
  stdio: 'inherit',
  env: { ...process.env, LOCAL_POSTGRES: 'true' }
})

console.log('\n→ PostgREST + proxy API (/rest/v1)...')
execSync('bash scripts/postgres-local-dev.sh rest', { cwd: projectRoot, stdio: 'inherit' })
execSync('bash scripts/postgres-local-dev.sh proxy', { cwd: projectRoot, stdio: 'inherit' })

const restUrl = process.env.PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
if (!(await waitRest(restUrl))) {
  fail(`PostgREST no responde en ${restUrl}. Logs: docker logs dentista-rest`)
}
console.log(`✓ PostgREST en ${restUrl}`)

console.log('\n→ Semilla clínica demo...')
try {
  execSync('node scripts/seed-pro-clinic.mjs', {
    cwd: projectRoot,
    stdio: 'inherit',
    env: { ...process.env, LOCAL_POSTGRES: 'true' }
  })
} catch {
  console.log('⊘ seed:clinic falló o clínica ya existe')
}

const base = process.env.PUBLIC_APP_URL || 'http://127.0.0.1:4321'
console.log('\n→ Comprobando API (opcional si npm run dev está activo)...')
try {
  const locations = await fetch(`${base}/api/locations`, { signal: AbortSignal.timeout(10000) })
  const locJson = await locations.json()
  const count = Array.isArray(locJson.data) ? locJson.data.length : 0
  console.log(count > 0 ? `✓ /api/locations → ${count} clínica(s)` : '⊘ /api/locations sin datos (arranca npm run dev)')
} catch {
  console.log('⊘ Dev server no activo. Ejecuta: CHOKIDAR_USEPOLLING=true npm run dev')
}

console.log(`
── Listo ──
  PostgreSQL: ${process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':***@')}
  PostgREST:  ${restUrl}
  App:        ${base}/citas-con-ia
  Login:      admin@dentista.app (SUPER_ADMIN_PASSWORD en .env)

  Parar BD:   npm run local:pg:stop
`)

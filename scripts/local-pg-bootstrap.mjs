#!/usr/bin/env node
/**
 * Bootstrap PostgreSQL local: Docker + migraciones + semilla.
 * Sin Supabase ni PostgREST.
 */
import { execSync } from 'node:child_process'
import { loadEnvFile, projectRoot } from './lib/load-env.mjs'
import { connectPostgres } from './lib/pg-connect.mjs'

loadEnvFile()

function fail(msg) {
  console.error(`\n✗ ${msg}`)
  process.exit(1)
}

console.log('── Bootstrap PostgreSQL local ──\n')

if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('YOUR_')) {
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
  stdio: 'inherit'
})

console.log('\n→ Semilla clínica demo...')
try {
  execSync('node scripts/seed-pro-clinic.mjs', {
    cwd: projectRoot,
    stdio: 'inherit'
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
  App:        ${base}/
  Login:      admin@dentista.app (SUPER_ADMIN_PASSWORD en .env)

  Parar BD:   npm run local:pg:stop
`)

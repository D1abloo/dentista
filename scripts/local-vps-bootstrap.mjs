#!/usr/bin/env node
/**
 * Bootstrap entorno local (misma BD que usarás en VPS).
 *
 * Uso:
 *   npm run local:setup -- <ref> <anon> <service> [database_url]   # si .env vacío
 *   npm run local:bootstrap
 */
import { execSync } from 'node:child_process'
import { loadEnvFile, projectRoot } from './lib/load-env.mjs'
import { checkSupabaseRest, connectPostgres } from './lib/pg-connect.mjs'

loadEnvFile()

const url = process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.PUBLIC_SUPABASE_ANON_KEY

function fail(msg) {
  console.error(`\n✗ ${msg}`)
  process.exit(1)
}

console.log('── Bootstrap local (Supabase + semilla) ──\n')

if (!url || url.includes('YOUR_PROJECT') || !serviceKey || serviceKey.includes('YOUR_')) {
  fail(`Configura Supabase primero:

  1. Crea proyecto gratis en https://supabase.com/dashboard
  2. Copia Project URL, anon key, service_role y DATABASE_URL (pooler :6543)
  3. Ejecuta:
     npm run local:setup -- <project-ref> <anon-key> <service-role-key> "<database-url>"
  4. Vuelve a ejecutar: npm run local:bootstrap`)
}

console.log(`→ Supabase: ${url}`)

let restOk = false
try {
  restOk = await checkSupabaseRest(url, serviceKey)
} catch (err) {
  fail(`Supabase REST no responde (${url}). El proyecto puede estar pausado o el ref es incorrecto.`)
}
if (!restOk) fail('Supabase REST rechazó las credenciales. Revisa anon/service_role en .env.')

console.log('✓ API REST Supabase')

try {
  const client = await connectPostgres()
  await client.query('select 1')
  await client.end()
  console.log('✓ PostgreSQL (DATABASE_URL)')
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err)
  fail(`PostgreSQL no conecta: ${msg}`)
}

console.log('\n→ Aplicando migraciones...')
execSync('node scripts/apply-all-migrations.mjs', { cwd: projectRoot, stdio: 'inherit', env: process.env })

console.log('\n→ Sembrando clínica de prueba...')
try {
  execSync('node scripts/seed-pro-clinic.mjs', { cwd: projectRoot, stdio: 'inherit', env: process.env })
} catch {
  console.log('⊘ seed:clinic falló (puede que la clínica ya exista). Continuando...')
}

const base = process.env.PUBLIC_APP_URL || 'http://127.0.0.1:4321'
console.log('\n→ Comprobando API (requiere npm run dev en otra terminal)...')

try {
  const health = await fetch(`${base}/api/cache/health`, { signal: AbortSignal.timeout(4000) })
  if (!health.ok) {
    console.log('⊘ Dev server no responde. Ejecuta: CHOKIDAR_USEPOLLING=true npm run dev')
  } else {
    const locations = await fetch(`${base}/api/locations`, { signal: AbortSignal.timeout(15000) })
    const locJson = await locations.json()
    const count = Array.isArray(locJson.data) ? locJson.data.length : 0
    console.log(count > 0 ? `✓ /api/locations → ${count} clínica(s)` : '⊘ /api/locations sin clínicas (revisa seed)')

    const chat = await fetch(`${base}/api/ai/appointments-chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-n8n-orchestrator': '1' },
      body: JSON.stringify({
        message: 'Reservar nueva cita',
        conversation: [],
        assistantState: { bookingState: {}, assistantContext: { mode: 'book' } }
      }),
      signal: AbortSignal.timeout(30000)
    })
    const chatJson = await chat.json()
    const slots = chatJson.data?.slots?.length ?? 0
    if (slots > 0) {
      console.log(`✓ Asistente IA → ${slots} huecos disponibles`)
    } else if (chatJson.data?.assistantMessage) {
      console.log(`✓ Asistente IA responde: ${String(chatJson.data.assistantMessage).slice(0, 80)}...`)
    } else {
      console.log('⊘ Asistente:', chatJson.error?.message ?? 'sin datos')
    }
  }
} catch {
  console.log('⊘ No se pudo probar APIs (¿npm run dev activo?)')
}

console.log(`
── Listo para desarrollo local ──
  App:     ${base}
  Chat IA: ${base}/citas-con-ia
  n8n:     npm run n8n:dev  →  http://127.0.0.1:5678

── Mismo .env en VPS (ver docs/LOCAL_DEV_VPS.md) ──
  npm run build:vps
  copiar deploy/vps/dentalflow.service + nginx
`)

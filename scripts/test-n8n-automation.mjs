/**
 * Pruebas de automatización n8n: estructura + API opcional en vivo.
 *
 * Uso:
 *   npm run test:n8n
 *   npm run test:n8n -- --live          # requiere dev server + N8N_SERVICE_TOKEN
 *   BASE_URL=http://127.0.0.1:4321 npm run test:n8n -- --live
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { loadEnvFile, projectRoot } from './lib/load-env.mjs'

loadEnvFile()

const root = projectRoot
const live = process.argv.includes('--live')
const baseUrl = process.env.BASE_URL || process.env.APP_BASE_URL || 'http://127.0.0.1:4321'
const serviceToken = process.env.N8N_SERVICE_TOKEN

const workflow = JSON.parse(
  readFileSync(join(root, 'n8n/workflows/appointment-automation.json'), 'utf8')
)

const nodeNames = workflow.nodes.map((n) => n.name)
const requiredNodes = [
  'Webhook Trigger',
  'Email + Staff Created',
  'Calendar Payload',
  'Calendar Enabled?',
  'Google Calendar Create',
  'Audit Calendar',
  'Audit Log',
  'Respond to Webhook'
]

for (const name of requiredNodes) {
  assert.ok(nodeNames.includes(name), `Falta nodo "${name}" en appointment-automation.json`)
}

const googleNode = workflow.nodes.find((n) => n.name === 'Google Calendar Create')
assert.equal(googleNode.type, 'n8n-nodes-base.googleCalendar')
assert.equal(googleNode.parameters.operation, 'create')
assert.equal(googleNode.parameters.resource, 'event')

const calendarConn = workflow.connections['Calendar Payload']?.main?.[0]?.[0]?.node
assert.equal(calendarConn, 'Calendar Enabled?')

const calendarBranch = workflow.connections['Calendar Enabled?']?.main
assert.equal(calendarBranch?.[0]?.[0]?.node, 'Google Calendar Create')
assert.equal(calendarBranch?.[1]?.[0]?.node, 'Audit Log')

console.log('✓ Estructura workflow Appointment Automation')

const notifySource = readFileSync(join(root, 'src/pages/api/n8n/notify/created.ts'), 'utf8')
assert.match(notifySource, /appointmentId: parsed\.data\.appointmentId/)
console.log('✓ notify/created devuelve appointmentId en meta')

async function isServerUp(url) {
  try {
    const res = await fetch(`${url}/api/cache/health`, { signal: AbortSignal.timeout(3000) })
    return res.ok
  } catch {
    return false
  }
}

async function runLiveTests() {
  if (!serviceToken) {
    console.log('⊘ Modo --live omitido: define N8N_SERVICE_TOKEN en .env')
    return
  }

  const up = await isServerUp(baseUrl)
  if (!up) {
    console.log(`⊘ Modo --live omitido: servidor no responde en ${baseUrl} (ejecuta npm run dev)`)
    return
  }

  console.log(`→ Pruebas API en vivo (${baseUrl})`)

  const noAuth = await fetch(`${baseUrl}/api/n8n/notify/created`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ clinicId: 'test', appointmentId: 'test' })
  })
  assert.equal(noAuth.status, 403, 'Sin token debe devolver 403')
  console.log('✓ 403 sin Authorization')

  const badPayload = await fetch(`${baseUrl}/api/n8n/notify/created`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${serviceToken}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({})
  })
  assert.equal(badPayload.status, 422, 'Payload vacío debe devolver 422')
  console.log('✓ 422 payload inválido en notify/created')

  const auditNoAuth = await fetch(`${baseUrl}/api/appointments/audit-log`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ clinicId: 'x', action: 'test' })
  })
  assert.equal(auditNoAuth.status, 403)
  console.log('✓ 403 audit-log sin token')

  const calendarNoAuth = await fetch(`${baseUrl}/api/n8n/calendar/event`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ clinicId: 'x', appointmentId: 'y' })
  })
  assert.equal(calendarNoAuth.status, 403)
  console.log('✓ 403 calendar/event sin token')

  const remindersNoAuth = await fetch(`${baseUrl}/api/n8n/reminders/due`)
  assert.equal(remindersNoAuth.status, 403)
  console.log('✓ 403 reminders/due sin token')

  console.log('✓ Pruebas API en vivo completadas')
}

if (live) {
  await runLiveTests()
} else {
  console.log('Tip: npm run test:n8n -- --live  (con npm run dev y N8N_SERVICE_TOKEN)')
}

console.log('\ntest-n8n-automation: OK')

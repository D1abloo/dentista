/**
 * Bootstrap n8n local: importa workflows vía CLI y activa Appointment Automation.
 *
 * Requisitos: n8n corriendo (npm run n8n:dev)
 *
 * Uso:
 *   npm run n8n:bootstrap
 */
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { execSync } from 'node:child_process'
import { loadEnvFile, projectRoot } from './lib/load-env.mjs'

loadEnvFile()

const root = projectRoot
const n8nBase = process.env.N8N_BASE_URL || 'http://127.0.0.1:5678'
const workflowFiles = [
  'appointment-error-handler.json',
  'appointment-automation.json',
  'appointment-reminders-cron.json'
]

async function waitForN8n(maxMs = 90_000) {
  const start = Date.now()
  while (Date.now() - start < maxMs) {
    try {
      const res = await fetch(`${n8nBase}/healthz`, { signal: AbortSignal.timeout(2000) })
      if (res.ok) return true
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 2000))
  }
  return false
}

function importWorkflow(fileName) {
  const filePath = join(root, 'n8n/workflows', fileName)
  const workflow = JSON.parse(readFileSync(filePath, 'utf8'))
  const tempDir = mkdtempSync(join(tmpdir(), 'n8n-import-'))
  const tempFile = join(tempDir, fileName)
  writeFileSync(tempFile, JSON.stringify([{ ...workflow, id: randomUUID(), active: false }]))
  try {
    execSync(`npx --yes n8n import:workflow --input="${tempFile}"`, {
      cwd: root,
      stdio: 'pipe',
      encoding: 'utf8'
    })
    console.log(`✓ Importado: ${workflow.name}`)
  } finally {
    rmSync(tempDir, { recursive: true, force: true })
  }
}

function listWorkflows() {
  const out = execSync('npx --yes n8n list:workflow', { cwd: root, encoding: 'utf8' })
  return out
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [id, name] = line.split('|')
      return { id: id?.trim(), name: name?.trim() }
    })
}

function publishWorkflow(id, name) {
  execSync(`npx --yes n8n publish:workflow --id=${id}`, {
    cwd: root,
    stdio: 'pipe',
    encoding: 'utf8'
  })
  console.log(`✓ Publicado: ${name} (${id})`)
}

const up = await waitForN8n()
if (!up) {
  console.error(`n8n no responde en ${n8nBase}. Ejecuta primero: npm run n8n:dev`)
  process.exit(1)
}

console.log(`→ Bootstrap n8n en ${n8nBase}`)

for (const file of workflowFiles) {
  importWorkflow(file)
}

const workflows = listWorkflows()
const main = workflows.find((w) => w.name === 'Appointment Automation')
if (main?.id) {
  publishWorkflow(main.id, main.name)
}

const webhookUrl = `${n8nBase}/webhook/appointments`
console.log('\n── n8n listo ──')
console.log(`UI:        ${n8nBase}`)
console.log(`Webhook:   ${webhookUrl}`)
console.log('\nSiguiente:')
console.log('  1. Reinicia n8n si ya estaba corriendo: Ctrl+C en n8n:dev y npm run n8n:dev')
console.log('  2. npm run dev')
console.log('  3. npm run test:n8n -- --live')
console.log('  4. Abre http://127.0.0.1:4321/citas-con-ia')

/**
 * Añade variables n8n de desarrollo local al .env si faltan.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { projectRoot } from './lib/load-env.mjs'

const envPath = join(projectRoot, '.env')
if (!existsSync(envPath)) {
  console.error('No existe .env. Copia .env.example → .env primero.')
  process.exit(1)
}

const defaults = {
  N8N_APPOINTMENTS_WEBHOOK_URL: 'http://127.0.0.1:5678/webhook/appointments',
  N8N_WEBHOOK_SECRET: 'local-n8n-webhook-secret-dev',
  N8N_SERVICE_TOKEN: 'local-n8n-service-token-dev',
  N8N_ADMIN_EMAIL: 'admin@dentista.app',
  APP_BASE_URL: 'http://127.0.0.1:4321'
}

let content = readFileSync(envPath, 'utf8')
const lines = []
let changed = false

for (const [key, value] of Object.entries(defaults)) {
  const re = new RegExp(`^${key}=`, 'm')
  if (re.test(content)) {
    const current = content.match(new RegExp(`^${key}=(.*)$`, 'm'))?.[1]?.trim()
    if (!current || current === '""' || current === "''") {
      content = content.replace(re, `${key}="${value}"`)
      changed = true
      lines.push(`  ${key} → ${value}`)
    }
  } else {
    content += `\n${key}="${value}"\n`
    changed = true
    lines.push(`  + ${key}=${value}`)
  }
}

if (changed) {
  writeFileSync(envPath, content)
  console.log('✓ .env actualizado con variables n8n local:')
  for (const line of lines) console.log(line)
} else {
  console.log('✓ .env ya tiene variables n8n configuradas')
}

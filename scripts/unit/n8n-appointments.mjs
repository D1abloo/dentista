import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '../..')

const validatorsSource = readFileSync(join(root, 'src/lib/validators.ts'), 'utf8')
const workflow = JSON.parse(
  readFileSync(join(root, 'n8n/workflows/appointment-automation.json'), 'utf8')
)

assert.match(validatorsSource, /appointmentAutomationIntentSchema/)
assert.match(validatorsSource, /appointmentAutomationAvailabilitySchema/)
assert.match(validatorsSource, /appointmentAutomationAuditSchema/)
assert.equal(workflow.name, 'Appointment Automation')

const nodeNames = workflow.nodes.map((node) => node.name)
assert.ok(nodeNames.includes('Webhook Trigger'))
assert.ok(nodeNames.includes('GET Availability'))
assert.ok(nodeNames.includes('Audit Log'))

const apiFiles = [
  'src/pages/api/appointments/intent.ts',
  'src/pages/api/appointments/availability.ts',
  'src/pages/api/appointments/audit-log.ts',
  'src/pages/api/appointments/[id].ts',
  'src/pages/api/appointments/[id]/cancel.ts',
  'src/pages/api/appointments/[id]/reschedule.ts'
]

for (const file of apiFiles) {
  readFileSync(join(root, file), 'utf8')
}

console.log('n8n-appointments: OK')

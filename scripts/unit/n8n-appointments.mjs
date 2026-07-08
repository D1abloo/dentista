import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '../..')

const validatorsSource = readFileSync(join(root, 'src/lib/validators.ts'), 'utf8')
const workflows = [
  'appointment-automation.json',
  'appointment-reminders-cron.json',
  'appointment-error-handler.json'
].map((file) => JSON.parse(readFileSync(join(root, 'n8n/workflows', file), 'utf8')))

assert.match(validatorsSource, /appointmentAutomationIntentSchema/)
assert.match(validatorsSource, /n8nNotifyCreatedSchema/)
assert.match(validatorsSource, /n8nRemindersDueQuerySchema/)

for (const workflow of workflows) {
  assert.ok(workflow.name)
  assert.ok(Array.isArray(workflow.nodes) && workflow.nodes.length > 0)
}

const main = workflows.find((w) => w.name === 'Appointment Automation')
const cron = workflows.find((w) => w.name === 'Appointment Reminders Cron')
const errors = workflows.find((w) => w.name === 'Appointment Error Handler')

assert.ok(main.nodes.some((n) => n.name === 'Email + Staff Created'))
assert.ok(main.nodes.some((n) => n.name === 'Notify Cancelled'))
assert.ok(main.nodes.some((n) => n.name === 'Calendar Payload'))
assert.ok(main.nodes.some((n) => n.name === 'Google Calendar Create'))
assert.ok(main.nodes.some((n) => n.name === 'Calendar Enabled?'))
assert.ok(main.nodes.some((n) => n.name === 'Audit Calendar'))
assert.ok(main.connections['Google Calendar Create']?.main?.[0]?.[0]?.node === 'Audit Calendar')
assert.ok(cron.nodes.some((n) => n.name === 'Every Hour'))
assert.ok(errors.nodes.some((n) => n.name === 'Error Trigger'))

const apiFiles = [
  'src/pages/api/appointments/intent.ts',
  'src/pages/api/n8n/notify/created.ts',
  'src/pages/api/n8n/notify/cancelled.ts',
  'src/pages/api/n8n/notify/staff.ts',
  'src/pages/api/n8n/notify/admin-alert.ts',
  'src/pages/api/n8n/reminders/due.ts',
  'src/pages/api/n8n/reminders/send.ts',
  'src/pages/api/n8n/calendar/event.ts'
]

for (const file of apiFiles) {
  readFileSync(join(root, file), 'utf8')
}

readFileSync(join(root, 'src/lib/services/n8nAutomationNotifications.ts'), 'utf8')

console.log('n8n-appointments: OK')

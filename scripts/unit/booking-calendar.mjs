import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '../..')

const modal = readFileSync(join(root, 'src/components/booking/BookingCalendarModal.tsx'), 'utf8')
assert.match(modal, /BookingCalendarModal/, 'modal de reserva presente')
assert.doesNotMatch(readFileSync(join(root, 'src/frontend/features/patient/PatientApp.tsx'), 'utf8'), /booksy/i)
assert.doesNotMatch(readFileSync(join(root, 'src/frontend/features/ai/AiBookingExperience.tsx'), 'utf8'), /booksy/i)

console.log('booking calendar checks ok')

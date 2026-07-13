import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const required = [
  'src/frontend/ds/Button.tsx',
  'src/frontend/ds/index.ts',
  'src/frontend/features/public/LandingPage.tsx',
  'src/frontend/features/admin/AdminApp.tsx',
  'src/frontend/features/patient/PatientApp.tsx',
  'src/frontend/layouts/PortalShell.tsx',
  'src/styles/v2/index.css',
  'docs/FRONTEND-V2.md'
]

for (const path of required) {
  assert.ok(existsSync(path), `Falta ${path}`)
}

const publicLayout = readFileSync('src/layouts/PublicLayout.astro', 'utf8')
assert.ok(publicLayout.includes('styles/v2/index.css'), 'PublicLayout debe usar CSS v2')
assert.ok(!publicLayout.includes('public-site.css'), 'PublicLayout no debe cargar CSS legacy')

const portalLayout = readFileSync('src/layouts/PortalLayout.astro', 'utf8')
assert.ok(portalLayout.includes('styles/v2/index.css'), 'PortalLayout debe usar CSS v2')
assert.ok(!portalLayout.includes('admin-dashboard.css'), 'PortalLayout no debe cargar CSS legacy')

console.log('frontend-v2 unit OK')

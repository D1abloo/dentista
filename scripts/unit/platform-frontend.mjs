import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '../..')

const usersApi = readFileSync(join(root, 'src/frontend/platform/api/usersApi.ts'), 'utf8')
assert.match(usersApi, /portal_token_hint/, 'usersApi debe eliminar portal_token_hint')
assert.match(usersApi, /stripSensitive/, 'usersApi debe sanitizar filas')

const usersPage = readFileSync(join(root, 'src/frontend/platform/pages/PlatformUsersPage.tsx'), 'utf8')
assert.doesNotMatch(usersPage, /JSON\.stringify/, 'Users page no debe mostrar JSON crudo')
assert.match(usersPage, /UsersDataTable/, 'Users page debe usar tabla')

const platformApp = readFileSync(join(root, 'src/frontend/platform/PlatformApp.tsx'), 'utf8')
assert.match(platformApp, /PlatformAdminShell/, 'PlatformApp debe usar nuevo shell')

const flags = readFileSync(join(root, 'src/lib/featureFlags.ts'), 'utf8')
assert.match(flags, /isTokenFeaturesEnabled/, 'feature flag de tokens requerido')

console.log('platform-frontend unit OK')

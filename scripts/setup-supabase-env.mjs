#!/usr/bin/env node
/**
 * Actualiza .env con credenciales de un proyecto Supabase nuevo.
 *
 * Uso:
 *   npm run local:setup -- <project-ref> <anon-key> <service-role-key> [database-url]
 *
 * Ejemplo:
 *   npm run local:setup -- abcdefghijklmnop eyJhbG... eyJhbG... "postgresql://postgres.[ref]:[pass]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres"
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { loadEnvFile, projectRoot } from './lib/load-env.mjs'

loadEnvFile()

const [projectRef, anonKey, serviceKey, databaseUrlArg] = process.argv.slice(2)

if (!projectRef || !anonKey || !serviceKey) {
  console.error(`Uso: npm run local:setup -- <project-ref> <anon-key> <service-role-key> [database-url]`)
  console.error('\nObtén las claves en: https://supabase.com/dashboard/project/<ref>/settings/api')
  console.error('DATABASE_URL en: Settings → Database → Connection string (URI, pooler 6543)')
  process.exit(1)
}

const envPath = join(projectRoot, '.env')
if (!existsSync(envPath)) {
  console.error('No existe .env. Copia .env.example → .env primero.')
  process.exit(1)
}

const publicUrl = `https://${projectRef}.supabase.co`
const databaseUrl = databaseUrlArg || process.env.DATABASE_URL || ''

let content = readFileSync(envPath, 'utf8')

const upsert = (key, value) => {
  const re = new RegExp(`^${key}=.*$`, 'm')
  const line = `${key}="${value}"`
  if (re.test(content)) content = content.replace(re, line)
  else content += `\n${line}\n`
}

upsert('PUBLIC_SUPABASE_URL', publicUrl)
upsert('PUBLIC_SUPABASE_ANON_KEY', anonKey)
upsert('SUPABASE_SERVICE_ROLE_KEY', serviceKey)
upsert('SUPABASE_URL', publicUrl)
if (databaseUrl) upsert('DATABASE_URL', databaseUrl)
upsert('PUBLIC_APP_URL', 'http://127.0.0.1:4321')
upsert('APP_BASE_URL', 'http://127.0.0.1:4321')

writeFileSync(envPath, content)
console.log('✓ .env actualizado')
console.log(`  PUBLIC_SUPABASE_URL=${publicUrl}`)
if (databaseUrl) console.log('  DATABASE_URL=...')
console.log('\nSiguiente: npm run local:bootstrap')

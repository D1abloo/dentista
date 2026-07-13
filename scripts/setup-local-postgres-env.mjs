#!/usr/bin/env node
/**
 * Configura .env para PostgreSQL directo (sin Supabase).
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { loadEnvFile, projectRoot } from './lib/load-env.mjs'

loadEnvFile()

const PG_PORT = process.env.DENTISTA_PG_PORT || '5434'
const PG_USER = process.env.DENTISTA_PG_USER || 'postgres'
const PG_PASS = process.env.DENTISTA_PG_PASS || 'postgres'
const PG_DB = process.env.DENTISTA_PG_DB || 'dentista'

const envPath = join(projectRoot, '.env')
if (!existsSync(envPath)) {
  console.error('No existe .env. Copia .env.example → .env primero.')
  process.exit(1)
}

let content = readFileSync(envPath, 'utf8')

const upsert = (key, value) => {
  const re = new RegExp(`^${key}=.*$`, 'm')
  const line = `${key}="${value}"`
  if (re.test(content)) content = content.replace(re, line)
  else content += `\n${line}\n`
}

const removeKeys = ['PUBLIC_SUPABASE_URL', 'SUPABASE_URL', 'PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'LOCAL_POSTGRES', 'PGRST_JWT_SECRET']
for (const key of removeKeys) {
  content = content.replace(new RegExp(`^${key}=.*\\n?`, 'm'), '')
}

upsert('DATABASE_URL', `postgresql://${PG_USER}:${PG_PASS}@127.0.0.1:${PG_PORT}/${PG_DB}`)
upsert('PUBLIC_APP_URL', 'http://127.0.0.1:4321')
upsert('APP_BASE_URL', 'http://127.0.0.1:4321')

writeFileSync(envPath, content)
console.log('✓ .env configurado para PostgreSQL directo')
console.log(`  DATABASE_URL=postgresql://${PG_USER}:***@127.0.0.1:${PG_PORT}/${PG_DB}`)
console.log('\nSiguiente: npm run local:pg:bootstrap')

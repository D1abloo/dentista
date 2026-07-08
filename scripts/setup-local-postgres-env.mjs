#!/usr/bin/env node
/**
 * Configura .env para PostgreSQL local (sin Supabase cloud).
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { loadEnvFile, projectRoot } from './lib/load-env.mjs'

loadEnvFile()

const PG_PORT = process.env.DENTISTA_PG_PORT || '5434'
const REST_PORT = process.env.DENTISTA_REST_PORT || '54321'
const PG_USER = process.env.DENTISTA_PG_USER || 'postgres'
const PG_PASS = process.env.DENTISTA_PG_PASS || 'postgres'
const PG_DB = process.env.DENTISTA_PG_DB || 'dentista'

const ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
const SERVICE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

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

upsert('LOCAL_POSTGRES', 'true')
upsert('DATABASE_URL', `postgresql://${PG_USER}:${PG_PASS}@127.0.0.1:${PG_PORT}/${PG_DB}`)
upsert('PUBLIC_SUPABASE_URL', `http://127.0.0.1:${REST_PORT}`)
upsert('SUPABASE_URL', `http://127.0.0.1:${REST_PORT}`)
upsert('PUBLIC_SUPABASE_ANON_KEY', ANON_KEY)
upsert('SUPABASE_SERVICE_ROLE_KEY', SERVICE_KEY)
upsert('PGRST_JWT_SECRET', 'super-secret-jwt-token-with-at-least-32-characters-long')
upsert('PUBLIC_APP_URL', 'http://127.0.0.1:4321')
upsert('APP_BASE_URL', 'http://127.0.0.1:4321')

writeFileSync(envPath, content)
console.log('✓ .env configurado para PostgreSQL local')
console.log('  LOCAL_POSTGRES=true')
console.log(`  DATABASE_URL=postgresql://${PG_USER}:***@127.0.0.1:${PG_PORT}/${PG_DB}`)
console.log(`  API REST → http://127.0.0.1:${REST_PORT}`)
console.log('\nSiguiente: npm run local:pg:bootstrap')

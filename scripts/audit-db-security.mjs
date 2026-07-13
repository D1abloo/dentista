#!/usr/bin/env node
/**
 * Auditoría de seguridad PostgreSQL: RLS y políticas.
 * Uso: node --env-file=.env scripts/audit-db-security.mjs
 */
import pg from 'pg'
import { loadEnvFile } from './lib/load-env.mjs'

loadEnvFile()

const dbUrl = process.env.DATABASE_URL

if (!dbUrl) {
  console.error('Falta DATABASE_URL')
  process.exit(1)
}

const isLocal = /@(127\.0\.0\.1|localhost):/.test(dbUrl)
const useSsl = process.env.DATABASE_SSL === 'true' || (!isLocal && /sslmode=require/i.test(dbUrl))

const client = new pg.Client({
  connectionString: dbUrl,
  ssl: useSsl ? { rejectUnauthorized: false } : false
})

const issues = []

await client.connect()

const noRls = await client.query(`
  select c.relname as table_name
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity
  order by 1
`)
if (noRls.rows.length) {
  issues.push({ severity: 'high', type: 'rls_disabled', tables: noRls.rows.map((r) => r.table_name) })
}

const noPolicies = await client.query(`
  select t.tablename
  from pg_tables t
  join pg_class c on c.relname = t.tablename
  join pg_namespace n on n.oid = c.relnamespace and n.nspname = t.schemaname
  where t.schemaname = 'public' and c.relkind = 'r' and c.relrowsecurity
    and not exists (
      select 1 from pg_policies p where p.schemaname = t.schemaname and p.tablename = t.tablename
    )
  order by 1
`)
if (noPolicies.rows.length) {
  issues.push({ severity: 'critical', type: 'rls_no_policies', tables: noPolicies.rows.map((r) => r.tablename) })
}

const auditCols = await client.query(`
  select column_name from information_schema.columns
  where table_schema='public' and table_name='audit_logs' and column_name='event_type'
`)
if (!auditCols.rows.length) {
  issues.push({ severity: 'medium', type: 'missing_migration', note: 'audit_logs.event_type missing' })
}

await client.end()

const report = {
  scannedAt: new Date().toISOString(),
  tablesWithoutRls: noRls.rows.length,
  rlsNoPolicies: noPolicies.rows.length,
  issueCount: issues.length,
  issues
}

console.log(JSON.stringify(report, null, 2))
process.exit(issues.some((i) => i.severity === 'critical' || i.severity === 'high') ? 1 : 0)

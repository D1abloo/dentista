#!/usr/bin/env node
/**
 * Aplica todas las migraciones PRO en orden (sin seeds demo 0002/0004/0005).
 * Uso: node --env-file=.env scripts/apply-all-migrations.mjs
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { connectPostgres } from './lib/pg-connect.mjs'
import { loadEnvFile } from './lib/load-env.mjs'

loadEnvFile()

const SKIP = new Set(['0002_seed.sql', '0004_seed_operations.sql', '0005_patient_records.sql'])

const LOCAL_BOOTSTRAP = 'local/postgres/0000_local_bootstrap.sql'

const MIGRATIONS = [
  '0001_schema.sql',
  '0003_operations.sql',
  '0006_multi_tenant_rls.sql',
  '0007_demo_app_state.sql',
  '0008_production_platform.sql',
  '0009_auth_bootstrap.sql',
  '0010_phase3_records_billing.sql',
  '0011_phase4_ops.sql',
  '0012_clinical_reports_align.sql',
  '0012_organization_branches.sql',
  '0013_clinical_reports_rls.sql',
  '0013_patient_portal_access.sql',
  '0014_profile_password_policy.sql',
  '0015_clinic_logo.sql',
  '0016_platform_inspect_audit.sql',
  '0017_patient_self_registration.sql',
  '0018_profiles_staff_patient_email.sql',
  '0019_patient_nhc.sql',
  '0020_nhc_numeric_plain.sql',
  '0021_schedule_blocks.sql',
  '0022_dentists_collegiate.sql',
  '0023_clinical_reports_lock.sql',
  '0024_clinical_professional_profiles.sql',
  '0025_schedule_blocks_all_professionals.sql',
  '0026_schedule_block_dentist_ids.sql',
  '0027_schedule_block_group.sql',
  '0028_rls_records_gaps.sql',
  '0029_independent_clinics_only.sql',
  '0030_audit_monitoring_system.sql',
  '0031_security_rls_hardening.sql',
  '0032_schedule_block_dentist_ids.sql',
  '0033_messages_from_patient.sql',
  '0034_staff_clinic_preferences.sql',
  '0035_organizations_staff_access.sql',
  '0036_invoice_fiscal_fields.sql',
  '0037_public_ai_booking.sql',
  '0038_patient_verification_ai_appointments.sql',
  '0039_rls_missing_tables.sql'
].filter((f) => !SKIP.has(f))

const startFrom = process.env.START_FROM
const queue = startFrom ? MIGRATIONS.slice(MIGRATIONS.indexOf(startFrom)) : MIGRATIONS
if (startFrom && queue[0] !== startFrom) {
  console.error(`START_FROM desconocido: ${startFrom}`)
  process.exit(1)
}

async function runFile(client, name, baseDir = 'supabase/migrations') {
  const path = join(process.cwd(), baseDir, name)
  const sql = readFileSync(path, 'utf8')
  console.log(`\n▶ ${name}`)
  await client.query(sql)
  console.log(`✓ ${name}`)
}

const client = await connectPostgres()
try {
  const before = await client.query(
    `select count(*)::int as n from pg_tables where schemaname = 'public'`
  )
  console.log(`Tablas public antes: ${before.rows[0]?.n ?? 0}`)

  try {
    await runFile(client, '0000_local_bootstrap.sql', 'local/postgres')
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (!/already exists|duplicate/i.test(msg)) {
      console.error('✗ bootstrap local:', msg)
      process.exit(1)
    }
    console.log('⊘ bootstrap local (ya aplicado)')
  }

  for (const file of queue) {
    try {
      await runFile(client, file)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (/already exists|duplicate/i.test(msg)) {
        console.log(`⊘ ${file} (ya aplicada, se omite)`)
        continue
      }
      console.error(`✗ ${file}:`, msg)
      process.exit(1)
    }
  }

  const after = await client.query(
    `select tablename from pg_tables where schemaname = 'public' order by tablename`
  )
  console.log(`\n✓ Migraciones listas. Tablas (${after.rows.length}):`)
  for (const row of after.rows.slice(0, 15)) console.log(`  - ${row.tablename}`)
  if (after.rows.length > 15) console.log(`  ... +${after.rows.length - 15} más`)
} finally {
  await client.end().catch(() => undefined)
}

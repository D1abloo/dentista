#!/usr/bin/env node
/**
 * Separa clínicas que comparten tenant_id (legacy multi-sede).
 * Equivalente a supabase/migrations/0029_independent_clinics_only.sql
 * Uso: node scripts/migrate-independent-clinics.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { loadEnvFile } from './lib/load-env.mjs';

loadEnvFile();

const url = process.env.SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const TABLES_WITH_CLINIC = [
  'profiles',
  'dentists',
  'treatments',
  'appointments',
  'invoices',
  'payments',
  'schedule_blocks',
  'clinical_reports',
  'messages',
  'patient_documents',
  'informed_consents'
];

async function columnExists(table, column) {
  const { error } = await db.from(table).select(column).limit(1);
  return !error;
}

async function updateTenantForClinic(table, clinicId, newTenantId) {
  if (!(await columnExists(table, 'clinic_id')) || !(await columnExists(table, 'tenant_id'))) return;
  const { error } = await db.from(table).update({ tenant_id: newTenantId }).eq('clinic_id', clinicId);
  if (error) throw new Error(`${table}: ${error.message}`);
}

async function main() {
  const { data: clinics, error } = await db.from('clinics').select('id, tenant_id, name, is_main_branch, created_at');
  if (error) throw error;

  const byTenant = new Map();
  for (const c of clinics ?? []) {
    if (!c.tenant_id) continue;
    const list = byTenant.get(c.tenant_id) ?? [];
    list.push(c);
    byTenant.set(c.tenant_id, list);
  }

  let split = 0;
  for (const [oldTenantId, group] of byTenant) {
    if (group.length <= 1) continue;

    const { data: tRow, error: tErr } = await db.from('tenants').select('*').eq('id', oldTenantId).single();
    if (tErr) throw tErr;

    const sorted = [...group].sort((a, b) => Number(b.is_main_branch) - Number(a.is_main_branch));

    for (const clinic of sorted) {
      const code = `${tRow.code ?? 'TEN'}-${String(clinic.id).replace(/-/g, '').slice(0, 8)}`;
      const { data: newTenant, error: insErr } = await db
        .from('tenants')
        .insert({
          code,
          name: clinic.name ?? tRow.name,
          type: tRow.type ?? 'clinica',
          owner_name: tRow.owner_name ?? clinic.name,
          email: tRow.email,
          phone: tRow.phone,
          address: clinic.address ?? tRow.address,
          active: tRow.active ?? true
        })
        .select('id')
        .single();
      if (insErr) throw insErr;

      const newId = newTenant.id;
      const { error: cUpd } = await db
        .from('clinics')
        .update({ tenant_id: newId, is_main_branch: true })
        .eq('id', clinic.id);
      if (cUpd) throw cUpd;

      for (const table of TABLES_WITH_CLINIC) {
        await updateTenantForClinic(table, clinic.id, newId);
      }

      console.log(`✓ ${clinic.name} → tenant ${newId.slice(0, 8)}…`);
      split++;
    }

    const { error: delErr } = await db.from('tenants').delete().eq('id', oldTenantId);
    if (delErr) console.warn(`  (no se pudo borrar tenant legacy ${oldTenantId}: ${delErr.message})`);
  }

  console.log(split ? `\n✓ ${split} clínicas separadas en tenants propios.` : '\n✓ No había clínicas multi-sede que separar.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

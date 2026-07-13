#!/usr/bin/env node
/**
 * Auditoría Supabase: clinical_reports, columnas y prueba de inserción.
 * Uso: node --env-file=.env scripts/audit-db-reports.mjs
 */
import { createDbClient } from './lib/db-client.mjs';
import { readFileSync } from 'node:fs';
import { loadEnvFile } from './lib/load-env.mjs';

loadEnvFile();

const db = createDbClient();

const report = { ok: true, issues: [], info: {} };

async function main() {
  const { data: clinics, error: ec } = await db.from('clinics').select('id, tenant_id, name').limit(5);
  if (ec) {
    report.ok = false;
    report.issues.push(`clinics: ${ec.message}`);
  } else {
    report.info.clinics = clinics?.length ?? 0;
    report.info.sampleClinic = clinics?.[0]?.id;
    report.info.sampleTenant = clinics?.[0]?.tenant_id;
  }

  const { data: patients, error: ep } = await db
    .from('profiles')
    .select('id, clinic_id, role, full_name')
    .eq('role', 'patient')
    .limit(3);
  if (ep) report.issues.push(`profiles: ${ep.message}`);
  else report.info.patients = patients?.length ?? 0;

  const { data: existing, error: er } = await db
    .from('clinical_reports')
    .select('id, tenant_id, patient_id, title, description, visible_to_patient, created_at')
    .limit(5);
  if (er) {
    report.ok = false;
    report.issues.push(`clinical_reports SELECT: ${er.message}`);
  } else {
    report.info.reportsCount = existing?.length ?? 0;
    const missingTenant = (existing ?? []).filter((r) => !r.tenant_id);
    if (missingTenant.length) {
      report.issues.push(`${missingTenant.length} informes sin tenant_id`);
    }
  }

  const tenantId = clinics?.[0]?.tenant_id;
  const patientId = patients?.[0]?.id;
  if (tenantId && patientId) {
    const probeId = crypto.randomUUID();
    const { data: inserted, error: ei } = await db
      .from('clinical_reports')
      .insert({
        id: probeId,
        tenant_id: tenantId,
        patient_id: patientId,
        title: '__AUDIT_PROBE__',
        description: 'Auditoría automática — eliminar',
        diagnosis: 'N/A',
        recommendations: 'N/A',
        uploaded_by: 'audit-script',
        visible_to_patient: false
      })
      .select('id')
      .single();

    if (ei) {
      report.ok = false;
      report.issues.push(`INSERT probe: ${ei.message} (code ${ei.code})`);
      if (ei.message?.includes('tenant_id') || ei.code === '42703') {
        report.issues.push('Ejecutar migración 0012_clinical_reports_align.sql');
      }
    } else {
      report.info.insertProbe = inserted?.id;
      await db.from('clinical_reports').delete().eq('id', probeId);
      report.info.insertProbeDeleted = true;
    }
  } else {
    report.issues.push('Sin clínica o paciente para prueba INSERT');
  }

  // RLS policies (via pg_policies not available from client — hint only)
  report.info.rlsNote =
    'clinical_reports tiene RLS activado; políticas deben estar en migración (revisar Supabase dashboard).';

  console.log(JSON.stringify(report, null, 2));
  process.exit(report.ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

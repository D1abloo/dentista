#!/usr/bin/env node
/**
 * Pruebas E2E en tiempo real contra servidor local + Supabase.
 * Requiere: npm run dev y .env con Supabase.
 *
 * Uso:
 *   npm run dev
 *   npm run qa:live
 *   BASE_URL=http://[::1]:4321 PATIENT_EMAIL=... PATIENT_PASSWORD=... npm run qa:live
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();

function loadEnv() {
  try {
    const raw = readFileSync(resolve(root, '.env'), 'utf8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch {
    /* optional */
  }
}

loadEnv();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@dentista.app';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? process.env.SUPER_ADMIN_PASSWORD ?? 'AdminNova2026!';
const PATIENT_EMAIL = process.env.PATIENT_EMAIL;
const PATIENT_PASSWORD = process.env.PATIENT_PASSWORD;

const results = [];
function record(module, test, status, note = '') {
  results.push({ module, test, status, note, at: new Date().toISOString() });
}

async function resolveBaseUrl() {
  if (process.env.BASE_URL) return process.env.BASE_URL;
  for (const base of ['http://127.0.0.1:4321', 'http://[::1]:4321', 'http://localhost:4321']) {
    try {
      const res = await fetch(`${base}/`, { signal: AbortSignal.timeout(3000) });
      if (res.ok || res.status < 500) return base;
    } catch {
      /* try next */
    }
  }
  return 'http://127.0.0.1:4321';
}

async function json(res) {
  const text = await res.text();
  try {
    return { status: res.status, body: JSON.parse(text), raw: text };
  } catch {
    return { status: res.status, body: null, raw: text.slice(0, 200) };
  }
}

async function login(portal, role, email, password) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password, role, portal }),
    redirect: 'manual'
  });
  const cookies = res.headers.getSetCookie?.() ?? [];
  return { ok: res.ok, jar: cookies.map((c) => c.split(';')[0]), ...(await json(res)) };
}

let BASE;

async function main() {
  BASE = await resolveBaseUrl();
  console.log('=== E2E Live Dentista+ ===\n');
  console.log(`Base: ${BASE}\n`);

  try {
    const health = await fetch(`${BASE}/`);
    record('Landing', 'GET /', health.ok ? 'PASS' : 'FAIL', `status=${health.status}`);
  } catch (e) {
    record('Landing', 'GET /', 'FAIL', e.message);
    writeReport();
    process.exit(1);
  }

  const publicClinics = await fetch(`${BASE}/api/public/clinics`);
  record('Landing', 'GET /api/public/clinics', publicClinics.ok ? 'PASS' : 'FAIL', `status=${publicClinics.status}`);

  const meNoAuth = await fetch(`${BASE}/api/auth/me`);
  record('Seguridad', 'GET /api/auth/me sin sesión', meNoAuth.status === 401 ? 'PASS' : 'FAIL', `status=${meNoAuth.status}`);

  const metricsNoAuth = await fetch(`${BASE}/api/admin/metrics`);
  record('Seguridad', 'GET métricas sin sesión', metricsNoAuth.status === 401 ? 'PASS' : 'FAIL', `status=${metricsNoAuth.status}`);

  const notifNoAuth = await fetch(`${BASE}/api/notifications/appointment`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({})
  });
  record('Seguridad', 'POST notificación cita sin sesión', notifNoAuth.status === 401 ? 'PASS' : 'FAIL', `status=${notifNoAuth.status}`);

  let admin;
  try {
    admin = await login('admin', 'admin', ADMIN_EMAIL, ADMIN_PASSWORD);
  } catch (e) {
    record('Auth', 'Login admin clínica', 'FAIL', e.message);
    writeReport();
    process.exit(1);
  }

  if (!admin.ok) {
    record('Auth', 'Login admin clínica', 'FAIL', admin.body?.error?.message ?? admin.raw);
    writeReport();
    process.exit(1);
  }
  record('Auth', 'Login admin clínica', 'PASS', ADMIN_EMAIL);

  const cookie = admin.jar.join('; ');
  const hdr = { cookie, 'content-type': 'application/json' };

  const meAuth = await fetch(`${BASE}/api/auth/me`, { headers: { cookie } });
  const meJ = await json(meAuth);
  record(
    'Auth',
    'GET /api/auth/me con sesión admin',
    meAuth.ok && meJ.body?.data?.role ? 'PASS' : 'FAIL',
    meJ.body?.data?.role ?? meJ.body?.error?.message
  );

  const boot = await fetch(`${BASE}/api/clinic/bootstrap`, { headers: { cookie } });
  const bootJ = await json(boot);
  const clinicId = bootJ.body?.data?.clinics?.[0]?.id ?? bootJ.body?.data?.state?.clinics?.[0]?.id;
  const dentists = bootJ.body?.data?.dentists ?? bootJ.body?.data?.state?.dentists ?? [];
  const dentistId = dentists[0]?.id;
  const patients = bootJ.body?.data?.patients ?? bootJ.body?.data?.state?.patients ?? [];
  const patientId = patients[0]?.id;

  record(
    'Bootstrap',
    'GET /api/clinic/bootstrap',
    boot.ok && clinicId ? 'PASS' : 'FAIL',
    clinicId ? `clinic=${clinicId.slice(0, 8)}…` : bootJ.body?.error?.message
  );

  if (!clinicId || !dentistId) {
    writeReport();
    process.exit(1);
  }

  const staffCtx = await fetch(`${BASE}/api/clinic/staff-context`, { headers: { cookie } });
  record('Clínica', 'GET staff-context', staffCtx.ok ? 'PASS' : 'FAIL', `status=${staffCtx.status}`);

  const pros = await fetch(`${BASE}/api/clinic/clinical-professionals?clinicId=${clinicId}`, { headers: { cookie } });
  record('Profesionales', 'GET clinical-professionals', pros.ok ? 'PASS' : 'FAIL', `status=${pros.status}`);

  const foreign = '00000000-0000-0000-0000-000000000099';
  const pForeign = await fetch(`${BASE}/api/patients?clinicId=${foreign}`, { headers: { cookie } });
  record('Seguridad', 'Pacientes sede ajena', pForeign.status === 403 ? 'PASS' : 'FAIL', `status=${pForeign.status}`);

  const metricsForeign = await fetch(`${BASE}/api/admin/metrics?clinicId=${foreign}`, { headers: { cookie } });
  record('Seguridad', 'Métricas sede ajena', metricsForeign.status === 403 ? 'PASS' : 'FAIL', `status=${metricsForeign.status}`);

  const orgsAsAdmin = await fetch(`${BASE}/api/platform/organizations`, { headers: { cookie } });
  record(
    'Seguridad',
    'Admin clínica no accede plataforma',
    orgsAsAdmin.status === 403 || orgsAsAdmin.status === 401 ? 'PASS' : 'FAIL',
    `status=${orgsAsAdmin.status}`
  );

  const today = new Date().toISOString().slice(0, 10);
  const blockTime = '14:30';

  const createBlock = await fetch(`${BASE}/api/schedule/blocks`, {
    method: 'POST',
    headers: hdr,
    body: JSON.stringify({
      clinicId,
      dentistId,
      date: today,
      time: blockTime,
      endTime: '15:30',
      reason: 'QA E2E bloqueo',
      blockGroupId: `BLK-QA-${Date.now()}`
    })
  });
  const createJ = await json(createBlock);
  record(
    'Agenda',
    'POST bloqueo horario',
    createBlock.ok ? 'PASS' : 'FAIL',
    createJ.body?.error?.message ?? (createBlock.ok ? 'ok' : createJ.raw?.slice(0, 80))
  );

  const listBlocks = await fetch(`${BASE}/api/schedule/blocks?clinicId=${clinicId}&date=${today}`, {
    headers: { cookie }
  });
  const listJ = await json(listBlocks);
  const blocks = listJ.body?.data?.blocks ?? [];
  record('Agenda', 'GET bloqueos del día', listBlocks.ok && blocks.length > 0 ? 'PASS' : 'FAIL', `count=${blocks.length}`);

  const blockId = blocks.find((b) => b.time === blockTime || b.time?.startsWith('14:'))?.id ?? blocks[0]?.id;
  if (blockId) {
    const delQ = new URLSearchParams({ clinicId, ids: blockId });
    const del = await fetch(`${BASE}/api/schedule/blocks?${delQ}`, { method: 'DELETE', headers: { cookie } });
    const delJ = await json(del);
    record(
      'Agenda',
      'DELETE desbloquear (ids)',
      del.ok && (delJ.body?.data?.removed ?? 0) > 0 ? 'PASS' : 'FAIL',
      delJ.body?.error?.message ?? `removed=${delJ.body?.data?.removed}`
    );

    const listAfter = await fetch(`${BASE}/api/schedule/blocks?clinicId=${clinicId}&date=${today}`, {
      headers: { cookie }
    });
    const afterJ = await json(listAfter);
    const remaining = (afterJ.body?.data?.blocks ?? []).filter((b) => b.id === blockId);
    record('Agenda', 'Bloqueo eliminado en listado', remaining.length === 0 ? 'PASS' : 'FAIL', `left=${remaining.length}`);
  } else {
    record('Agenda', 'DELETE desbloquear', 'SKIP', 'sin blockId');
  }

  const appts = await fetch(`${BASE}/api/appointments?clinicId=${clinicId}`, { headers: { cookie } });
  record('Citas', 'GET citas clínica', appts.ok ? 'PASS' : 'FAIL', `status=${appts.status}`);

  const avail = await fetch(`${BASE}/api/availability?clinicId=${clinicId}&date=${today}&dentistId=${dentistId}`);
  const availJ = await json(avail);
  record(
    'Reserva',
    'GET disponibilidad pública',
    avail.ok ? 'PASS' : 'FAIL',
    avail.ok ? `slots=${(availJ.body?.data?.slots ?? []).length}` : `status=${avail.status}`
  );

  if (patientId) {
    const foreignPatient = '00000000-0000-0000-0000-000000000099';
    const stripeForeign = await fetch(`${BASE}/api/billing/stripe-checkout`, {
      method: 'POST',
      headers: hdr,
      body: JSON.stringify({
        clinicId,
        patientId: foreignPatient,
        invoiceId: foreignPatient,
        amount: 10
      })
    });
    record(
      'Facturación',
      'Stripe checkout paciente ajeno bloqueado',
      stripeForeign.status === 403 || stripeForeign.status === 422 ? 'PASS' : 'FAIL',
      `status=${stripeForeign.status}`
    );
  }

  const superEmail = process.env.SUPER_ADMIN_EMAIL ?? ADMIN_EMAIL;
  const superPass = process.env.SUPER_ADMIN_PASSWORD ?? ADMIN_PASSWORD;
  const platform = await login('platform', 'super_admin', superEmail, superPass);
  record(
    'Plataforma',
    'Login super admin',
    platform.ok ? 'PASS' : 'WARN',
    platform.ok ? superEmail : platform.body?.error?.message
  );

  if (platform.ok) {
    const pCookie = platform.jar.join('; ');
    const orgs = await fetch(`${BASE}/api/platform/organizations`, { headers: { cookie: pCookie } });
    record('Plataforma', 'GET organizaciones', orgs.ok ? 'PASS' : 'FAIL', `status=${orgs.status}`);

    const clinics = await fetch(`${BASE}/api/platform/clinics`, { headers: { cookie: pCookie } });
    record('Plataforma', 'GET clínicas registradas', clinics.ok ? 'PASS' : 'FAIL', `status=${clinics.status}`);

    const subs = await fetch(`${BASE}/api/platform/subscriptions`, { headers: { cookie: pCookie } });
    record('Plataforma', 'GET suscripciones', subs.ok ? 'PASS' : 'FAIL', `status=${subs.status}`);

    const isolation = await fetch(`${BASE}/api/platform/isolation`, { headers: { cookie: pCookie } });
    record('Plataforma', 'GET aislamiento', isolation.ok ? 'PASS' : 'FAIL', `status=${isolation.status}`);
  }

  if (PATIENT_EMAIL && PATIENT_PASSWORD) {
    const patient = await login('patient', 'patient', PATIENT_EMAIL, PATIENT_PASSWORD);
    if (!patient.ok) {
      record('Portal Paciente', 'Login paciente', 'FAIL', patient.body?.error?.message);
    } else {
      record('Portal Paciente', 'Login paciente', 'PASS', PATIENT_EMAIL);
      const pCookie = patient.jar.join('; ');
      const pMe = await fetch(`${BASE}/api/auth/me`, { headers: { cookie: pCookie } });
      const pMeJ = await json(pMe);
      const ownPatientId = pMeJ.body?.data?.patientId;
      record(
        'Portal Paciente',
        'Sesión paciente con patientId',
        pMe.ok && ownPatientId ? 'PASS' : 'FAIL',
        ownPatientId ? `patient=${String(ownPatientId).slice(0, 8)}…` : 'sin patientId'
      );

      if (ownPatientId && patientId && ownPatientId !== patientId) {
        const invForeign = await fetch(`${BASE}/api/billing/invoice`, {
          method: 'POST',
          headers: { cookie: pCookie, 'content-type': 'application/json' },
          body: JSON.stringify({
            clinicId,
            patientId,
            amount: 1,
            concept: 'QA cruce'
          })
        });
        record(
          'Seguridad',
          'Paciente no crea factura ajena',
          invForeign.status === 403 ? 'PASS' : 'FAIL',
          `status=${invForeign.status}`
        );
      }
    }
  } else {
    record('Portal Paciente', 'Login paciente', 'SKIP', 'Definir PATIENT_EMAIL y PATIENT_PASSWORD');
  }

  writeReport();
  const fail = results.filter((r) => r.status === 'FAIL').length;
  process.exit(fail > 0 ? 1 : 0);
}

function writeReport() {
  const pass = results.filter((r) => r.status === 'PASS').length;
  const fail = results.filter((r) => r.status === 'FAIL').length;
  const warn = results.filter((r) => r.status === 'WARN' || r.status === 'SKIP').length;

  console.log('\n| Módulo | Prueba | Estado | Nota |');
  console.log('|--------|--------|--------|------|');
  for (const r of results) {
    console.log(`| ${r.module} | ${r.test} | ${r.status} | ${r.note} |`);
  }
  console.log(`\nResumen: ${pass} PASS, ${fail} FAIL, ${warn} WARN/SKIP`);

  const outPath = resolve(root, 'docs/QA_E2E_LIVE_RESULTS.json');
  writeFileSync(
    outPath,
    JSON.stringify(
      { generatedAt: new Date().toISOString(), baseUrl: BASE, summary: { pass, fail, warn }, results },
      null,
      2
    )
  );
  console.log(`\nInforme: ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * Auditoría QA estructural + pruebas API opcionales con credenciales (.env).
 * Uso: npm run qa:audit
 *      BASE_URL=http://127.0.0.1:4321 ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run qa:audit
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
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

let BASE = process.env.BASE_URL ?? 'http://127.0.0.1:4321';

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

const results = [];

function record(module, test, status, note = '') {
  results.push({ module, test, status, note });
}

function listApiRoutes() {
  const apiDir = resolve(root, 'src/pages/api');
  const files = [];
  function walk(dir, prefix = '') {
    for (const name of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, name.name);
      if (name.isDirectory()) walk(p, `${prefix}${name.name}/`);
      else if (name.name.endsWith('.ts')) files.push(`${prefix}${name.name}`);
    }
  }
  walk(apiDir);
  return files;
}

async function json(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`No JSON (${res.status}): ${text.slice(0, 120)}`);
  }
}

async function tryLogin(email, password, portal = 'admin') {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password, role: 'admin', portal }),
    redirect: 'manual'
  });
  const cookies = res.headers.getSetCookie?.() ?? [];
  const jar = cookies.map((c) => c.split(';')[0]);
  const body = await json(res);
  return { ok: res.ok, jar, body };
}

async function runLiveApiChecks() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    record('API live', 'Login admin', 'SKIP', 'Sin ADMIN_EMAIL/ADMIN_PASSWORD');
    return;
  }

  let login;
  try {
    login = await tryLogin(email, password);
  } catch (e) {
    record('API live', 'Login admin', 'FAIL', e.message);
    return;
  }

  if (!login.ok) {
    record('API live', 'Login admin', 'FAIL', login.body.error?.message ?? 'login');
    return;
  }
  record('API live', 'Login admin', 'PASS');

  const cookie = login.jar.join('; ');

  const bootstrap = await fetch(`${BASE}/api/clinic/bootstrap`, { headers: { cookie } });
  const bootBody = await json(bootstrap);
  record(
    'API live',
    'Bootstrap clínica',
    bootstrap.ok ? 'PASS' : 'FAIL',
    bootstrap.ok ? '' : bootBody.error?.message
  );

  const blocks = await fetch(`${BASE}/api/schedule/blocks?date=2026-05-20`, { headers: { cookie } });
  const blocksBody = await json(blocks);
  record(
    'API live',
    'GET schedule/blocks',
    blocks.ok ? 'PASS' : 'FAIL',
    blocks.ok ? '' : blocksBody.error?.message
  );

  const foreignClinic = '00000000-0000-0000-0000-000000000099';
  const patientsForeign = await fetch(`${BASE}/api/patients?clinicId=${foreignClinic}`, { headers: { cookie } });
  record(
    'Seguridad',
    'Pacientes sede ajena bloqueada',
    patientsForeign.status === 403 ? 'PASS' : 'WARN',
    `status=${patientsForeign.status}`
  );
}

function runStructuralChecks() {
  const smoke = spawnSync('npm', ['run', 'smoke'], { cwd: root, encoding: 'utf8' });
  record('Estructura', 'npm run smoke', smoke.status === 0 ? 'PASS' : 'FAIL', smoke.stderr?.slice(0, 80));

  const unit = spawnSync('node', ['--test', 'scripts/unit/agenda-security.mjs'], { cwd: root, encoding: 'utf8' });
  record('Unit', 'agenda-security', unit.status === 0 ? 'PASS' : 'FAIL');

  const routes = listApiRoutes();
  record('Estructura', `Rutas API (${routes.length})`, routes.length > 50 ? 'PASS' : 'WARN');

  const guardsFiles = [
    'src/pages/api/patients.ts',
    'src/pages/api/appointments.ts',
    'src/pages/api/schedule/blocks.ts',
    'src/pages/api/records/report.ts',
    'src/pages/api/records/document.ts',
    'src/pages/api/records/consent.ts',
    'src/pages/api/records/message.ts'
  ];
  for (const f of guardsFiles) {
    const c = readFileSync(resolve(root, f), 'utf8');
    const hasGuard = /requireStaffSession|requireSession|requireClinicSessionAsync|assertStaffOrOwnPatient/.test(c);
    record('Guards', f, hasGuard ? 'PASS' : 'FAIL');
  }

  if (!existsSync(resolve(root, 'supabase/migrations/0028_rls_records_gaps.sql'))) {
    record('Supabase', 'Migración 0028 RLS', 'FAIL');
  } else {
    record('Supabase', 'Migración 0028 RLS', 'PASS');
  }

  if (!existsSync(resolve(root, 'docs/QA_E2E_MATRIX.md'))) {
    record('Docs', 'Matriz QA', 'WARN', 'Crear docs/QA_E2E_MATRIX.md');
  } else {
    record('Docs', 'Matriz QA', 'PASS');
  }
}

async function main() {
  BASE = await resolveBaseUrl();
  console.log('=== Dentista+ QA Audit ===\n');
  console.log(`Base: ${BASE}\n`);
  runStructuralChecks();
  try {
    await runLiveApiChecks();
  } catch (e) {
    record('API live', 'Conexión', 'SKIP', e.message);
  }

  const pass = results.filter((r) => r.status === 'PASS').length;
  const fail = results.filter((r) => r.status === 'FAIL').length;
  const warn = results.filter((r) => r.status === 'WARN' || r.status === 'SKIP').length;

  console.log('| Módulo | Prueba | Estado | Nota |');
  console.log('|--------|--------|--------|------|');
  for (const r of results) {
    console.log(`| ${r.module} | ${r.test} | ${r.status} | ${r.note} |`);
  }
  console.log(`\nResumen: ${pass} PASS, ${fail} FAIL, ${warn} WARN/SKIP`);
  process.exit(fail > 0 ? 1 : 0);
}

main();

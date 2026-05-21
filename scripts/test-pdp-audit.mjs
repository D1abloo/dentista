#!/usr/bin/env node
/**
 * Prueba flujo de auditoría PdP: listado, filtro por profesional y export CSV.
 * Requiere sesión admin (cookies) o variables ADMIN_EMAIL / ADMIN_PASSWORD.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:4321';

function loadEnv() {
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env'), 'utf8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch {
    /* optional */
  }
}

loadEnv();

const email = process.env.ADMIN_EMAIL ?? 'admin@dentista.app';
const password = process.env.ADMIN_PASSWORD ?? 'AdminNova2026!';

async function json(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Respuesta no JSON (${res.status}): ${text.slice(0, 200)}`);
  }
}

async function login(cookieJar) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password, role: 'admin', portal: 'admin' }),
    redirect: 'manual'
  });
  const setCookie = res.headers.getSetCookie?.() ?? [];
  for (const c of setCookie) cookieJar.push(c.split(';')[0]);
  const body = await json(res);
  if (!res.ok) throw new Error(body.error?.message ?? `Login falló (${res.status})`);
  return body;
}

function cookieHeader(jar) {
  return jar.join('; ');
}

async function getAudit(jar, staffProfileId) {
  const qs = new URLSearchParams({ audit: '1' });
  if (staffProfileId) qs.set('staffProfileId', staffProfileId);
  const res = await fetch(`${BASE}/api/admin/portal-access?${qs}`, {
    headers: { cookie: cookieHeader(jar) }
  });
  const body = await json(res);
  if (!res.ok) throw new Error(body.error?.message ?? `Audit GET ${res.status}`);
  return body.data;
}

function toCsvRow(row) {
  return [
    row.created_at,
    row.staff_name ?? '',
    row.event_type,
    row.resource_label ?? row.page_path ?? '',
    row.patient_name ?? ''
  ].join(',');
}

async function main() {
  const jar = [];
  console.log('→ Login admin', email);
  await login(jar);

  console.log('→ Listar auditoría (todos)');
  const all = await getAudit(jar);
  const rows = all.audit ?? [];
  console.log(`   ${rows.length} registros, ${(all.staffProfiles ?? []).length} profesionales en filtro`);

  if (rows.length) {
    console.log('   Último:', rows[0].event_type, rows[0].staff_name, rows[0].created_at);
  }

  console.log('→ Filtro "me"');
  const mine = await getAudit(jar, 'me');
  console.log(`   ${(mine.audit ?? []).length} registros propios`);

  if (rows.length) {
    const csv = ['fecha,profesional,evento,detalle,paciente', ...rows.slice(0, 5).map(toCsvRow)].join('\n');
    console.log('→ Muestra CSV (5 filas):\n' + csv);
  } else {
    console.log('   Sin registros aún. Crea un token en /admin/acceso-portal y entra al PdP.');
  }

  console.log('\nOK auditoría PdP API');
}

main().catch((e) => {
  console.error('FAIL', e.message);
  process.exit(1);
});

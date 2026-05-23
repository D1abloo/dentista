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
const PATIENT_EMAIL = process.env.PATIENT_EMAIL ?? 'maria.gonzalez@clinicadentalnova.es';
const PATIENT_PASSWORD = process.env.PATIENT_PASSWORD ?? ADMIN_PASSWORD;
const QA_SEED_ORG = process.env.QA_SEED_ORG !== '0';

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

function futureStartsAt(daysAhead = 14, hour = 11, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(hour)}:${pad(minute)}:00+02:00`;
}

function pickPatient(patients) {
  if (!patients?.length) return null;
  return patients.find((p) => p.email) ?? patients[0];
}

async function runClinicalFlows(cookie, hdr, ctx) {
  const { clinicId, dentistId, patients } = ctx;
  const patient = pickPatient(patients);
  if (!patient?.id) {
    record('Citas', 'Crear cita QA', 'SKIP', 'sin pacientes en bootstrap');
    return;
  }

  const patientId = patient.id;
  const patientName = patient.fullName ?? patient.name ?? 'Paciente QA';
  const patientEmail = patient.email;

  const trRes = await fetch(`${BASE}/api/treatments?clinicId=${clinicId}`, { headers: { cookie } });
  const trJ = await json(trRes);
  const treatmentId = (trJ.body?.data ?? [])[0]?.id;
  if (!treatmentId) {
    record('Citas', 'Crear cita QA', 'SKIP', 'sin tratamientos');
    return;
  }

  const startsAt = futureStartsAt(21, 11, 0);
  const createAppt = await fetch(`${BASE}/api/appointments`, {
    method: 'POST',
    headers: hdr,
    body: JSON.stringify({
      clinicId,
      patientId,
      patientName,
      patientEmail,
      dentistId,
      treatmentId,
      roomName: 'Gabinete 1',
      startsAt,
      notes: 'Cita QA E2E automatizada'
    })
  });
  const apptJ = await json(createAppt);
  const apptId = apptJ.body?.data?.id;
  record(
    'Citas',
    'POST crear cita',
    createAppt.ok && apptId ? 'PASS' : 'FAIL',
    apptJ.body?.error?.message ?? (apptId ? apptId.slice(0, 8) + '…' : createAppt.status)
  );
  if (!apptId) return;

  const confirm = await fetch(`${BASE}/api/appointments`, {
    method: 'PATCH',
    headers: hdr,
    body: JSON.stringify({ clinicId, appointmentId: apptId, action: 'confirm' })
  });
  record('Citas', 'PATCH confirmar cita', confirm.ok ? 'PASS' : 'FAIL', `status=${confirm.status}`);

  const report = await fetch(`${BASE}/api/records/report`, {
    method: 'POST',
    headers: hdr,
    body: JSON.stringify({
      clinicId,
      patientId,
      appointmentId: apptId,
      title: 'Informe QA E2E',
      description: 'Exploración y valoración inicial automatizada.',
      diagnosis: 'Caries superficial en pieza 16.',
      recommendations: 'Control en 6 meses y higiene reforzada.',
      visibleToPatient: true,
      uploadedBy: 'QA E2E'
    })
  });
  const reportJ = await json(report);
  const reportId = reportJ.body?.data?.id;
  record(
    'Informes',
    'POST informe clínico visible PdP',
    report.ok && reportId ? 'PASS' : 'FAIL',
    reportJ.body?.error?.message ?? (reportId ? 'ok' : report.status)
  );

  const invoice = await fetch(`${BASE}/api/billing/invoice`, {
    method: 'POST',
    headers: hdr,
    body: JSON.stringify({
      clinicId,
      patientId,
      appointmentId: apptId,
      amount: 85.5,
      concept: 'Revisión QA E2E',
      status: 'pendiente'
    })
  });
  const invJ = await json(invoice);
  const invoiceId = invJ.body?.data?.id;
  record(
    'Facturación',
    'POST crear factura',
    invoice.ok && invoiceId ? 'PASS' : 'FAIL',
    invJ.body?.error?.message ?? `status=${invoice.status}`
  );

  if (invoiceId) {
    const payment = await fetch(`${BASE}/api/billing/payment`, {
      method: 'POST',
      headers: hdr,
      body: JSON.stringify({
        clinicId,
        patientId,
        invoiceId,
        amount: 85.5,
        provider: 'manual',
        status: 'completado'
      })
    });
    record('Pagos', 'POST registrar pago', payment.ok ? 'PASS' : 'FAIL', `status=${payment.status}`);
  }

  const doc = await fetch(`${BASE}/api/records/document`, {
    method: 'POST',
    headers: hdr,
    body: JSON.stringify({
      clinicId,
      patientId,
      appointmentId: apptId,
      type: 'otro',
      title: 'Documento QA E2E',
      description: 'Adjunto de prueba automatizada.',
      visibility: 'paciente'
    })
  });
  record('Documentos', 'POST documento visible PdP', doc.ok ? 'PASS' : 'FAIL', `status=${doc.status}`);

  const msg = await fetch(`${BASE}/api/records/message`, {
    method: 'POST',
    headers: hdr,
    body: JSON.stringify({
      clinicId,
      patientId,
      subject: 'Mensaje QA E2E',
      body: 'Su informe y factura están disponibles en el portal.',
      channel: 'app',
      type: 'clinica'
    })
  });
  record('Mensajes', 'POST mensaje a paciente', msg.ok ? 'PASS' : 'FAIL', `status=${msg.status}`);

  const cancel = await fetch(`${BASE}/api/appointments`, {
    method: 'PATCH',
    headers: hdr,
    body: JSON.stringify({ clinicId, appointmentId: apptId, action: 'cancel', notes: 'Limpieza QA E2E' })
  });
  record('Citas', 'PATCH cancelar cita QA', cancel.ok ? 'PASS' : 'WARN', `status=${cancel.status}`);
}

async function tryPatientPortalLogin() {
  const candidates = [
    [PATIENT_EMAIL, PATIENT_PASSWORD],
    ['maria.gonzalez@clinicadentalnova.es', ADMIN_PASSWORD],
    [ADMIN_EMAIL, ADMIN_PASSWORD]
  ];
  const seen = new Set();
  for (const [email, password] of candidates) {
    const key = `${email}:${password}`;
    if (seen.has(key) || !email || !password) continue;
    seen.add(key);
    const attempt = await login('patient', 'patient', email, password);
    if (attempt.ok) return { ...attempt, email };
  }
  return { ok: false, email: PATIENT_EMAIL, body: { error: { message: 'Ningún paciente de prueba pudo iniciar sesión.' } } };
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

  await runClinicalFlows(cookie, hdr, { clinicId, dentistId, patients });

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

    if (QA_SEED_ORG) {
      const orgsJ = await json(orgs);
      const orgList = orgsJ.body?.data ?? [];
      const medClinics = orgList.filter((o) =>
        String(o.tenant_name ?? o.name ?? '').toLowerCase().includes('mediterr')
      );
      const allIndependent = medClinics.every((o) => (o.branch_count ?? 1) <= 1);
      if (medClinics.length >= 2 && allIndependent) {
        record('Plataforma', 'Clínicas Mediterráneo independientes', 'PASS', `count=${medClinics.length}`);
      } else if (medClinics.length > 0 && !allIndependent) {
        record('Plataforma', 'Clínicas Mediterráneo independientes', 'FAIL', 'tenant compartido legacy');
      } else if (medClinics.length > 0) {
        record('Plataforma', 'Clínicas Mediterráneo independientes', 'WARN', 'falta segunda clínica');
      } else {
        const createOrg = await fetch(`${BASE}/api/platform/organizations`, {
          method: 'POST',
          headers: { cookie: pCookie, 'content-type': 'application/json' },
          body: JSON.stringify({
            organizationName: 'Grupo Dental Mediterráneo',
            ownerName: 'Admin Org Mediterráneo',
            email: 'mediterraneo.e2e@dentista.app',
            phone: '+34 961 100 100',
            address: 'Comunidad Valenciana',
            branches: [
              { name: 'Clínica Dental Mediterráneo Centro', city: 'Valencia', phone: '+34 961 100 101' },
              { name: 'Clínica Dental Mediterráneo Norte', city: 'Castellón', phone: '+34 964 100 102' }
            ],
            createAdmin: true,
            adminPassword: ADMIN_PASSWORD
          })
        });
        const createJ = await json(createOrg);
        record(
          'Plataforma',
          'POST clínicas independientes Mediterráneo',
          createOrg.ok ? 'PASS' : 'WARN',
          createJ.body?.error?.message ?? `status=${createOrg.status}`
        );
      }
    }
  }

  const patient = await tryPatientPortalLogin();
  if (!patient.ok) {
    record('Portal Paciente', 'Login paciente', 'FAIL', patient.body?.error?.message);
  } else {
    record('Portal Paciente', 'Login paciente', 'PASS', patient.email);
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

    const pAppts = await fetch(`${BASE}/api/appointments?clinicId=${clinicId}`, { headers: { cookie: pCookie } });
    const pApptJ = await json(pAppts);
    const onlyOwn =
      pAppts.ok &&
      (pApptJ.body?.data ?? []).every((a) => a.patientId === ownPatientId);
    record(
      'Portal Paciente',
      'GET citas solo propias',
      onlyOwn ? 'PASS' : 'FAIL',
      `count=${(pApptJ.body?.data ?? []).length}`
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

#!/usr/bin/env node
/**
 * Semilla PRO: clínica ficticia operativa + admin@dentista.app + pacientes.
 *
 * Requiere: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Opcional: SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD, CLINIC_DEFAULT_PASSWORD
 *
 * Uso: npm run seed:clinic
 */

import { createDbClient } from './lib/db-client.mjs';
import { loadEnvFile } from './lib/load-env.mjs';

loadEnvFile();

const db = createDbClient();

const CLINIC = {
  slug: 'clinica-dental-nova',
  name: 'Clínica Dental Nova',
  email: 'contacto@clinicadentalnova.es',
  phone: '+34 932 180 420',
  address: 'Carrer de Provença 312, 08009 Barcelona',
  timezone: 'Europe/Madrid'
};

const TENANT = {
  code: 'TEN-NOVA-BCN',
  name: 'Clínica Dental Nova S.L.',
  owner: 'Dr. Javier Nova',
  email: CLINIC.email,
  phone: CLINIC.phone,
  address: CLINIC.address
};

const REMOVED_DEMO_SLUGS = ['demo-presentacion'];
const REMOVED_DEMO_TENANT_CODES = ['TEN-DEMO-PRO'];
const REMOVED_DEMO_EMAIL_SUFFIX = '@demo.dentista.app';

const ADMIN_EMAIL = (process.env.SUPER_ADMIN_EMAIL || 'admin@dentista.app').toLowerCase();
const ADMIN_NAME = process.env.SUPER_ADMIN_NAME || 'Dr. Javier Nova';
const PASSWORD = process.env.SUPER_ADMIN_PASSWORD || process.env.CLINIC_DEFAULT_PASSWORD;

if (!PASSWORD || PASSWORD.length < 6) {
  console.error('Define SUPER_ADMIN_PASSWORD o CLINIC_DEFAULT_PASSWORD (mín. 6 caracteres).');
  process.exit(1);
}

const PATIENTS = [
  { email: 'maria.gonzalez@clinicadentalnova.es', name: 'María González', phone: '+34 612 340 101' },
  { email: 'carlos.ruiz@clinicadentalnova.es', name: 'Carlos Ruiz', phone: '+34 612 340 102' },
  { email: 'ana.torres@clinicadentalnova.es', name: 'Ana Torres', phone: '+34 612 340 103' },
  { email: 'lucia.mendez@clinicadentalnova.es', name: 'Lucía Méndez', phone: '+34 612 340 104' }
];

const PERMS_EXECUTE = [
  'admin:*',
  'clinic:manage',
  'appointments:write',
  'clinical_notes:write',
  'invoices:write',
  'billing:execute',
  'portal:read',
  'site:write'
];

async function findAuthUserByEmail(email) {
  let page = 1;
  while (true) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = (data.users ?? []).find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (hit) return hit;
    if ((data.users ?? []).length < 200) break;
    page++;
  }
  return null;
}

async function deleteAuthUserByEmail(email) {
  const user = await findAuthUserByEmail(email);
  if (!user) return;
  const { error } = await db.auth.admin.deleteUser(user.id);
  if (error) throw error;
  console.log(`  ✗ Usuario Auth eliminado: ${email}`);
}

async function purgeLegacyDemo() {
  console.log('Limpiando clínicas demo anteriores…');

  for (const slug of REMOVED_DEMO_SLUGS) {
    const { data: clinic } = await db.from('clinics').select('id').eq('slug', slug).maybeSingle();
    if (clinic?.id) {
      const { error } = await db.from('clinics').delete().eq('id', clinic.id);
      if (error) throw error;
      console.log(`  ✗ Clínica eliminada: ${slug}`);
    }
  }

  for (const code of REMOVED_DEMO_TENANT_CODES) {
    const { data: tenant } = await db.from('tenants').select('id').eq('code', code).maybeSingle();
    if (tenant?.id) {
      const { error } = await db.from('tenants').delete().eq('id', tenant.id);
      if (error) throw error;
      console.log(`  ✗ Tenant eliminado: ${code}`);
    }
  }

  let page = 1;
  while (true) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    for (const u of data.users ?? []) {
      if (u.email?.toLowerCase().endsWith(REMOVED_DEMO_EMAIL_SUFFIX)) {
        await db.auth.admin.deleteUser(u.id);
        console.log(`  ✗ Usuario Auth eliminado: ${u.email}`);
      }
    }
    if ((data.users ?? []).length < 200) break;
    page++;
  }
}

async function upsertTenant() {
  const { data: existing } = await db.from('tenants').select('id').eq('code', TENANT.code).maybeSingle();
  if (existing?.id) {
    await db
      .from('tenants')
      .update({
        name: TENANT.name,
        owner_name: TENANT.owner,
        email: TENANT.email,
        phone: TENANT.phone,
        address: TENANT.address,
        active: true
      })
      .eq('id', existing.id);
    return existing.id;
  }

  const { data, error } = await db
    .from('tenants')
    .insert({
      code: TENANT.code,
      name: TENANT.name,
      type: 'clinica',
      owner_name: TENANT.owner,
      email: TENANT.email,
      phone: TENANT.phone,
      address: TENANT.address,
      active: true
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

async function upsertClinic(tenantId) {
  const { data: existing } = await db.from('clinics').select('id').eq('slug', CLINIC.slug).maybeSingle();
  const payload = {
    name: CLINIC.name,
    timezone: CLINIC.timezone,
    tenant_id: tenantId,
    status: 'active',
    subscription_plan: 'professional',
    approved_at: new Date().toISOString(),
    phone: CLINIC.phone,
    email: CLINIC.email,
    address: CLINIC.address
  };

  if (existing?.id) {
    await db.from('clinics').update(payload).eq('id', existing.id);
    return existing.id;
  }

  const { data, error } = await db
    .from('clinics')
    .insert({ ...payload, slug: CLINIC.slug })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

async function upsertSubscription(clinicId) {
  await db.from('clinic_subscriptions').upsert(
    {
      clinic_id: clinicId,
      plan: 'professional',
      status: 'active',
      seats: 10,
      renews_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    },
    { onConflict: 'clinic_id' }
  );
}

async function upsertRolePermissions(clinicId) {
  for (const permission of PERMS_EXECUTE) {
    await db.from('role_permissions').upsert(
      { clinic_id: clinicId, role: 'clinic_admin', permission, enabled: true },
      { onConflict: 'clinic_id,role,permission' }
    );
  }
  await db.from('role_permissions').upsert(
    { clinic_id: clinicId, role: 'patient', permission: 'portal:read', enabled: true },
    { onConflict: 'clinic_id,role,permission' }
  );
}

async function ensureDentists(clinicId, tenantId) {
  const specs = [
    { name: 'Dra. Laura Sánchez', specialty: 'Ortodoncia', rating: 4.9, reviews: 126 },
    { name: 'Dr. Carlos Ramírez', specialty: 'Implantología', rating: 4.8, reviews: 98 },
    { name: 'Dra. Ana Torres', specialty: 'Estética dental', rating: 4.9, reviews: 74 }
  ];
  const ids = [];
  for (const d of specs) {
    const { data: ex } = await db
      .from('dentists')
      .select('id')
      .eq('clinic_id', clinicId)
      .eq('name', d.name)
      .maybeSingle();
    if (ex?.id) {
      ids.push(ex.id);
      continue;
    }
    const { data, error } = await db
      .from('dentists')
      .insert({
        clinic_id: clinicId,
        tenant_id: tenantId,
        name: d.name,
        specialty: d.specialty,
        rating: d.rating,
        reviews_count: d.reviews
      })
      .select('id')
      .single();
    if (error) throw error;
    ids.push(data.id);
  }
  return ids;
}

async function ensureTreatments(clinicId, tenantId) {
  const items = [
    { name: 'Limpieza dental profesional', category: 'Preventiva', duration: 45, price: 8500 },
    { name: 'Blanqueamiento LED', category: 'Estética', duration: 60, price: 28900 },
    { name: 'Revisión y diagnóstico', category: 'Preventiva', duration: 30, price: 5500 },
    { name: 'Urgencia dental', category: 'Urgencias', duration: 30, price: 9500 }
  ];
  const ids = [];
  for (const t of items) {
    const { data: ex } = await db
      .from('treatments')
      .select('id')
      .eq('clinic_id', clinicId)
      .eq('name', t.name)
      .maybeSingle();
    if (ex?.id) {
      ids.push(ex.id);
      continue;
    }
    const { data, error } = await db
      .from('treatments')
      .insert({
        clinic_id: clinicId,
        tenant_id: tenantId,
        name: t.name,
        category: t.category,
        description: t.name,
        duration_minutes: t.duration,
        price_cents: t.price
      })
      .select('id')
      .single();
    if (error) throw error;
    ids.push(data.id);
  }
  return ids;
}

async function ensureRooms(clinicId) {
  for (const name of ['Gabinete 1', 'Gabinete 2', 'Gabinete 3']) {
    const { data: ex } = await db.from('rooms').select('id').eq('clinic_id', clinicId).eq('name', name).maybeSingle();
    if (!ex) await db.from('rooms').insert({ clinic_id: clinicId, name });
  }
}

async function ensureAuthUser(email, name) {
  let user = await findAuthUserByEmail(email);
  if (user) {
    await db.auth.admin.updateUserById(user.id, {
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: name }
    });
    return user;
  }
  const { data, error } = await db.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: name }
  });
  if (error) throw error;
  return data.user;
}

async function ensureProfile({ authUserId, clinicId, tenantId, role, email, name, phone, activatePatient }) {
  const { data: existing } = await db
    .from('profiles')
    .select('id')
    .eq('clinic_id', clinicId)
    .eq('email', email)
    .eq('role', role)
    .maybeSingle();

  const payload = {
    auth_user_id: authUserId,
    clinic_id: clinicId,
    tenant_id: tenantId,
    role,
    full_name: name,
    email,
    phone: phone ?? null,
    ...(activatePatient ? { activated_at: new Date().toISOString() } : {})
  };

  if (existing?.id) {
    const { error } = await db.from('profiles').update(payload).eq('id', existing.id);
    if (error) throw error;
    return existing.id;
  }

  const { data, error } = await db.from('profiles').insert(payload).select('id').single();
  if (error) throw error;
  return data.id;
}

async function ensurePlatformAdmin(authUserId, email, name) {
  const { data: existing } = await db.from('platform_admins').select('id').eq('email', email).maybeSingle();
  if (existing?.id) {
    await db
      .from('platform_admins')
      .update({ auth_user_id: authUserId, full_name: name, active: true })
      .eq('id', existing.id);
    return;
  }
  await db.from('platform_admins').insert({
    auth_user_id: authUserId,
    email,
    full_name: name,
    active: true
  });
}

async function ensureAvailabilityRules(clinicId) {
  for (let weekday = 1; weekday <= 5; weekday += 1) {
    const { data: existing } = await db
      .from('availability_rules')
      .select('id')
      .eq('clinic_id', clinicId)
      .eq('weekday', weekday)
      .eq('starts_at', '09:00:00')
      .maybeSingle();
    if (existing?.id) continue;
    const { error } = await db.from('availability_rules').insert({
      clinic_id: clinicId,
      dentist_id: null,
      weekday,
      starts_at: '09:00:00',
      ends_at: '18:00:00',
      slot_minutes: 30,
      active: true
    });
    if (error) throw error;
  }
}

async function seedAppointments(clinicId, patientProfileIds, dentistIds, treatmentIds) {
  const now = Date.now();
  const slots = [
    { days: 3, hour: 10, status: 'confirmed' },
    { days: 7, hour: 11, status: 'pending' },
    { days: -5, hour: 9, status: 'completed' },
    { days: 14, hour: 16, status: 'confirmed' }
  ];

  for (let i = 0; i < patientProfileIds.length && i < slots.length; i++) {
    const patientId = patientProfileIds[i];
    const slot = slots[i];
    const starts = new Date(now + slot.days * 86400000);
    starts.setHours(slot.hour, 0, 0, 0);
    const ends = new Date(starts.getTime() + 45 * 60000);

    const { data: dup } = await db
      .from('appointments')
      .select('id')
      .eq('clinic_id', clinicId)
      .eq('patient_id', patientId)
      .eq('starts_at', starts.toISOString())
      .maybeSingle();

    if (dup?.id) continue;

    const { data: apt, error } = await db
      .from('appointments')
      .insert({
        clinic_id: clinicId,
        patient_id: patientId,
        dentist_id: dentistIds[i % dentistIds.length],
        treatment_id: treatmentIds[i % treatmentIds.length],
        room_name: `Gabinete ${(i % 3) + 1}`,
        starts_at: starts.toISOString(),
        ends_at: ends.toISOString(),
        status: slot.status,
        notes: 'Primera visita programada'
      })
      .select('id')
      .single();
    if (error) throw error;

    await db.from('invoices').insert({
      clinic_id: clinicId,
      patient_id: patientId,
      appointment_id: apt.id,
      amount_cents: 8500 + i * 1200,
      status: i === 0 ? 'sent' : 'draft',
      due_at: new Date(now + 14 * 86400000).toISOString()
    });
  }
}

async function main() {
  console.log('\n🦷 Dentista+ — semilla clínica PRO\n');

  await purgeLegacyDemo();

  const tenantId = await upsertTenant();
  const clinicId = await upsertClinic(tenantId);
  await upsertSubscription(clinicId);
  await upsertRolePermissions(clinicId);
  await ensureRooms(clinicId);
  const dentistIds = await ensureDentists(clinicId, tenantId);
  const treatmentIds = await ensureTreatments(clinicId, tenantId);
  await ensureAvailabilityRules(clinicId);

  console.log(`✓ ${CLINIC.name} (${CLINIC.slug})`);

  const adminUser = await ensureAuthUser(ADMIN_EMAIL, ADMIN_NAME);
  await ensurePlatformAdmin(adminUser.id, ADMIN_EMAIL, ADMIN_NAME);
  await ensureProfile({
    authUserId: adminUser.id,
    clinicId,
    tenantId,
    role: 'clinic_admin',
    email: ADMIN_EMAIL,
    name: ADMIN_NAME,
    activatePatient: false
  });
  await ensureProfile({
    authUserId: adminUser.id,
    clinicId,
    tenantId,
    role: 'patient',
    email: ADMIN_EMAIL,
    name: ADMIN_NAME,
    activatePatient: true
  });
  await db.auth.admin.updateUserById(adminUser.id, {
    app_metadata: { role: 'clinic_admin', clinic_id: clinicId, tenant_id: tenantId }
  });
  console.log(`✓ ${ADMIN_EMAIL} → plataforma, /admin y /paciente`);

  const patientProfileIds = [];
  for (const p of PATIENTS) {
    const user = await ensureAuthUser(p.email, p.name);
    const profileId = await ensureProfile({
      authUserId: user.id,
      clinicId,
      tenantId,
      role: 'patient',
      email: p.email,
      name: p.name,
      phone: p.phone,
      activatePatient: true
    });
    patientProfileIds.push(profileId);
    console.log(`✓ Paciente: ${p.email}`);
  }

  await seedAppointments(clinicId, patientProfileIds, dentistIds, treatmentIds);
  console.log('✓ Citas y facturas');

  console.log('\n--- Accesos ---');
  console.log('  Panel clínica:   /login/admin?email=' + encodeURIComponent(ADMIN_EMAIL));
  console.log('  Portal paciente: /login/paciente?email=' + encodeURIComponent(ADMIN_EMAIL));
  console.log('  Plataforma:      /platform/login');
  console.log('');
}

main().catch((err) => {
  console.error('\nError:', err.message ?? err);
  process.exit(1);
});

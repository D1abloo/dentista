#!/usr/bin/env node
/**
 * Red demo: ≥10 clínicas ficticias (Dr/Dra) + 3 organizaciones multi-sede (3 sedes c/u).
 * Requiere migración 0035 y SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 *
 * Uso: npm run seed:clinics-network
 */

import { createClient } from '@supabase/supabase-js';
import { loadEnvFile } from './lib/load-env.mjs';

loadEnvFile();

const url = process.env.SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PASSWORD = process.env.CLINIC_DEFAULT_PASSWORD || process.env.SUPER_ADMIN_PASSWORD || 'DemoClinic2026!';

if (!url || !serviceKey) {
  console.error('Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env');
  process.exit(1);
}

const db = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const STANDALONE = [
  { slug: 'demo-alba-dental', name: 'Clínica Dental Alba', city: 'Zaragoza', dr: ['Dra. Elena Alba', 'Dr. Pablo Mora'] },
  { slug: 'demo-sonrisa-norte', name: 'Sonrisa Norte', city: 'Bilbao', dr: ['Dr. Iván Rey', 'Dra. Marta Sol'] },
  { slug: 'demo-dientes-plus', name: 'Dientes Plus', city: 'Valladolid', dr: ['Dra. Lucía Vega', 'Dr. Hugo Paz'] },
  { slug: 'demo-oral-centro', name: 'Oral Centro', city: 'Murcia', dr: ['Dr. Raúl Costa', 'Dra. Nora Gil'] },
  { slug: 'demo-estetica-dental', name: 'Estética Dental Castilla', city: 'Salamanca', dr: ['Dra. Irene Casta', 'Dr. Tomás León'] },
  { slug: 'demo-gabinete-iris', name: 'Gabinete Iris', city: 'A Coruña', dr: ['Dra. Paula Iris', 'Dr. Mario Feijoo'] },
  { slug: 'demo-clinica-aurora', name: 'Clínica Aurora', city: 'Santander', dr: ['Dr. Víctor Aurora', 'Dra. Sara Nieto'] },
  { slug: 'demo-dental-prisma', name: 'Dental Prisma', city: 'Pamplona', dr: ['Dra. Alma Prisma', 'Dr. Joel Roca'] },
  { slug: 'demo-sonrisa-activa', name: 'Sonrisa Activa', city: 'Córdoba', dr: ['Dr. Nico Rueda', 'Dra. Clara Mesa'] },
  { slug: 'demo-integral-bucal', name: 'Integral Bucal', city: 'Granada', dr: ['Dra. Eva Bucal', 'Dr. Luis Toral'] }
];

const MULTI_ORGS = [
  {
    code: 'ORG-MEDITERRANEO',
    name: 'Grupo Dental Mediterráneo',
    adminEmail: 'admin.mediterraneo@demo.dentista.app',
    adminName: 'Dra. Carmen Mediterráneo',
    branches: [
      { slug: 'demo-med-bcn', name: 'Mediterráneo Barcelona', city: 'Barcelona', dr: ['Dra. Laura Costa', 'Dr. Jordi Puig'] },
      { slug: 'demo-med-vlc', name: 'Mediterráneo Valencia', city: 'Valencia', dr: ['Dr. Miguel Soriano', 'Dra. Ana Ribera'] },
      { slug: 'demo-med-pmi', name: 'Mediterráneo Palma', city: 'Palma', dr: ['Dra. Sofia Marí', 'Dr. Toni Oliver'] }
    ]
  },
  {
    code: 'ORG-SONRISA-PLUS',
    name: 'Red Sonrisa Plus',
    adminEmail: 'admin.sonrisaplus@demo.dentista.app',
    adminName: 'Dr. Javier Redondo',
    branches: [
      { slug: 'demo-sp-mad', name: 'Sonrisa Plus Madrid', city: 'Madrid', dr: ['Dr. Alberto Cruz', 'Dra. Elena Mas'] },
      { slug: 'demo-sp-sev', name: 'Sonrisa Plus Sevilla', city: 'Sevilla', dr: ['Dra. Rocío Guzmán', 'Dr. Pepe Navarro'] },
      { slug: 'demo-sp-mal', name: 'Sonrisa Plus Málaga', city: 'Málaga', dr: ['Dr. Dani Romero', 'Dra. Inés Molina'] }
    ]
  },
  {
    code: 'ORG-UNIDA',
    name: 'Odontología Unida',
    adminEmail: 'admin.unida@demo.dentista.app',
    adminName: 'Dr. Héctor Unida',
    branches: [
      { slug: 'demo-un-bcn', name: 'Unida Eixample', city: 'Barcelona', dr: ['Dra. Mireia Soler', 'Dr. Pol Vidal'] },
      { slug: 'demo-un-gir', name: 'Unida Girona', city: 'Girona', dr: ['Dr. Marc Giralt', 'Dra. Núria Farré'] },
      { slug: 'demo-un-tar', name: 'Unida Tarragona', city: 'Tarragona', dr: ['Dra. Júlia Tarragó', 'Dr. Oriol Reus'] }
    ]
  }
];

async function findAuthUser(email) {
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

async function ensureAuthUser(email, name) {
  let user = await findAuthUser(email);
  if (user) {
    await db.auth.admin.updateUserById(user.id, { password: PASSWORD, email_confirm: true });
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

async function upsertOrg(code, name) {
  const { data: ex } = await db.from('organization_groups').select('id').eq('code', code).maybeSingle();
  if (ex?.id) return ex.id;
  const { data, error } = await db
    .from('organization_groups')
    .insert({ code, name, kind: 'multi_sede' })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

async function upsertTenant(name) {
  const code = `TEN-${name.slice(0, 12).replace(/\W/g, '').toUpperCase()}-${Date.now().toString(36).slice(-4)}`;
  const { data, error } = await db
    .from('tenants')
    .insert({
      code,
      name,
      type: 'clinica',
      owner_name: name,
      active: true
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

async function upsertClinic({ slug, name, city, tenantId, organizationId }) {
  const { data: ex } = await db.from('clinics').select('id, tenant_id').eq('slug', slug).maybeSingle();
  if (ex?.id) {
    await db
      .from('clinics')
      .update({
        name,
        city,
        status: 'active',
        organization_id: organizationId ?? null,
        subscription_plan: 'professional',
        approved_at: new Date().toISOString()
      })
      .eq('id', ex.id);
    return { clinicId: ex.id, tenantId: ex.tenant_id };
  }

  const tid = tenantId ?? (await upsertTenant(name));
  const { data, error } = await db
    .from('clinics')
    .insert({
      name,
      slug,
      tenant_id: tid,
      city,
      status: 'active',
      is_main_branch: true,
      organization_id: organizationId ?? null,
      subscription_plan: 'professional',
      approved_at: new Date().toISOString(),
      email: `contacto@${slug}.demo`,
      phone: '+34 900 100 200',
      address: `Av. Principal 12, ${city}`
    })
    .select('id, tenant_id')
    .single();
  if (error) throw error;

  await db.from('clinic_subscriptions').upsert(
    { clinic_id: data.id, plan: 'professional', status: 'active' },
    { onConflict: 'clinic_id' }
  );
  await db.from('rooms').upsert({ clinic_id: data.id, name: 'Gabinete 1' }, { onConflict: 'clinic_id,name', ignoreDuplicates: true });

  return { clinicId: data.id, tenantId: data.tenant_id };
}

async function ensureDentists(clinicId, tenantId, names) {
  for (const name of names) {
    const { data: ex } = await db.from('dentists').select('id').eq('clinic_id', clinicId).eq('name', name).maybeSingle();
    if (ex?.id) continue;
    const specialty = name.startsWith('Dra') ? 'Estética dental' : 'Implantología';
    await db.from('dentists').insert({
      clinic_id: clinicId,
      tenant_id: tenantId,
      name,
      specialty,
      rating: 4.8,
      reviews_count: 40 + Math.floor(Math.random() * 80),
      active: true
    });
  }
}

async function ensureProfile({ authUserId, clinicId, tenantId, email, name, role }) {
  const { data: ex } = await db
    .from('profiles')
    .select('id')
    .eq('clinic_id', clinicId)
    .eq('email', email)
    .maybeSingle();
  if (ex?.id) return ex.id;
  const { data, error } = await db
    .from('profiles')
    .insert({
      auth_user_id: authUserId,
      clinic_id: clinicId,
      tenant_id: tenantId,
      role,
      full_name: name,
      email,
      activated_at: new Date().toISOString()
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

async function seedStandalone() {
  console.log('\n— Clínicas independientes (10) —');
  for (const c of STANDALONE) {
    const { clinicId, tenantId } = await upsertClinic({
      slug: c.slug,
      name: c.name,
      city: c.city,
      organizationId: null
    });
    await ensureDentists(clinicId, tenantId, c.dr);
    const adminEmail = `admin@${c.slug}.demo`;
    const user = await ensureAuthUser(adminEmail, `Admin ${c.name}`);
    await ensureProfile({
      authUserId: user.id,
      clinicId,
      tenantId,
      email: adminEmail,
      name: `Admin ${c.name}`,
      role: 'clinic_admin'
    });
    console.log(`  ✓ ${c.name} (${c.city}) — ${c.dr.join(', ')}`);
  }
}

async function seedMultiOrgs() {
  console.log('\n— Organizaciones multi-sede (3) —');
  for (const org of MULTI_ORGS) {
    const orgId = await upsertOrg(org.code, org.name);
    const user = await ensureAuthUser(org.adminEmail, org.adminName);
    console.log(`  ✓ ${org.name}`);

    for (const branch of org.branches) {
      const { clinicId, tenantId } = await upsertClinic({
        slug: branch.slug,
        name: branch.name,
        city: branch.city,
        organizationId: orgId
      });
      await ensureDentists(clinicId, tenantId, branch.dr);
      await ensureProfile({
        authUserId: user.id,
        clinicId,
        tenantId,
        email: org.adminEmail,
        name: org.adminName,
        role: 'clinic_admin'
      });
      await db.from('staff_clinic_assignments').upsert(
        {
          auth_user_id: user.id,
          clinic_id: clinicId,
          role: 'clinic_admin',
          active: true
        },
        { onConflict: 'auth_user_id,clinic_id' }
      );
      console.log(`    · ${branch.name} (${branch.city})`);
    }
  }
}

async function main() {
  console.log('Seed red demo clínicas…');
  console.log(`Contraseña demo: ${PASSWORD}`);

  const { error: orgCheck } = await db.from('organization_groups').select('id').limit(1);
  if (orgCheck?.message?.includes('organization_groups')) {
    console.error('Aplica primero supabase/migrations/0035_organizations_staff_access.sql');
    process.exit(1);
  }

  await seedStandalone();
  await seedMultiOrgs();

  console.log('\nListo. 10 clínicas independientes + 3 multi-sede (9 sedes).');
  console.log('Acceso multi-sede: admin.mediterraneo@demo.dentista.app, admin.sonrisaplus@demo.dentista.app, admin.unida@demo.dentista.app');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

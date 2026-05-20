#!/usr/bin/env node
/**
 * Gestión de usuarios Supabase (Auth + profiles + platform_admins + permisos).
 *
 * Requiere en .env:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Uso:
 *   node scripts/manage-users.mjs list
 *   node scripts/manage-users.mjs clinics
 *   node scripts/manage-users.mjs add --email x@y.com --password '***' --name "Nombre" \
 *     --access clinic --clinic-id <uuid> --role clinic_admin --permission write
 *   node scripts/manage-users.mjs add --email sa@y.com --password '***' --name "Super" --access platform --permission execute
 *   node scripts/manage-users.mjs add --email p@y.com --password '***' --name "Paciente" --access public --clinic-id <uuid>
 *   node scripts/manage-users.mjs permissions --email x@y.com --clinic-id <uuid> --role admin --level execute
 *   node scripts/manage-users.mjs help
 */

import { createClient } from '@supabase/supabase-js';
import { loadEnvFile } from './lib/load-env.mjs';

loadEnvFile();

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env');
  process.exit(1);
}

const db = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const PERMISSION_LEVELS = {
  read: ['portal:read', 'appointments:read', 'invoices:read', 'clinical_notes:read', 'site:read'],
  write: [
    'portal:read',
    'appointments:read',
    'appointments:write',
    'invoices:read',
    'invoices:write',
    'clinical_notes:read',
    'clinical_notes:write',
    'clinic:manage',
    'site:read',
    'site:write'
  ],
  execute: [
    'admin:*',
    'clinic:manage',
    'appointments:write',
    'clinical_notes:write',
    'invoices:write',
    'billing:execute',
    'portal:read',
    'site:write'
  ]
};

const STAFF_ROLES = new Set(['clinic_admin', 'admin', 'owner', 'dentist', 'receptionist']);
const ACCESS_LABELS = {
  platform: 'Panel plataforma (/platform)',
  clinic: 'Panel clínica (/admin)',
  public: 'Portal público / paciente (/paciente)'
};

function parseArgs(argv) {
  const args = argv.slice(2);
  const cmd = args[0] ?? 'help';
  const flags = {};
  const positional = [];
  for (let i = 1; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith('--')) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    } else {
      positional.push(a);
    }
  }
  return { cmd, flags, positional };
}

function help() {
  console.log(`
Dentista+ — gestión de usuarios Supabase

Comandos:
  list              Lista usuarios Auth, perfiles y super admins
  clinics           Lista clínicas (id, nombre, slug) para --clinic-id
  add               Crea usuario y asigna accesos
  permissions       Actualiza permisos (read|write|execute) de un rol en una clínica
  help              Esta ayuda

Opciones de add:
  --email           Email (obligatorio)
  --password        Contraseña (obligatorio, min. 6)
  --name            Nombre completo (obligatorio)
  --access          platform,clinic,public (uno o varios separados por coma)
  --permission      read | write | execute (default: write)
  --clinic-id       UUID de clínica (obligatorio si access incluye clinic o public)
  --role            Rol en profiles: clinic_admin|admin|dentist|receptionist|patient|owner
                    (default: clinic_admin para clinic, patient para public)

Opciones de permissions:
  --email           Usuario existente
  --clinic-id       Clínica
  --role            Rol al que aplicar permisos (ej. admin, receptionist)
  --level           read | write | execute

Accesos:
  platform  → Super Admin en /platform/login (tabla platform_admins)
  clinic    → Staff en /login → /admin (tabla profiles)
  public    → Paciente en /login → /paciente (profiles.role = patient)

Ejemplos:
  node scripts/manage-users.mjs list
  node scripts/manage-users.mjs add --email admin@clinic.com --password 'Segura123!' --name "Admin Clínica" \\
    --access clinic --clinic-id <uuid> --role clinic_admin --permission execute
  node scripts/manage-users.mjs add --email super@dentista.app --password 'Segura123!' --name "Super Admin" \\
    --access platform --permission execute
  node scripts/manage-users.mjs add --email multi@dentista.app --password 'Segura123!' --name "Operador" \\
    --access platform,clinic --clinic-id <uuid> --role clinic_admin --permission write
`);
}

async function listAllAuthUsers() {
  const users = [];
  let page = 1;
  const perPage = 200;
  while (true) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    users.push(...(data.users ?? []));
    if ((data.users ?? []).length < perPage) break;
    page++;
  }
  return users;
}

async function cmdList() {
  const [authUsers, profilesRes, platformRes, clinicsRes] = await Promise.all([
    listAllAuthUsers(),
    db.from('profiles').select('id, auth_user_id, clinic_id, tenant_id, role, full_name, email, created_at').order('created_at', { ascending: false }),
    db.from('platform_admins').select('id, auth_user_id, email, full_name, active, created_at').order('created_at', { ascending: false }),
    db.from('clinics').select('id, name, slug, status')
  ]);

  if (profilesRes.error) throw profilesRes.error;
  if (platformRes.error) throw platformRes.error;

  const clinicMap = new Map((clinicsRes.data ?? []).map((c) => [c.id, c]));
  const profileByAuth = new Map((profilesRes.data ?? []).map((p) => [p.auth_user_id, p]));
  const platformByAuth = new Map(
    (platformRes.data ?? []).filter((p) => p.auth_user_id).map((p) => [p.auth_user_id, p])
  );

  console.log('\n=== Usuarios Supabase Auth ===\n');
  if (!authUsers.length) {
    console.log('(ninguno)\n');
    return;
  }

  for (const u of authUsers) {
    const meta = u.app_metadata ?? {};
    const profile = profileByAuth.get(u.id);
    const platform = platformByAuth.get(u.id);
    const accesses = [];
    if (platform?.active) accesses.push('platform');
    if (profile) {
      if (profile.role === 'patient') accesses.push('public');
      else if (STAFF_ROLES.has(profile.role)) accesses.push('clinic');
    }
    if (meta.role === 'super_admin') accesses.push('platform(meta)');

    const clinic = profile?.clinic_id ? clinicMap.get(profile.clinic_id) : null;
    console.log(`• ${u.email}`);
    console.log(`  id: ${u.id}`);
    console.log(`  creado: ${u.created_at}`);
    console.log(`  app_metadata: role=${meta.role ?? '—'} clinic_id=${meta.clinic_id ?? '—'}`);
    console.log(`  accesos: ${accesses.length ? accesses.join(', ') : '—'}`);
    if (profile) {
      console.log(
        `  perfil: ${profile.full_name} · rol ${profile.role} · clínica ${clinic?.name ?? profile.clinic_id}`
      );
    }
    if (platform) {
      console.log(`  platform_admin: ${platform.full_name} · activo=${platform.active}`);
    }
    console.log('');
  }

  console.log('=== Resumen ===');
  console.log(`Auth: ${authUsers.length} · Profiles: ${profilesRes.data?.length ?? 0} · Platform admins: ${platformRes.data?.length ?? 0}`);
}

async function cmdClinics() {
  const { data, error } = await db.from('clinics').select('id, name, slug, status, tenant_id').order('name');
  if (error) throw error;
  console.log('\nClínicas:\n');
  for (const c of data ?? []) {
    console.log(`  ${c.id}`);
    console.log(`    ${c.name} (${c.slug}) · ${c.status} · tenant ${c.tenant_id ?? '—'}\n`);
  }
}

function parseAccess(raw) {
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

async function resolveClinic(clinicId) {
  const { data, error } = await db.from('clinics').select('id, name, tenant_id, status').eq('id', clinicId).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error(`Clínica no encontrada: ${clinicId}`);
  return data;
}

async function upsertRolePermissions(clinicId, role, level) {
  const perms = PERMISSION_LEVELS[level];
  if (!perms) throw new Error(`Nivel inválido: ${level}. Usa read, write o execute.`);
  for (const permission of perms) {
    const { error } = await db.from('role_permissions').upsert(
      { clinic_id: clinicId, role, permission, enabled: true },
      { onConflict: 'clinic_id,role,permission' }
    );
    if (error) throw error;
  }
  return perms;
}

async function ensurePlatformAdmin(authUserId, email, fullName) {
  const { data: existing } = await db.from('platform_admins').select('id').eq('email', email).maybeSingle();
  if (existing) {
    const { error } = await db
      .from('platform_admins')
      .update({ auth_user_id: authUserId, full_name: fullName, active: true })
      .eq('id', existing.id);
    if (error) throw error;
    return existing.id;
  }
  const { data, error } = await db
    .from('platform_admins')
    .insert({ auth_user_id: authUserId, email, full_name: fullName, active: true })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

async function cmdAdd(flags) {
  const email = flags.email;
  const password = flags.password;
  const name = flags.name;
  const accessList = parseAccess(flags.access ?? 'clinic');
  const permission = flags.permission ?? 'write';
  const clinicId = flags['clinic-id'];
  let profileRole = flags.role;

  if (!email || !password || !name) {
    throw new Error('add requiere --email, --password y --name');
  }
  if (password.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres');
  if (!accessList.length) throw new Error('Indica --access platform, clinic y/o public');

  const invalid = accessList.filter((a) => !ACCESS_LABELS[a]);
  if (invalid.length) throw new Error(`Acceso inválido: ${invalid.join(', ')}`);

  if ((accessList.includes('clinic') || accessList.includes('public')) && !clinicId) {
    throw new Error('--clinic-id es obligatorio para access clinic o public');
  }

  if (!profileRole) {
    if (accessList.includes('public') && !accessList.includes('clinic')) profileRole = 'patient';
    else if (accessList.includes('clinic')) profileRole = 'clinic_admin';
  }

  let clinic = null;
  if (clinicId) clinic = await resolveClinic(clinicId);

  const { data: authData, error: authErr } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name },
    app_metadata: { role: accessList.includes('platform') ? 'super_admin' : profileRole }
  });
  if (authErr) {
    if (authErr.message?.includes('already been registered')) {
      throw new Error(`El email ${email} ya existe. Usa otro email o gestiona el usuario en Supabase Dashboard.`);
    }
    throw authErr;
  }

  const authUser = authData.user;
  const results = [];

  if (accessList.includes('platform')) {
    await ensurePlatformAdmin(authUser.id, email, name);
    await db.auth.admin.updateUserById(authUser.id, {
      app_metadata: { role: 'super_admin' }
    });
    results.push(ACCESS_LABELS.platform);
  }

  if (accessList.includes('clinic') || accessList.includes('public')) {
    if (!STAFF_ROLES.has(profileRole) && profileRole !== 'patient') {
      throw new Error(`Rol inválido: ${profileRole}`);
    }
    const tenantId = clinic.tenant_id ?? null;
    const { error: profileErr } = await db.from('profiles').insert({
      auth_user_id: authUser.id,
      clinic_id: clinicId,
      tenant_id: tenantId,
      role: profileRole,
      full_name: name,
      email
    });
    if (profileErr) throw profileErr;

    await db.auth.admin.updateUserById(authUser.id, {
      app_metadata: {
        role: profileRole,
        clinic_id: clinicId,
        tenant_id: tenantId
      }
    });

    if (STAFF_ROLES.has(profileRole) && accessList.includes('clinic')) {
      const perms = await upsertRolePermissions(clinicId, profileRole, permission);
      results.push(`${ACCESS_LABELS.clinic} (permiso ${permission}: ${perms.length} reglas)`);
    } else if (profileRole === 'patient') {
      await upsertRolePermissions(clinicId, 'patient', 'read');
      results.push(ACCESS_LABELS.public);
    }
  }

  console.log('\n✓ Usuario creado\n');
  console.log(`  Email: ${email}`);
  console.log(`  Auth id: ${authUser.id}`);
  console.log(`  Accesos configurados:`);
  for (const r of results) console.log(`    - ${r}`);
  console.log('\n  Inicio de sesión:');
  if (accessList.includes('platform')) console.log('    /platform/login → rol super_admin');
  if (accessList.includes('clinic')) console.log('    /login → rol admin (staff)');
  if (accessList.includes('public')) console.log('    /login → rol patient');
  console.log('');
}

async function cmdPermissions(flags) {
  const email = flags.email;
  const clinicId = flags['clinic-id'];
  const role = flags.role ?? 'admin';
  const level = flags.level ?? 'write';

  if (!email || !clinicId) throw new Error('permissions requiere --email y --clinic-id');

  const { data: profile, error } = await db
    .from('profiles')
    .select('id, auth_user_id, role')
    .eq('email', email)
    .eq('clinic_id', clinicId)
    .maybeSingle();
  if (error) throw error;
  if (!profile) throw new Error(`No hay perfil para ${email} en esa clínica`);

  const perms = await upsertRolePermissions(clinicId, role, level);
  console.log(`\n✓ Permisos ${level} aplicados al rol "${role}" en clínica ${clinicId}`);
  console.log(`  Usuario: ${email} (perfil rol ${profile.role})`);
  console.log(`  Reglas: ${perms.join(', ')}\n`);
}

async function main() {
  const { cmd, flags } = parseArgs(process.argv);

  try {
    switch (cmd) {
      case 'list':
        await cmdList();
        break;
      case 'clinics':
        await cmdClinics();
        break;
      case 'add':
        await cmdAdd(flags);
        break;
      case 'permissions':
        await cmdPermissions(flags);
        break;
      case 'help':
      default:
        help();
        if (cmd !== 'help') {
          console.error(`\nComando desconocido: ${cmd}\n`);
          process.exit(1);
        }
    }
  } catch (err) {
    console.error('\nError:', err.message ?? err);
    process.exit(1);
  }
}

main();

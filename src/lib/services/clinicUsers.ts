import {
  afterPasswordChangeFields,
  generateTemporaryPassword,
  newUserPasswordFields
} from '@/lib/auth/passwordPolicy';
import { adminPanelEntryPath } from '@/lib/auth/adminEntryUrl';
import { sendNewUserCredentialsEmail } from '@/lib/email/accountEmails';
import { allocateNextNhc } from '@/lib/services/nhc';
import { getSupabaseAdmin, hasSupabaseConfig } from '@/lib/supabaseServer';

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
} as const;

const STAFF_ROLES = new Set(['clinic_admin', 'admin', 'owner', 'dentist', 'receptionist']);

export type ClinicUserRow = {
  id: string;
  auth_user_id: string | null;
  clinic_id: string;
  tenant_id: string | null;
  role: string;
  full_name: string;
  email: string;
  created_at: string;
};

export type CreateClinicUserInput = {
  email: string;
  password?: string;
  fullName: string;
  accessType: 'clinic' | 'patient';
  role: string;
  clinicId: string;
  permission?: 'read' | 'write' | 'execute';
  specialty?: string;
  collegiateNumber?: string;
  sendEmail?: boolean;
};

const ROLE_LABELS: Record<string, string> = {
  clinic_admin: 'Administrador de clínica',
  admin: 'Administrador',
  owner: 'Propietario',
  dentist: 'Dentista',
  receptionist: 'Recepción',
  patient: 'Paciente'
};

function requireDb() {
  if (!hasSupabaseConfig()) throw new Error('Servicio no disponible.');
  return getSupabaseAdmin();
}

async function upsertRolePermissions(clinicId: string, role: string, level: keyof typeof PERMISSION_LEVELS) {
  const perms = PERMISSION_LEVELS[level];
  const db = requireDb();
  for (const permission of perms) {
    const { error } = await db.from('role_permissions').upsert(
      { clinic_id: clinicId, role, permission, enabled: true },
      { onConflict: 'clinic_id,role,permission' }
    );
    if (error) throw error;
  }
}

export async function listClinicUsersForScope(clinicId: string, tenantId?: string | null) {
  const db = requireDb();
  let q = db
    .from('profiles')
    .select('id, auth_user_id, clinic_id, tenant_id, role, full_name, email, created_at')
    .order('created_at', { ascending: false });

  if (tenantId) {
    q = q.or(`clinic_id.eq.${clinicId},tenant_id.eq.${tenantId}`);
  } else {
    q = q.eq('clinic_id', clinicId);
  }

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as ClinicUserRow[];
}

export async function createClinicUser(input: CreateClinicUserInput) {
  const db = requireDb();
  const profileRole =
    input.accessType === 'patient' ? 'patient' : input.role;

  if (input.accessType === 'patient' && profileRole !== 'patient') {
    throw new Error('El portal del paciente requiere rol paciente.');
  }
  if (input.accessType === 'clinic' && !STAFF_ROLES.has(profileRole)) {
    throw new Error('Rol de personal no válido.');
  }

  const { data: clinic, error: clinicErr } = await db
    .from('clinics')
    .select('id, name, tenant_id, status')
    .eq('id', input.clinicId)
    .maybeSingle();
  if (clinicErr || !clinic) throw new Error('Clínica no encontrada.');
  if (clinic.status !== 'active') throw new Error('La clínica no está activa.');

  const tenantId = clinic.tenant_id as string | null;
  const permission = input.permission ?? (profileRole === 'clinic_admin' ? 'execute' : 'write');
  const plainPassword = input.password?.trim() || generateTemporaryPassword();
  const pwdFields = newUserPasswordFields(profileRole, true);

  const { data: authData, error: authErr } = await db.auth.admin.createUser({
    email: input.email,
    password: plainPassword,
    email_confirm: true,
    user_metadata: { full_name: input.fullName },
    app_metadata: { role: profileRole, clinic_id: input.clinicId, tenant_id: tenantId }
  });
  if (authErr) {
    if (authErr.message?.includes('already been registered')) {
      throw new Error('Este email ya está registrado.');
    }
    throw authErr;
  }

  const authUserId = authData.user.id;

  const patientNhc =
    profileRole === 'patient' ? await allocateNextNhc(input.clinicId) : undefined;

  const { data: profile, error: profileErr } = await db
    .from('profiles')
    .insert({
      auth_user_id: authUserId,
      clinic_id: input.clinicId,
      tenant_id: tenantId,
      role: profileRole,
      full_name: input.fullName,
      email: input.email,
      nhc: patientNhc,
      ...pwdFields
    })
    .select('id, role, email, full_name, clinic_id, created_at')
    .single();
  if (profileErr) throw profileErr;

  if (input.accessType === 'clinic' && STAFF_ROLES.has(profileRole)) {
    await upsertRolePermissions(input.clinicId, profileRole, permission);
    if (profileRole === 'dentist') {
      const { error: dentistErr } = await db.from('dentists').insert({
        clinic_id: input.clinicId,
        profile_id: profile.id,
        name: input.fullName,
        specialty: input.specialty ?? 'General',
        collegiate_number: input.collegiateNumber?.trim() || null,
        email: input.email.trim(),
        active: true
      });
      if (dentistErr && !dentistErr.message?.includes('duplicate')) throw dentistErr;
    }
  } else if (profileRole === 'patient') {
    await upsertRolePermissions(input.clinicId, 'patient', 'read');
  }

  const loginPath = input.accessType === 'patient' ? '/login/paciente' : adminPanelEntryPath();
  const accessLabel =
    input.accessType === 'patient' ? 'Portal del paciente' : 'Panel administrativo de clínica';

  let emailSent = false;
  if (input.sendEmail !== false) {
    try {
      await sendNewUserCredentialsEmail({
        fullName: input.fullName,
        email: input.email,
        password: plainPassword,
        accessLabel,
        loginPath,
        roleLabel: ROLE_LABELS[profileRole] ?? profileRole
      });
      emailSent = true;
    } catch {
      /* no bloquear alta */
    }
  }

  return {
    profile: profile as ClinicUserRow,
    loginPath,
    accessLabel,
    temporaryPassword: plainPassword,
    emailSent
  };
}

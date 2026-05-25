import { activationExpiresAt, generateActivationToken, hashActivationToken } from '@/lib/auth/activationTokens';
import { passwordExpiresAtForRole } from '@/lib/auth/passwordPolicy';
import {
  sendPatientActivationEmail,
  sendPatientRegistrationPendingEmail
} from '@/lib/email/patientActivationEmail';
import { allocateNextNhc } from '@/lib/services/nhc';
import { getSupabaseAdmin, hasSupabaseConfig } from '@/lib/supabaseServer';
import type { AdminPatientCreateInput, PatientRegistrationInput } from '@/lib/validators';

function randomTempPassword() {
  const base = crypto.randomUUID().replace(/-/g, '').slice(0, 10);
  return `Df${base}9!`;
}

function appUrl(path: string) {
  const base = (import.meta.env.PUBLIC_APP_URL ?? 'http://localhost:4321').replace(/\/$/, '');
  return `${base}${path}`;
}

function requireDb() {
  if (!hasSupabaseConfig()) throw new Error('Servicio no disponible.');
  return getSupabaseAdmin();
}

export async function listPublicClinics() {
  const db = requireDb();
  const { data, error } = await db
    .from('clinics')
    .select('id, name, address')
    .eq('status', 'active')
    .order('name', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((c) => ({
    id: c.id as string,
    name: c.name as string,
    address: (c.address as string | null) ?? ''
  }));
}

export async function registerPatient(input: PatientRegistrationInput) {
  const db = requireDb();

  const { data: clinic, error: clinicErr } = await db
    .from('clinics')
    .select('id, name, tenant_id, status')
    .eq('id', input.clinic_id)
    .maybeSingle();
  if (clinicErr || !clinic) throw new Error('Clínica no encontrada.');
  if (clinic.status !== 'active') throw new Error('Esta clínica no admite registros en línea.');

  const { data: existing } = await db
    .from('profiles')
    .select('id')
    .eq('clinic_id', input.clinic_id)
    .ilike('email', input.email.trim())
    .maybeSingle();
  if (existing) throw new Error('Ya existe una cuenta con este email en esta clínica.');

  const { raw, hash } = await generateActivationToken();
  const expiresAt = activationExpiresAt(48);
  const now = new Date().toISOString();
  const tenantId = clinic.tenant_id as string | null;

  const { data: authData, error: authErr } = await db.auth.admin.createUser({
    email: input.email.trim().toLowerCase(),
    password: input.password,
    email_confirm: false,
    user_metadata: { full_name: input.full_name },
    app_metadata: { role: 'patient', clinic_id: input.clinic_id, tenant_id: tenantId }
  });
  if (authErr) {
    if (authErr.message?.includes('already been registered')) {
      throw new Error('Este email ya está registrado. Prueba a iniciar sesión o recuperar acceso.');
    }
    throw authErr;
  }

  const authUserId = authData.user.id;
  const pwdExpires = passwordExpiresAtForRole('patient', new Date(now));
  const nhc = await allocateNextNhc(input.clinic_id);

  const { data: profile, error: profileErr } = await db
    .from('profiles')
    .insert({
      auth_user_id: authUserId,
      clinic_id: input.clinic_id,
      tenant_id: tenantId,
      role: 'patient',
      full_name: input.full_name.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone.trim(),
      dni: input.dni.trim().toUpperCase(),
      nhc,
      birth_date: input.birth_date || null,
      must_change_password: false,
      password_set_at: now,
      password_expires_at: pwdExpires,
      activated_at: null,
      activation_token_hash: hash,
      activation_token_expires_at: expiresAt
    })
    .select('id, email, full_name, nhc')
    .single();
  if (profileErr) {
    await db.auth.admin.deleteUser(authUserId);
    throw profileErr;
  }

  const activationUrl = `${appUrl('/activar')}?token=${encodeURIComponent(raw)}`;

  let activationEmailSent = false;
  try {
    const mail = await sendPatientActivationEmail({
      fullName: input.full_name,
      email: input.email,
      clinicName: clinic.name as string,
      activationUrl
    });
    activationEmailSent = mail.sent && !mail.mock;
  } catch {
    /* registration stands; user can request resend later */
  }

  void sendPatientRegistrationPendingEmail({
    fullName: input.full_name,
    email: input.email,
    clinicName: clinic.name as string
  }).catch(() => undefined);

  return {
    profileId: profile.id as string,
    email: profile.email as string,
    nhc: profile.nhc as string,
    activationEmailSent
  };
}

export async function activatePatientAccount(rawToken: string) {
  const db = requireDb();
  const hash = await hashActivationToken(rawToken);
  const now = new Date().toISOString();

  const { data: profile, error } = await db
    .from('profiles')
    .select('id, auth_user_id, email, full_name, role, activation_token_expires_at, activated_at')
    .eq('activation_token_hash', hash)
    .eq('role', 'patient')
    .maybeSingle();

  if (error || !profile) throw new Error('Enlace de activación no válido o ya utilizado.');
  if (profile.activated_at) throw new Error('Esta cuenta ya está activada. Puedes iniciar sesión.');
  if (profile.activation_token_expires_at && profile.activation_token_expires_at < now) {
    throw new Error('El enlace ha caducado. Regístrate de nuevo o contacta con la clínica.');
  }
  if (!profile.auth_user_id) throw new Error('Cuenta incompleta. Contacta con soporte.');

  const { error: authErr } = await db.auth.admin.updateUserById(profile.auth_user_id as string, {
    email_confirm: true
  });
  if (authErr) throw authErr;

  const { error: updErr } = await db
    .from('profiles')
    .update({
      activated_at: now,
      activation_token_hash: null,
      activation_token_expires_at: null
    })
    .eq('id', profile.id);
  if (updErr) throw updErr;

  return {
    email: profile.email as string,
    fullName: profile.full_name as string
  };
}

/** Alta desde panel administrativo: genera contraseña temporal y envía activación por email. */
export async function registerPatientByStaff(input: AdminPatientCreateInput & { clinic_id: string }) {
  const pwd = randomTempPassword();
  return registerPatient({
    full_name: input.full_name,
    email: input.email,
    phone: input.phone,
    dni: input.dni?.trim() || '00000000A',
    birth_date: input.birth_date || '',
    clinic_id: input.clinic_id,
    password: pwd,
    password_confirm: pwd,
    accept_terms: true,
    accept_privacy: true
  });
}

export { isPatientActivated } from '@/lib/auth/patientActivation';

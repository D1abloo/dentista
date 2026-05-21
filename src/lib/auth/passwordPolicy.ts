import { randomBytes } from 'node:crypto';

/** Roles sin caducidad de contraseña (administradores de clínica). */
export const ADMIN_PASSWORD_ROLES = new Set(['clinic_admin', 'admin', 'owner']);

const MONTHS_VALIDITY = 3;

export function isAdminPasswordRole(role: string) {
  return ADMIN_PASSWORD_ROLES.has(role);
}

export function generateTemporaryPassword(length = 12) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
  const bytes = randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += chars[bytes[i]! % chars.length];
  }
  return out;
}

export function passwordExpiresAtForRole(role: string, from = new Date()): string | null {
  if (isAdminPasswordRole(role)) return null;
  const d = new Date(from);
  d.setMonth(d.getMonth() + MONTHS_VALIDITY);
  return d.toISOString();
}

export function evaluatePasswordStatus(profile: {
  role: string;
  must_change_password?: boolean | null;
  password_expires_at?: string | null;
}) {
  const mustChangePassword = Boolean(profile.must_change_password);
  const expired =
    !isAdminPasswordRole(profile.role) &&
    Boolean(profile.password_expires_at && profile.password_expires_at < new Date().toISOString());

  return {
    mustChangePassword,
    passwordExpired: expired,
    requiresPasswordChange: mustChangePassword || expired
  };
}

export function newUserPasswordFields(role: string, mustChange = true) {
  const now = new Date().toISOString();
  return {
    must_change_password: mustChange,
    password_set_at: now,
    password_expires_at: passwordExpiresAtForRole(role, new Date(now))
  };
}

export function afterPasswordChangeFields(role: string) {
  const now = new Date().toISOString();
  return {
    must_change_password: false,
    password_set_at: now,
    password_expires_at: passwordExpiresAtForRole(role, new Date(now))
  };
}

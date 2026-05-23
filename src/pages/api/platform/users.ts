import type { APIRoute } from 'astro';
import { z } from 'zod';
import { requireSuperAdmin } from '@/lib/platform/auth';
import { listClinicUsers } from '@/lib/platform/service';
import { createClinicUser } from '@/lib/services/clinicUsers';
import { fail, ok } from '@/lib/http';
import { logError } from '@/lib/logger';
import { clinicUserCreateSchema, platformUsersQuerySchema } from '@/lib/validators';
import { hasSupabaseConfig } from '@/lib/supabaseServer';
import {
  addUserDemo,
  DEFAULT_PERMISSIONS,
  getUsersDemo,
  roleLabelFor,
  updateUserDemo,
  type UserListRow
} from '@/lib/platform/usersDemo';
import { logPlatformAudit } from '@/lib/platform/platformAudit';

export const prerender = false;

const userActionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('deactivate'), userId: z.string().min(1) }),
  z.object({ action: z.literal('revoke_sessions'), userId: z.string().min(1) }),
  z.object({ action: z.literal('resend_credentials'), userId: z.string().min(1) }),
  z.object({
    action: z.literal('update_permissions'),
    userId: z.string().min(1),
    permissions: z.record(z.string(), z.record(z.string(), z.boolean()))
  })
]);

const demoCreateSchema = z.object({
  fullName: z.string().min(2, 'Introduce el nombre completo.'),
  email: z.string().email('Introduce un email válido.'),
  phone: z.string().optional(),
  clinicId: z.string().min(1, 'Selecciona una clínica.'),
  accessType: z.enum(['patient_portal', 'clinic_panel'], { message: 'Selecciona un tipo de acceso.' }),
  role: z.string().min(1, 'Selecciona un rol.'),
  userType: z.enum(['staff', 'patient', 'clinic_admin', 'support']),
  sendEmail: z.boolean().optional(),
  forcePasswordChange: z.boolean().optional(),
  permissions: z.record(z.string(), z.record(z.string(), z.boolean())).optional()
});

function mapLiveUser(u: Awaited<ReturnType<typeof listClinicUsers>>[number]): UserListRow {
  const isPatient = u.role === 'patient';
  return {
    id: u.id,
    full_name: u.full_name,
    email: u.email,
    role: u.role,
    role_label: roleLabelFor(u.role, isPatient ? 'patient' : 'staff'),
    access_label: isPatient ? 'Portal paciente' : 'Panel clínica',
    access_type: isPatient ? 'patient_portal' : 'clinic_panel',
    clinic_id: u.clinic_id,
    clinic_name: u.clinic_name,
    clinic_slug: u.clinic_slug,
    status: 'active',
    last_access: new Date(u.created_at).toLocaleDateString('es-ES'),
    created_at: u.created_at,
    credentials_sent: true,
    portal_token_hint: isPatient ? '•••••• ****' : '—',
    active_sessions: 1,
    user_type: isPatient ? 'patient' : u.role === 'clinic_admin' ? 'clinic_admin' : 'staff',
    permissions: isPatient ? {} : DEFAULT_PERMISSIONS,
    initials: u.full_name
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  };
}

export const GET: APIRoute = async (context) => {
  const gate = requireSuperAdmin(context);
  if (gate.response) return gate.response;
  if (!hasSupabaseConfig()) return ok(getUsersDemo(), { demo: true });
  try {
    const clinicId = context.url.searchParams.get('clinicId') ?? undefined;
    const parsed = platformUsersQuerySchema.safeParse({ clinicId });
    if (!parsed.success) return fail('Parámetros inválidos.', 422);
    return ok((await listClinicUsers(parsed.data.clinicId)).map(mapLiveUser));
  } catch (error) {
    logError('platform.users.list', error);
    return fail('No se pudieron listar los usuarios.', 500);
  }
};

export const POST: APIRoute = async (context) => {
  const gate = requireSuperAdmin(context);
  if (gate.response) return gate.response;
  try {
    const body = await context.request.json();

    if (!hasSupabaseConfig()) {
      const parsed = demoCreateSchema.safeParse(body);
      if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);
      const d = parsed.data;
      const access_label = d.accessType === 'patient_portal' ? 'Portal paciente' : 'Panel clínica';
      const user: UserListRow = {
        id: crypto.randomUUID(),
        full_name: d.fullName.trim(),
        email: d.email.trim(),
        role: (d.role as UserListRow['role']) ?? 'patient',
        role_label: roleLabelFor(d.role, d.userType),
        access_label,
        access_type: d.accessType,
        clinic_id: d.clinicId,
        clinic_name: 'Clínica Dental Nova',
        clinic_slug: 'clinica-dental-nova',
        status: 'active',
        last_access: 'Ahora',
        created_at: new Date().toISOString(),
        credentials_sent: Boolean(d.sendEmail ?? true),
        portal_token_hint: d.accessType === 'patient_portal' ? '•••••• xK9p' : '—',
        active_sessions: 0,
        user_type: d.userType,
        permissions: (d.permissions as UserListRow['permissions']) ?? (d.accessType === 'clinic_panel' ? DEFAULT_PERMISSIONS : {}),
        initials: d.fullName
          .split(' ')
          .map((p) => p[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()
      };
      addUserDemo(user);
      await logPlatformAudit({
        action: 'user.created',
        entity: 'user',
        entityId: user.id,
        clinicId: user.clinic_id,
        metadata: { email: user.email, role: user.role_label }
      });
      return ok(user, { message: 'Usuario creado (modo demo).' });
    }

    const parsed = clinicUserCreateSchema.safeParse(body);
    if (!parsed.success) return fail('Datos inválidos.', 422, parsed.error.flatten());
    if (!parsed.data.clinicId) return fail('Indica la clínica (clinicId) a la que pertenece el usuario.', 422);

    const created = await createClinicUser({
      email: parsed.data.email,
      password: parsed.data.password,
      fullName: parsed.data.fullName,
      accessType: parsed.data.accessType,
      role: parsed.data.role,
      clinicId: parsed.data.clinicId,
      permission: parsed.data.permission,
      specialty: parsed.data.specialty,
      sendEmail: parsed.data.sendEmail
    });

    await logPlatformAudit({
      action: 'user.created',
      entity: 'user',
      entityId: created.profile.id,
      clinicId: parsed.data.clinicId,
      metadata: { email: parsed.data.email }
    });

    return ok(
      { user: created.profile, loginPath: created.loginPath, accessLabel: created.accessLabel, emailSent: created.emailSent },
      { message: created.emailSent ? 'Usuario creado. Credenciales enviadas.' : 'Usuario creado.' }
    );
  } catch (error) {
    logError('platform.users.post', error);
    return fail(error instanceof Error ? error.message : 'No se pudo crear el usuario.', 500);
  }
};

export const PATCH: APIRoute = async (context) => {
  const gate = requireSuperAdmin(context);
  if (gate.response) return gate.response;
  try {
    const body = await context.request.json();
    const parsed = userActionSchema.safeParse(body);
    if (!parsed.success) return fail('Acción inválida.', 422);

    if (!hasSupabaseConfig()) {
      const { userId } = parsed.data;
      if (parsed.data.action === 'deactivate') {
        const u = updateUserDemo(userId, { status: 'disabled', active_sessions: 0 });
        if (!u) return fail('Usuario no encontrado.', 404);
        await logPlatformAudit({ action: 'user.deactivated', entity: 'user', entityId: userId, clinicId: u.clinic_id });
        return ok(u);
      }
      if (parsed.data.action === 'revoke_sessions') {
        const u = updateUserDemo(userId, { active_sessions: 0 });
        if (!u) return fail('Usuario no encontrado.', 404);
        await logPlatformAudit({ action: 'user.sessions_revoked', entity: 'user', entityId: userId, clinicId: u.clinic_id });
        return ok(u);
      }
      if (parsed.data.action === 'resend_credentials') {
        const u = updateUserDemo(userId, { credentials_sent: true });
        if (!u) return fail('Usuario no encontrado.', 404);
        await logPlatformAudit({ action: 'user.credentials_resent', entity: 'user', entityId: userId, clinicId: u.clinic_id });
        return ok(u);
      }
      const u = updateUserDemo(userId, { permissions: parsed.data.permissions as UserListRow['permissions'] });
      if (!u) return fail('Usuario no encontrado.', 404);
      await logPlatformAudit({ action: 'user.permissions_updated', entity: 'user', entityId: userId, clinicId: u.clinic_id, metadata: { permissions: parsed.data.permissions } });
      return ok(u);
    }

    return fail('Acciones de usuario requieren Supabase configurado.', 501);
  } catch (error) {
    logError('platform.users.patch', error);
    return fail('No se pudo actualizar el usuario.', 500);
  }
};

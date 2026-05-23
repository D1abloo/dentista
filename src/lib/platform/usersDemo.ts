import type { PlatformRole } from '@/lib/platform/types';

export type UserStatus = 'active' | 'pending' | 'disabled';
export type UserAccessType = 'patient_portal' | 'clinic_panel';

export type PermissionModule = {
  view?: boolean;
  edit?: boolean;
  upload?: boolean;
  delete?: boolean;
  create?: boolean;
  publish?: boolean;
  collect?: boolean;
  register?: boolean;
};

export type UserPermissions = Record<string, PermissionModule>;

export type UserListRow = {
  id: string;
  full_name: string;
  email: string;
  role: PlatformRole;
  role_label: string;
  access_label: string;
  access_type: UserAccessType;
  clinic_id: string;
  clinic_name: string;
  clinic_slug: string;
  status: UserStatus;
  last_access: string;
  created_at: string;
  credentials_sent: boolean;
  portal_token_hint: string;
  active_sessions: number;
  user_type: 'staff' | 'patient' | 'clinic_admin' | 'support';
  permissions: UserPermissions;
  initials: string;
};

export const DEFAULT_PERMISSIONS: UserPermissions = {
  agenda: { view: true, edit: true },
  pacientes: { view: true, edit: true },
  documentos: { view: true, upload: true, delete: false },
  informes: { view: true, create: true, publish: false },
  facturacion: { view: true, create: true, collect: false },
  pagos: { view: true, register: true },
  reportes: { view: true },
  ajustes: { view: true, edit: false }
};

function row(
  id: string,
  full_name: string,
  email: string,
  role: PlatformRole,
  role_label: string,
  access_type: UserAccessType,
  access_label: string,
  last_access: string,
  user_type: UserListRow['user_type'],
  permissions?: UserPermissions
): UserListRow {
  const parts = full_name.split(' ').filter(Boolean);
  const initials = ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? parts[0]?.[1] ?? '')).toUpperCase();
  return {
    id,
    full_name,
    email,
    role,
    role_label,
    access_label,
    access_type,
    clinic_id: 'a0e9a6b1-4c2d-4a1f-9b3e-000000000001',
    clinic_name: 'Clínica Dental Nova',
    clinic_slug: 'clinica-dental-nova',
    status: 'active',
    last_access,
    created_at: '2026-05-21T08:00:00.000Z',
    credentials_sent: true,
    portal_token_hint: access_type === 'patient_portal' ? '•••••• aB12' : '—',
    active_sessions: last_access === 'Sin acceso' ? 0 : 1,
    user_type,
    permissions: permissions ?? {},
    initials
  };
}

let demoStore: UserListRow[] = [
  row('u1', 'Lucía Méndez', 'lucia.mendez@clinicadentalnova.es', 'patient', 'Paciente', 'patient_portal', 'Portal paciente', 'Hoy, 09:12', 'patient'),
  row('u2', 'Ana Torres', 'ana.torres@clinicadentalnova.es', 'patient', 'Paciente', 'patient_portal', 'Portal paciente', 'Ayer, 18:40', 'patient'),
  row('u3', 'Carlos Ruiz', 'carlos.ruiz@clinicadentalnova.es', 'patient', 'Paciente', 'patient_portal', 'Portal paciente', 'Sin acceso', 'patient'),
  row('u4', 'María González', 'maria.gonzalez@clinicadentalnova.es', 'patient', 'Paciente', 'patient_portal', 'Portal paciente', 'Hoy, 10:02', 'patient'),
  row('u5', 'Administrador plataforma', 'admin@dentista.app', 'patient', 'Paciente', 'patient_portal', 'Portal paciente', 'Hoy, 08:45', 'patient'),
  row(
    'u6',
    'Administrador plataforma',
    'admin@dentista.app',
    'clinic_admin',
    'Admin clínica',
    'clinic_panel',
    'Panel clínica',
    'Hoy, 08:45',
    'clinic_admin',
    DEFAULT_PERMISSIONS
  )
];

export function getUsersDemo(): UserListRow[] {
  return demoStore.map((u) => ({ ...u, permissions: { ...u.permissions } }));
}

export function getUsersKpis(users: UserListRow[]) {
  const staff = users.filter((u) => u.user_type === 'staff' || u.user_type === 'clinic_admin').length;
  const patients = users.filter((u) => u.user_type === 'patient').length;
  return {
    total: users.length,
    staff,
    patients,
    pendingInvites: users.filter((u) => u.status === 'pending').length,
    activeAccess: users.filter((u) => u.status === 'active').length,
    unverified: 0
  };
}

export function updateUserDemo(id: string, patch: Partial<UserListRow>): UserListRow | null {
  const idx = demoStore.findIndex((u) => u.id === id);
  if (idx < 0) return null;
  demoStore[idx] = { ...demoStore[idx], ...patch };
  return demoStore[idx];
}

export function addUserDemo(user: UserListRow) {
  demoStore = [user, ...demoStore];
  return user;
}

export function roleLabelFor(role: string, userType: string) {
  if (role === 'patient' || userType === 'patient') return 'Paciente';
  if (role === 'clinic_admin') return 'Admin clínica';
  if (role === 'receptionist') return 'Recepción';
  if (role === 'dentist') return 'Dentista';
  return 'Staff';
}

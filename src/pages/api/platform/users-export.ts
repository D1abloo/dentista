import type { APIRoute } from 'astro';
import { requireSuperAdmin } from '@/lib/platform/auth';
import { listClinicUsers } from '@/lib/platform/service';
import { getUsersDemo } from '@/lib/platform/usersDemo';
import { hasSupabaseConfig } from '@/lib/supabaseServer';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const gate = requireSuperAdmin(context);
  if (gate.response) return gate.response;

  const users = hasSupabaseConfig() ? await listClinicUsers() : getUsersDemo();
  const lines = [
    'Usuario,Email,Rol,Acceso,Clínica,Estado',
    ...users.map((u) => {
      const access = 'access_label' in u ? (u as { access_label: string }).access_label : u.role;
      const status = 'status' in u ? (u as { status: string }).status : 'active';
      const role = 'role_label' in u ? (u as { role_label: string }).role_label : u.role;
      return `"${u.full_name}","${u.email}","${role}","${access}","${u.clinic_name}",${status}`;
    })
  ];
  return new Response(lines.join('\n'), {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="usuarios.csv"'
    }
  });
};

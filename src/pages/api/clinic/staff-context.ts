import type { APIRoute } from 'astro';
import { requireStaffSession } from '@/lib/api/guards';
import { fail, ok } from '@/lib/http';
import { logError } from '@/lib/logger';
import { getStaffContextForSession } from '@/lib/services/staffContext';
import { hasSupabaseConfig } from '@/lib/supabaseServer';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  if (!hasSupabaseConfig()) return fail('Servicio no disponible.', 503);
  const gate = await requireStaffSession(context);
  if (gate.response) return gate.response;

  try {
    const ctx = await getStaffContextForSession(gate.user);
    if (!ctx) return fail('No se pudo resolver el contexto del profesional.', 404);
    return ok(ctx);
  } catch (error) {
    logError('clinic.staff-context', error);
    return fail('Error al cargar contexto de personal.', 500);
  }
};

import type { APIRoute } from 'astro';
import { demoSeed } from '@/data/demoData';
import { fail, ok } from '@/lib/http';
import {
  ensureDemoStateInSupabase,
  isDemoStatePayload,
  saveDemoStateToSupabase,
  useSupabaseDemoStorage
} from '@/lib/supabaseDemo';
import { hasSupabaseConfig } from '@/lib/supabaseServer';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    if (!useSupabaseDemoStorage()) {
      return ok(
        { source: 'local' as const, state: demoSeed },
        { message: 'Modo demo local: configura Supabase en el servidor para datos compartidos.' }
      );
    }
    const state = await ensureDemoStateInSupabase();
    return ok({ source: 'supabase' as const, state }, { message: 'Datos demo cargados desde Supabase.' });
  } catch (error) {
    const details = error instanceof Error ? error.message : error;
    return fail(
      'No se pudo cargar el estado demo desde Supabase. Revisa migraciones y SUPABASE_SERVICE_ROLE_KEY.',
      500,
      details
    );
  }
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    if (!hasSupabaseConfig()) {
      return fail('Supabase no configurado. Añade las variables en Vercel o .env.', 503);
    }
    const body = (await request.json()) as { state?: unknown };
    if (!isDemoStatePayload(body.state)) {
      return fail('Payload inválido: se esperaba un DemoState con tenants y pacientes.', 422);
    }
    await saveDemoStateToSupabase(body.state);
    return ok({ saved: true }, { message: 'Estado demo guardado en Supabase.' });
  } catch (error) {
    const details = error instanceof Error ? error.message : error;
    return fail('No se pudo guardar en Supabase.', 500, details);
  }
};

export const DELETE: APIRoute = async () => {
  try {
    if (!hasSupabaseConfig()) {
      return fail('Supabase no configurado.', 503);
    }
    await saveDemoStateToSupabase(structuredClone(demoSeed));
    return ok({ reset: true }, { message: 'Semilla demo restaurada en Supabase.' });
  } catch (error) {
    const details = error instanceof Error ? error.message : error;
    return fail('No se pudo restaurar la semilla.', 500, details);
  }
};

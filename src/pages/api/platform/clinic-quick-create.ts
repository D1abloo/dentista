import type { APIRoute } from 'astro';
import { z } from 'zod';
import { requireSuperAdmin } from '@/lib/platform/auth';
import { createRegistration } from '@/lib/platform/service';
import { fail, ok } from '@/lib/http';
import { logError } from '@/lib/logger';
import { hasSupabaseConfig } from '@/lib/supabaseServer';

export const prerender = false;

const schema = z.object({
  clinicName: z.string().min(2, 'El nombre de la clínica es obligatorio.'),
  adminEmail: z.string().email('Introduce un email válido.'),
  plan: z.enum(['essential', 'professional', 'enterprise'], { message: 'Selecciona un plan.' }),
  tenantSlug: z
    .string()
    .min(2, 'El identificador del tenant es obligatorio.')
    .regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones.')
});

export const POST: APIRoute = async (context) => {
  const gate = requireSuperAdmin(context);
  if (gate.response) return gate.response;
  if (!hasSupabaseConfig()) {
    return ok({ demo: true, redirect: '/platform/registros' });
  }
  try {
    const body = await context.request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? 'Datos inválidos.', 422);
    }
    const { clinicName, adminEmail, plan, tenantSlug } = parsed.data;
    const reg = await createRegistration({
      clinic_name: clinicName,
      owner_name: 'Administrador clínica',
      email: adminEmail,
      phone: '+34 600 000 000',
      message: `Alta rápida plataforma · plan ${plan} · slug ${tenantSlug}`
    });
    return ok({ registrationId: reg.id, redirect: '/platform/registros' });
  } catch (error) {
    logError('platform.clinic-quick-create', error);
    const msg = error instanceof Error && error.message.includes('duplicate') ? 'Este tenant ya existe.' : 'No se pudo crear la clínica.';
    return fail(msg, 500);
  }
};

import type { APIRoute } from 'astro';
import { requireSuperAdmin } from '@/lib/platform/auth';
import { listPlatformSettings, updatePlatformSetting } from '@/lib/platform/service';
import { fail, ok } from '@/lib/http';
import { logError } from '@/lib/logger';
import { platformSettingsActionSchema, platformSettingsPatchSchema } from '@/lib/validators';
import { hasSupabaseConfig } from '@/lib/supabaseServer';
import { logPlatformAudit } from '@/lib/platform/platformAudit';
import {
  getPlatformSettingsDemo,
  resetPlatformSettingsDemo,
  savePlatformSettingsDemo,
  type PlatformSettingsConfig
} from '@/lib/platform/platformSettingsDemo';
import { notifyInbox, sendMailBatch } from '@/lib/email/send';

export const prerender = false;

function legacyToConfig(rows: { key: string; value: Record<string, unknown> }[]): PlatformSettingsConfig {
  const base = getPlatformSettingsDemo();
  const branding = rows.find((r) => r.key === 'branding')?.value ?? {};
  const registration = rows.find((r) => r.key === 'registration')?.value ?? {};
  return {
    ...base,
    branding: {
      ...base.branding,
      appName: String(branding.appName ?? base.branding.appName),
      supportEmail: String(branding.supportEmail ?? base.branding.supportEmail)
    },
    registration: {
      ...base.registration,
      autoApprove: Boolean(registration.autoApprove ?? base.registration.autoApprove),
      requireEmailVerification:
        registration.requireEmailVerification !== undefined
          ? Boolean(registration.requireEmailVerification)
          : base.registration.requireEmailVerification
    }
  };
}

export const GET: APIRoute = async (context) => {
  const gate = requireSuperAdmin(context);
  if (gate.response) return gate.response;

  if (!hasSupabaseConfig()) {
    return ok(getPlatformSettingsDemo(), { demo: true });
  }

  try {
    const rows = await listPlatformSettings();
    if (rows.length) return ok(legacyToConfig(rows));
    return ok(getPlatformSettingsDemo(), { demo: true });
  } catch (error) {
    logError('platform.settings.list', error);
    return ok(getPlatformSettingsDemo(), { demo: true });
  }
};

export const POST: APIRoute = async (context) => {
  const gate = requireSuperAdmin(context);
  if (gate.response) return gate.response;

  try {
    const body = await context.request.json();
    const parsed = platformSettingsActionSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? 'Datos inválidos.';
      return fail(msg, 422);
    }

    if (parsed.data.action === 'reset') {
      const data = resetPlatformSettingsDemo();
      await logPlatformAudit({ action: 'settings.reset_defaults', entity: 'platform_settings' });
      return ok(data, { message: 'Valores por defecto restaurados.' });
    }

    if (parsed.data.action === 'test_email') {
      const cfg = getPlatformSettingsDemo();
      const to = parsed.data.to ?? notifyInbox();
      const result = await sendMailBatch([
        {
          to,
          subject: `[Dentista+] Email de prueba — ${cfg.emails.fromName}`,
          text: `Hola,\n\nEste es un correo de prueba desde la configuración de plataforma Dentista+.\n\nRemitente configurado: ${cfg.emails.fromEmail}\n\nUn saludo,\nEquipo Dentista+`
        }
      ]);
      await logPlatformAudit({
        action: 'settings.test_email_sent',
        entity: 'platform_settings',
        metadata: { to, mock: result.mock }
      });
      return ok(
        { sent: result.sent, mock: result.mock },
        { message: result.mock ? 'Email de prueba simulado (modo demo).' : 'Email de prueba enviado.' }
      );
    }

    if (parsed.data.action === 'save') {
      const data = savePlatformSettingsDemo(parsed.data.config as PlatformSettingsConfig);
      if (hasSupabaseConfig()) {
        await updatePlatformSetting('branding', {
          appName: data.branding.appName,
          supportEmail: data.branding.supportEmail,
          publicUrl: data.branding.publicUrl,
          primaryColor: data.branding.primaryColor,
          secondaryColor: data.branding.secondaryColor
        });
        await updatePlatformSetting('registration', {
          autoApprove: data.registration.autoApprove,
          requireEmailVerification: data.registration.requireEmailVerification,
          defaultPlan: data.registration.defaultPlan,
          initialSeats: data.registration.initialSeats
        });
      }
      await logPlatformAudit({ action: 'settings.saved', entity: 'platform_settings' });
      return ok(data, { message: 'Cambios guardados correctamente.' });
    }

    return fail('Acción no reconocida.', 400);
  } catch (error) {
    logError('platform.settings.post', error);
    return fail('No se pudieron guardar los cambios.', 500);
  }
};

export const PATCH: APIRoute = async (context) => {
  const gate = requireSuperAdmin(context);
  if (gate.response) return gate.response;

  if (!hasSupabaseConfig()) {
    try {
      const body = await context.request.json();
      const current = getPlatformSettingsDemo();
      const key = body.key as 'branding' | 'registration';
      const patch = body.value as Record<string, unknown>;
      if (key === 'branding') {
        current.branding = { ...current.branding, ...patch } as PlatformSettingsConfig['branding'];
      } else if (key === 'registration') {
        current.registration = { ...current.registration, ...patch } as PlatformSettingsConfig['registration'];
      }
      savePlatformSettingsDemo(current);
      await logPlatformAudit({ action: 'settings.partial_update', entity: 'platform_settings', metadata: { key } });
      return ok(getPlatformSettingsDemo(), { message: 'Guardado.' });
    } catch (error) {
      logError('platform.settings.patch.demo', error);
      return fail('No se pudieron guardar los cambios.', 500);
    }
  }

  try {
    const body = await context.request.json();
    const parsed = platformSettingsPatchSchema.safeParse(body);
    if (!parsed.success) return fail('Payload inválido.', 422, parsed.error.flatten());
    await updatePlatformSetting(parsed.data.key, parsed.data.value);
    await logPlatformAudit({
      action: 'settings.partial_update',
      entity: 'platform_settings',
      metadata: { key: parsed.data.key }
    });
    return ok({ updated: true, key: parsed.data.key });
  } catch (error) {
    logError('platform.settings.patch', error);
    return fail('No se pudo actualizar la configuración.', 500);
  }
};

import type { APIRoute } from 'astro';
import { requireSuperAdmin } from '@/lib/platform/auth';
import { listUsageMetrics } from '@/lib/platform/service';
import { fail, ok } from '@/lib/http';
import { logError } from '@/lib/logger';
import { metricsActionSchema } from '@/lib/validators';
import { hasSupabaseConfig } from '@/lib/supabaseServer';
import { logPlatformAudit } from '@/lib/platform/platformAudit';
import { getMetricsDemo, refreshMetricsDemo, updateRetentionDemo } from '@/lib/platform/metricsDemo';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const gate = requireSuperAdmin(context);
  if (gate.response) return gate.response;

  if (!hasSupabaseConfig()) {
    return ok(getMetricsDemo(), { demo: true });
  }

  try {
    const usage = await listUsageMetrics(30);
    if (usage.length) {
      return ok(getMetricsDemo(), { demo: true, note: 'merged_with_usage' });
    }
    return ok(getMetricsDemo(), { demo: true });
  } catch (error) {
    logError('platform.metrics.list', error);
    return ok(getMetricsDemo(), { demo: true });
  }
};

export const POST: APIRoute = async (context) => {
  const gate = requireSuperAdmin(context);
  if (gate.response) return gate.response;

  try {
    const body = await context.request.json();
    const parsed = metricsActionSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? 'Datos inválidos.';
      return fail(msg, 422);
    }

    if (parsed.data.action === 'refresh') {
      const data = refreshMetricsDemo();
      await logPlatformAudit({ action: 'metrics.refreshed', entity: 'platform_metrics' });
      return ok(data, { message: 'Métricas actualizadas.' });
    }

    if (parsed.data.action === 'update_retention') {
      const data = updateRetentionDemo(parsed.data.retentionDays);
      await logPlatformAudit({
        action: 'metrics.retention_updated',
        entity: 'platform_settings',
        metadata: { retentionDays: parsed.data.retentionDays }
      });
      return ok(data, { message: 'Retención configurada.' });
    }

    return fail('Acción no reconocida.', 400);
  } catch (error) {
    logError('platform.metrics.post', error);
    return fail('No se pudieron actualizar las métricas.', 500);
  }
};

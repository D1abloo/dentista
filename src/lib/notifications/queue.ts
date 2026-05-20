import { sendAppointmentNotifications } from '@/lib/notifications';
import { getSupabaseAdmin, hasSupabaseConfig, isDemoMode } from '@/lib/supabaseServer';

export type QueueProcessResult = {
  processed: number;
  sent: number;
  failed: number;
  jobs: Array<{ id: string; status: string; error?: string }>;
};

function env(name: string) {
  return String((import.meta.env as Record<string, string | undefined>)[name] ?? '').trim();
}

export async function processNotificationQueue(limit = 20): Promise<QueueProcessResult> {
  if (isDemoMode() || !hasSupabaseConfig()) {
    return { processed: 0, sent: 0, failed: 0, jobs: [] };
  }

  const db = getSupabaseAdmin();
  const { data: jobs, error } = await db
    .from('notification_jobs')
    .select('*')
    .eq('status', 'queued')
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) throw error;
  const rows = jobs ?? [];
  const result: QueueProcessResult = { processed: rows.length, sent: 0, failed: 0, jobs: [] };

  for (const job of rows) {
    const jobId = job.id as string;
    await db.from('notification_jobs').update({ status: 'processing' }).eq('id', jobId);

    try {
      const payload = (job.payload ?? {}) as {
        appointmentId?: string;
        template?: string;
      };
      const appointmentId = payload.appointmentId;
      if (!appointmentId) throw new Error('Job sin appointmentId.');

      const { data: appt, error: apptErr } = await db
        .from('appointments_view')
        .select('*')
        .eq('clinic_id', job.clinic_id)
        .eq('id', appointmentId)
        .maybeSingle();
      if (apptErr || !appt) throw apptErr ?? new Error('Cita no encontrada para el recordatorio.');

      const { data: profile } = await db
        .from('profiles')
        .select('email, phone, full_name')
        .eq('id', appt.patient_id)
        .maybeSingle();

      const channel = job.channel as 'email' | 'whatsapp' | 'sms';
      const channels = [channel];
      const starts = new Date(appt.starts_at);
      const date = starts.toISOString().slice(0, 10);
      const time = starts.toISOString().slice(11, 16);
      const template = payload.template ?? 'Recordatorio de cita';

      const { results } = await sendAppointmentNotifications(
        {
          channels,
          patientId: appt.patient_id,
          appointmentId,
          patientName: appt.patient_name ?? profile?.full_name ?? 'Paciente',
          patientEmail: profile?.email ?? undefined,
          patientPhone: profile?.phone ?? undefined,
          treatmentName: appt.treatment_name ?? 'Tratamiento',
          dentistName: appt.dentist_name ?? 'Profesional',
          clinicName: template,
          cabinetName: appt.room_name ?? 'Gabinete',
          date,
          time
        },
        env('PUBLIC_APP_URL') || 'http://localhost:4321'
      );

      const okResult = results.find((r) => r.status === 'sent' || r.status === 'mock');
      if (!okResult) {
        const errMsg = results.map((r) => r.error).filter(Boolean).join(' · ') || 'Envío fallido.';
        throw new Error(errMsg);
      }

      await db
        .from('notification_jobs')
        .update({
          status: 'sent',
          provider: okResult.provider,
          processed_at: new Date().toISOString(),
          error: null
        })
        .eq('id', jobId);

      result.sent += 1;
      result.jobs.push({ id: jobId, status: 'sent' });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error desconocido';
      await db
        .from('notification_jobs')
        .update({
          status: 'failed',
          error: message,
          processed_at: new Date().toISOString()
        })
        .eq('id', jobId);
      result.failed += 1;
      result.jobs.push({ id: jobId, status: 'failed', error: message });
    }
  }

  return result;
}

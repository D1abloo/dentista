import { isClientDemoMode } from '@/lib/appMode';
import { notifyPatientMessageToClinic } from '@/lib/clinicNotifications';
import { addMessage } from '@/lib/demoStore';
import type { DemoState, Message, Patient } from '@/types/demo';

export type SendClinicMessageInput = {
  subject: string;
  body: string;
  attachmentRef?: string;
  attachmentName?: string;
  replyTo?: Pick<Message, 'subject' | 'tenantId'>;
};

export type SendClinicMessageResult =
  | { ok: true; messageId: string; demoState?: DemoState }
  | { ok: false; error: string };

export async function sendPatientMessageToClinic(opts: {
  state: DemoState;
  patient: Pick<Patient, 'id' | 'preferredClinicId'>;
  clinicId: string;
  input: SendClinicMessageInput;
}): Promise<SendClinicMessageResult> {
  const body = opts.input.body.trim();
  if (!body) return { ok: false, error: 'Escribe un mensaje antes de enviar.' };

  const clinic = opts.state.clinics.find((c) => c.id === opts.clinicId && c.active);
  if (!clinic) return { ok: false, error: 'Selecciona una clínica válida para enviar el mensaje.' };

  const subject =
    opts.input.subject.trim() ||
    (opts.input.replyTo ? `Re: ${opts.input.replyTo.subject}` : 'Consulta al equipo clínico');

  const tenantId = opts.input.replyTo?.tenantId ?? clinic.tenantId;

  if (!isClientDemoMode()) {
    try {
      const res = await fetch('/api/records/message', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          clinicId: clinic.id,
          patientId: opts.patient.id,
          subject,
          body,
          channel: 'app',
          type: 'clinica',
          fromPatient: true
        })
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null;
        return { ok: false, error: err?.error ?? 'No se pudo enviar el mensaje.' };
      }
      const data = (await res.json()) as { data?: { id?: string } };
      return { ok: true, messageId: data.data?.id ?? `live-${Date.now()}` };
    } catch {
      return { ok: false, error: 'No se pudo enviar el mensaje.' };
    }
  }

  const sentAt = new Date().toISOString();
  let next = addMessage(opts.state, {
    tenantId,
    patientId: opts.patient.id,
    subject,
    body,
    channel: 'app',
    type: 'clinica',
    read: true,
    fromPatient: true,
    sentAt,
    attachmentRef: opts.input.attachmentRef,
    attachmentName: opts.input.attachmentName
  });
  const created = next.messages[0];
  if (!created) return { ok: false, error: 'No se pudo guardar el mensaje.' };
  const id = created.id;
  next = notifyPatientMessageToClinic(next, {
    tenantId,
    patientId: opts.patient.id,
    messageId: id,
    subject,
    body
  });
  return { ok: true, messageId: id, demoState: next };
}

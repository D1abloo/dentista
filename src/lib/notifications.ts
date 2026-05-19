import { buildActivationUrl } from './activation';

export type NotificationChannel = 'email' | 'whatsapp' | 'sms';

export interface AppointmentNotificationInput {
  channels: NotificationChannel[];
  patientId: string;
  appointmentId: string;
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
  treatmentName: string;
  dentistName: string;
  clinicName: string;
  cabinetName: string;
  date: string;
  time: string;
}

export interface NotificationResult {
  channel: NotificationChannel;
  provider: string;
  status: 'sent' | 'mock' | 'skipped' | 'failed';
  to?: string;
  messageId?: string;
  error?: string;
}

function envValue(key: string) {
  const env = import.meta.env as Record<string, string | undefined>;
  return String(env[key] ?? '').trim();
}

function appBaseUrl() {
  return envValue('PUBLIC_APP_URL') || 'http://localhost:4321';
}

function normalizePhone(phone?: string) {
  return (phone ?? '').replace(/[^\d]/g, '');
}

function appointmentText(input: AppointmentNotificationInput, activationUrl: string) {
  return [
    `Hola ${input.patientName}.`,
    `Tu cita de ${input.treatmentName} en ${input.clinicName} queda registrada para el ${input.date} a las ${input.time}.`,
    `Profesional: ${input.dentistName}. Gabinete: ${input.cabinetName}.`,
    `Activa tu cuenta y consulta tus citas aquí: ${activationUrl}`
  ].join('\n');
}

function emailHtml(input: AppointmentNotificationInput, activationUrl: string) {
  return `
    <div style="font-family:Inter,Arial,sans-serif;max-width:640px;margin:0 auto;color:#07142f">
      <div style="background:#0f5f85;color:white;border-radius:24px;padding:28px;margin-bottom:20px">
        <h1 style="margin:0;font-size:28px">Cita registrada en Dentista+</h1>
        <p style="margin:10px 0 0;font-weight:700;color:#d9f9ff">Activa tu cuenta para ver tus citas y datos del panel.</p>
      </div>
      <div style="border:1px solid #e2e8f0;border-radius:22px;padding:22px">
        <p>Hola <b>${input.patientName}</b>, tu cita se ha registrado correctamente.</p>
        <p><b>Tratamiento:</b> ${input.treatmentName}</p>
        <p><b>Clínica:</b> ${input.clinicName}</p>
        <p><b>Profesional:</b> ${input.dentistName}</p>
        <p><b>Fecha y hora:</b> ${input.date} · ${input.time}</p>
        <a href="${activationUrl}" style="display:inline-block;background:#0eaddd;color:white;text-decoration:none;font-weight:900;border-radius:16px;padding:14px 18px;margin-top:12px">Activar cuenta y ver mis citas</a>
      </div>
    </div>
  `;
}

async function sendWhatsApp(input: AppointmentNotificationInput, activationUrl: string): Promise<NotificationResult> {
  const provider = envValue('WHATSAPP_PROVIDER') || 'mock';
  const to = normalizePhone(input.patientPhone || envValue('WHATSAPP_TEST_TO'));
  if (!to) return { channel: 'whatsapp', provider, status: 'skipped', error: 'Falta teléfono del paciente.' };
  if (provider !== 'meta') return { channel: 'whatsapp', provider, status: 'mock', to };

  const token = envValue('WHATSAPP_ACCESS_TOKEN');
  const phoneNumberId = envValue('WHATSAPP_PHONE_NUMBER_ID');
  const version = envValue('WHATSAPP_GRAPH_VERSION') || 'v25.0';
  if (!token || !phoneNumberId) {
    return { channel: 'whatsapp', provider, status: 'mock', to, error: 'Faltan WHATSAPP_ACCESS_TOKEN o WHATSAPP_PHONE_NUMBER_ID.' };
  }

  const response = await fetch(`https://graph.facebook.com/${version}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: {
        preview_url: true,
        body: appointmentText(input, activationUrl)
      }
    })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { channel: 'whatsapp', provider, status: 'failed', to, error: payload?.error?.message ?? 'WhatsApp Cloud API rechazó el envío.' };
  }
  return { channel: 'whatsapp', provider, status: 'sent', to, messageId: payload?.messages?.[0]?.id };
}

async function sendEmail(input: AppointmentNotificationInput, activationUrl: string): Promise<NotificationResult> {
  const provider = envValue('EMAIL_PROVIDER') || 'mock';
  const to = input.patientEmail?.trim();
  if (!to) return { channel: 'email', provider, status: 'skipped', error: 'Falta correo del paciente.' };
  if (provider !== 'resend') return { channel: 'email', provider, status: 'mock', to };

  const apiKey = envValue('RESEND_API_KEY');
  const from = envValue('EMAIL_FROM') || 'Dentista+ <no-reply@dentistaplus.demo>';
  if (!apiKey) return { channel: 'email', provider, status: 'mock', to, error: 'Falta RESEND_API_KEY.' };

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to,
      subject: 'Activa tu cuenta Dentista+ y consulta tu cita',
      html: emailHtml(input, activationUrl)
    })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { channel: 'email', provider, status: 'failed', to, error: payload?.message ?? 'El proveedor de correo rechazó el envío.' };
  }
  return { channel: 'email', provider, status: 'sent', to, messageId: payload?.id };
}

async function sendSms(input: AppointmentNotificationInput, activationUrl: string): Promise<NotificationResult> {
  const provider = envValue('SMS_PROVIDER') || 'mock';
  const to = normalizePhone(input.patientPhone);
  if (!to) return { channel: 'sms', provider, status: 'skipped', error: 'Falta teléfono del paciente.' };
  void activationUrl;
  return { channel: 'sms', provider, status: 'mock', to };
}

export async function sendAppointmentNotifications(input: AppointmentNotificationInput, baseUrl = appBaseUrl()) {
  const activationUrl = buildActivationUrl(baseUrl, {
    patientId: input.patientId,
    appointmentId: input.appointmentId
  });
  const uniqueChannels = Array.from(new Set(input.channels));
  const results = await Promise.all(uniqueChannels.map(async (channel) => {
    try {
      if (channel === 'whatsapp') return await sendWhatsApp(input, activationUrl);
      if (channel === 'email') return await sendEmail(input, activationUrl);
      return await sendSms(input, activationUrl);
    } catch (error) {
      return {
        channel,
        provider: channel === 'whatsapp' ? envValue('WHATSAPP_PROVIDER') || 'mock' : channel === 'email' ? envValue('EMAIL_PROVIDER') || 'mock' : envValue('SMS_PROVIDER') || 'mock',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Error desconocido.'
      } satisfies NotificationResult;
    }
  }));

  return {
    activationUrl,
    results
  };
}

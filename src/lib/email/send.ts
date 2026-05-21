import nodemailer from 'nodemailer';
import {
  emailFromAddress,
  getEmailStatus,
  isProduction,
  notifyInbox,
  resolveEmailProvider,
  type EmailProvider
} from '@/lib/email/config';
import { textToHtml, wrapEmailHtml } from '@/lib/email/templates';

export type SendMailInput = {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
  /** En producción, falla si el correo no está configurado o el envío falla. */
  requireDelivery?: boolean;
};

export type SendMailResult = {
  sent: boolean;
  mock: boolean;
  provider: EmailProvider;
};

export { getEmailStatus, notifyInbox };

let smtpVerified = false;

async function sendViaSmtp(input: SendMailInput): Promise<void> {
  const port = Number(import.meta.env.SMTP_PORT ?? 465);
  const secure = import.meta.env.SMTP_SECURE !== 'false';
  const transport = nodemailer.createTransport({
    host: import.meta.env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: import.meta.env.SMTP_USER,
      pass: import.meta.env.SMTP_PASS
    }
  });

  if (!smtpVerified) {
    await transport.verify();
    smtpVerified = true;
  }

  const html = input.html ?? wrapEmailHtml(textToHtml(input.text));
  await transport.sendMail({
    from: emailFromAddress(),
    to: input.to,
    replyTo: input.replyTo,
    subject: input.subject,
    text: input.text,
    html
  });
}

async function sendViaResend(input: SendMailInput): Promise<void> {
  const apiKey = String(import.meta.env.RESEND_API_KEY ?? '').trim();
  const from = emailFromAddress();
  const html = input.html ?? wrapEmailHtml(textToHtml(input.text));
  const toList = Array.isArray(input.to) ? input.to : [input.to];

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to: toList,
      subject: input.subject,
      text: input.text,
      html,
      reply_to: input.replyTo
    })
  });

  const payload = (await response.json().catch(() => ({}))) as { message?: string };
  if (!response.ok) {
    throw new Error(payload.message ?? `Resend respondió ${response.status}.`);
  }
}

export async function sendMail(input: SendMailInput): Promise<SendMailResult> {
  const provider = resolveEmailProvider();
  const requireDelivery = input.requireDelivery ?? isProduction();

  if (provider === 'none') {
    if (requireDelivery) {
      throw new Error(
        'El envío de correo no está configurado. Define SMTP_HOST, SMTP_USER y SMTP_PASS (Hostinger) o RESEND_API_KEY en el servidor.'
      );
    }
    console.info('[email:mock]', input.subject, '→', input.to);
    return { sent: false, mock: true, provider: 'none' };
  }

  try {
    if (provider === 'smtp') await sendViaSmtp(input);
    else await sendViaResend(input);
    return { sent: true, mock: false, provider };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al enviar correo.';
    if (requireDelivery) throw new Error(message);
    console.error('[email:failed]', message, input.subject);
    return { sent: false, mock: true, provider };
  }
}

/** Envía varios correos y exige entrega en producción si alguno falla. */
export async function sendMailBatch(
  messages: SendMailInput[]
): Promise<{ sent: boolean; mock: boolean; provider: EmailProvider }> {
  const results = await Promise.all(messages.map((m) => sendMail(m)));
  const mock = results.some((r) => r.mock);
  const provider = results.find((r) => r.provider !== 'none')?.provider ?? 'none';
  return { sent: !mock, mock, provider };
}

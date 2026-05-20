import nodemailer from 'nodemailer';

type SendMailInput = {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
};

function smtpConfigured() {
  return Boolean(
    import.meta.env.SMTP_HOST &&
      import.meta.env.SMTP_USER &&
      import.meta.env.SMTP_PASS &&
      import.meta.env.EMAIL_PROVIDER === 'smtp'
  );
}

function createTransport() {
  const port = Number(import.meta.env.SMTP_PORT ?? 465);
  const secure = import.meta.env.SMTP_SECURE !== 'false';
  return nodemailer.createTransport({
    host: import.meta.env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: import.meta.env.SMTP_USER,
      pass: import.meta.env.SMTP_PASS
    }
  });
}

export async function sendMail(input: SendMailInput): Promise<{ sent: boolean; mock: boolean }> {
  const from = import.meta.env.SMTP_FROM ?? import.meta.env.EMAIL_FROM ?? 'Dentista+ <no-reply@example.com>';

  if (!smtpConfigured()) {
    console.info('[email:mock]', input.subject, '→', input.to);
    return { sent: true, mock: true };
  }

  const transport = createTransport();
  await transport.sendMail({
    from,
    to: input.to,
    replyTo: input.replyTo,
    subject: input.subject,
    text: input.text,
    html: input.html ?? input.text.replace(/\n/g, '<br>')
  });
  return { sent: true, mock: false };
}

export function notifyInbox() {
  return import.meta.env.CONTACT_NOTIFY_EMAIL ?? import.meta.env.SMTP_USER ?? 'info@estructuraweb.es';
}

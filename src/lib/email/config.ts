export type EmailProvider = 'smtp' | 'resend' | 'none';

export type EmailStatus = {
  configured: boolean;
  provider: EmailProvider;
  from: string;
  notifyInbox: string;
};

function env(name: string) {
  return String((import.meta.env as Record<string, string | undefined>)[name] ?? '').trim();
}

export function isProduction() {
  return Boolean(import.meta.env.PROD);
}

export function emailFromAddress() {
  return env('SMTP_FROM') || env('EMAIL_FROM') || 'Dentista+ <no-reply@example.com>';
}

export function notifyInbox() {
  return env('CONTACT_NOTIFY_EMAIL') || env('SMTP_USER') || 'info@estructuraweb.es';
}

function smtpReady() {
  return Boolean(env('SMTP_HOST') && env('SMTP_USER') && env('SMTP_PASS'));
}

function resendReady() {
  return Boolean(env('RESEND_API_KEY'));
}

/** Resuelve proveedor: auto detecta SMTP o Resend si hay credenciales. */
export function resolveEmailProvider(): EmailProvider {
  const explicit = env('EMAIL_PROVIDER').toLowerCase();
  if (explicit === 'mock' || explicit === 'none') return 'none';
  if (explicit === 'smtp') return smtpReady() ? 'smtp' : 'none';
  if (explicit === 'resend') return resendReady() ? 'resend' : 'none';
  if (smtpReady()) return 'smtp';
  if (resendReady()) return 'resend';
  return 'none';
}

export function getEmailStatus(): EmailStatus {
  const provider = resolveEmailProvider();
  return {
    configured: provider !== 'none',
    provider,
    from: emailFromAddress(),
    notifyInbox: notifyInbox()
  };
}

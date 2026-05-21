import { sendMail } from '@/lib/email/send';

function appUrl(path: string) {
  const base = (import.meta.env.PUBLIC_APP_URL ?? 'http://localhost:4321').replace(/\/$/, '');
  return `${base}${path}`;
}

export async function sendPatientActivationEmail(input: {
  fullName: string;
  email: string;
  clinicName: string;
  activationUrl: string;
}) {
  const text = [
    `Hola ${input.fullName},`,
    '',
    `Gracias por registrarte en Dentista+ para gestionar tus citas en ${input.clinicName}.`,
    '',
    'Para activar tu cuenta y reservar citas, abre este enlace (válido 48 horas):',
    input.activationUrl,
    '',
    'Si no solicitaste este registro, ignora este mensaje.',
    '',
    'Equipo Dentista+'
  ].join('\n');

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:520px;color:#0f172a">
      <p>Hola <strong>${input.fullName}</strong>,</p>
      <p>Gracias por registrarte en <strong>Dentista+</strong> para ${input.clinicName}.</p>
      <p style="margin:20px 0">Pulsa el botón para <strong>activar tu cuenta</strong> y poder reservar citas, ver informes y facturas:</p>
      <p><a href="${input.activationUrl}" style="display:inline-block;padding:14px 22px;background:linear-gradient(135deg,#0ea5e9,#14b8a6);color:#fff;text-decoration:none;border-radius:12px;font-weight:800">Activar mi cuenta</a></p>
      <p style="color:#64748b;font-size:13px;margin-top:24px">El enlace caduca en 48 horas. Si no puedes pulsar el botón, copia esta URL en el navegador:<br/><span style="word-break:break-all">${input.activationUrl}</span></p>
    </div>
  `;

  return sendMail({
    to: input.email,
    subject: 'Activa tu cuenta de paciente · Dentista+',
    text,
    html,
    requireDelivery: true
  });
}

export async function sendPatientRegistrationPendingEmail(input: {
  fullName: string;
  email: string;
  clinicName: string;
}) {
  const loginUrl = appUrl('/login');
  const text = [
    `Hola ${input.fullName},`,
    '',
    `Hemos recibido tu solicitud de registro en ${input.clinicName}.`,
    'Revisa tu bandeja de entrada: te enviamos un segundo correo con el enlace de activación.',
    '',
    `Cuando actives la cuenta podrás iniciar sesión en ${loginUrl}`,
    '',
    'Equipo Dentista+'
  ].join('\n');

  const html = `
    <p>Hola <strong>${input.fullName}</strong>,</p>
    <p>Hemos registrado tu solicitud para <strong>${input.clinicName}</strong>.</p>
    <p>Revisa tu correo: te hemos enviado el enlace para <strong>activar tu cuenta</strong>.</p>
    <p style="color:#64748b;font-size:13px">Después podrás <a href="${loginUrl}">iniciar sesión</a> y reservar citas.</p>
  `;

  return sendMail({
    to: input.email,
    subject: 'Registro recibido — activa tu cuenta · Dentista+',
    text,
    html,
    requireDelivery: false
  });
}

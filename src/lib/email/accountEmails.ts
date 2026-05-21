import { sendMail } from '@/lib/email/send';

function appUrl(path: string) {
  const base = (import.meta.env.PUBLIC_APP_URL ?? 'http://localhost:4321').replace(/\/$/, '');
  return `${base}${path}`;
}

function credentialsBlock(email: string, password: string, loginPath: string) {
  return [
    `Email: ${email}`,
    `Contraseña temporal: ${password}`,
    '',
    `Enlace de acceso: ${appUrl(loginPath)}`,
    '',
    'Por seguridad, deberás cambiar la contraseña en el primer inicio de sesión.',
    'Las contraseñas de personal y pacientes caducan a los 3 meses. Los administradores de clínica no caducan.'
  ].join('\n');
}

export async function sendOrganizationApprovedEmail(input: {
  ownerName: string;
  clinicName: string;
  email: string;
  password: string;
}) {
  const loginUrl = appUrl('/login/admin');
  const text = [
    `Hola ${input.ownerName},`,
    '',
    `Tu organización «${input.clinicName}» ha sido aprobada en Dentista+.`,
    'Ya puedes acceder al panel administrativo con estas credenciales:',
    '',
    credentialsBlock(input.email, input.password, '/login/admin'),
    '',
    'Un saludo,',
    'Equipo Dentista+'
  ].join('\n');

  const html = `
    <p>Hola <strong>${input.ownerName}</strong>,</p>
    <p>Tu organización <strong>${input.clinicName}</strong> ya está activa en Dentista+.</p>
    <table style="margin:16px 0;border-collapse:collapse;font-family:sans-serif;font-size:14px">
      <tr><td style="padding:6px 12px;background:#f1f5f9;font-weight:600">Email</td><td style="padding:6px 12px">${input.email}</td></tr>
      <tr><td style="padding:6px 12px;background:#f1f5f9;font-weight:600">Contraseña temporal</td><td style="padding:6px 12px;font-family:monospace">${input.password}</td></tr>
    </table>
    <p><a href="${loginUrl}" style="display:inline-block;padding:12px 20px;background:#1d4ed8;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">Entrar al panel</a></p>
    <p style="color:#64748b;font-size:13px">Cambia la contraseña en tu primer acceso. El personal y pacientes renuevan cada 3 meses; los administradores de clínica no caducan.</p>
  `;

  return sendMail({
    to: input.email,
    subject: `Alta aprobada — acceso a ${input.clinicName} · Dentista+`,
    text,
    html
  });
}

export async function sendNewUserCredentialsEmail(input: {
  fullName: string;
  email: string;
  password: string;
  accessLabel: string;
  loginPath: string;
  roleLabel: string;
}) {
  const loginUrl = appUrl(input.loginPath);
  const text = [
    `Hola ${input.fullName},`,
    '',
    `Se ha creado tu acceso a Dentista+ (${input.accessLabel}).`,
    `Rol: ${input.roleLabel}`,
    '',
    credentialsBlock(input.email, input.password, input.loginPath),
    '',
    'Equipo Dentista+'
  ].join('\n');

  const html = `
    <p>Hola <strong>${input.fullName}</strong>,</p>
    <p>Tu cuenta en Dentista+ está lista (<em>${input.accessLabel}</em> · ${input.roleLabel}).</p>
    <table style="margin:16px 0;border-collapse:collapse;font-family:sans-serif;font-size:14px">
      <tr><td style="padding:6px 12px;background:#f1f5f9;font-weight:600">Email</td><td style="padding:6px 12px">${input.email}</td></tr>
      <tr><td style="padding:6px 12px;background:#f1f5f9;font-weight:600">Contraseña temporal</td><td style="padding:6px 12px;font-family:monospace">${input.password}</td></tr>
    </table>
    <p><a href="${loginUrl}" style="display:inline-block;padding:12px 20px;background:#1d4ed8;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">Iniciar sesión</a></p>
  `;

  return sendMail({
    to: input.email,
    subject: 'Tu acceso a Dentista+',
    text,
    html
  });
}

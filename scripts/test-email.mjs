#!/usr/bin/env node
/**
 * Prueba envío SMTP/Resend con las variables del .env local.
 * Uso: node --env-file=.env scripts/test-email.mjs [destino@email.com]
 */
import nodemailer from 'nodemailer';

const to = process.argv[2] || process.env.CONTACT_NOTIFY_EMAIL || process.env.SMTP_USER;
if (!to) {
  console.error('Indica destino: node --env-file=.env scripts/test-email.mjs tu@email.com');
  process.exit(1);
}

const host = process.env.SMTP_HOST;
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const resendKey = process.env.RESEND_API_KEY;

if (host && user && pass) {
  const port = Number(process.env.SMTP_PORT ?? 465);
  const secure = process.env.SMTP_SECURE !== 'false';
  const transport = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
  await transport.verify();
  const info = await transport.sendMail({
    from: process.env.SMTP_FROM || process.env.EMAIL_FROM || user,
    to,
    subject: 'Prueba Dentista+ SMTP',
    text: 'Si recibes este correo, SMTP está configurado correctamente.'
  });
  console.log('SMTP OK →', info.messageId);
  process.exit(0);
}

if (resendKey) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${resendKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || 'Dentista+ <onboarding@resend.dev>',
      to: [to],
      subject: 'Prueba Dentista+ Resend',
      text: 'Si recibes este correo, Resend está configurado correctamente.'
    })
  });
  const body = await res.json();
  if (!res.ok) {
    console.error('Resend error:', body);
    process.exit(1);
  }
  console.log('Resend OK →', body.id);
  process.exit(0);
}

console.error('Configura SMTP_HOST/SMTP_USER/SMTP_PASS o RESEND_API_KEY en .env');
process.exit(1);

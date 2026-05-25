import { getSupabaseAdmin, hasSupabaseConfig } from '@/lib/supabaseServer';
import { sendMailBatch, notifyInbox } from '@/lib/email/send';
import { textToHtml } from '@/lib/email/templates';
import type { SupportRequest } from '@/lib/platform/types';
import { addPublicContactTicketDemo } from '@/lib/platform/supportDemo';
import type { EmailProvider } from '@/lib/email/config';

const CATEGORY_MAP = {
  soporte: 'general',
  paciente: 'patient',
  clinica: 'clinic',
  facturacion: 'billing',
  tecnico: 'technical',
  portal: 'technical',
  otro: 'general'
} as const;

export type ContactFormInput = {
  name: string;
  email: string;
  clinic?: string;
  type: keyof typeof CATEGORY_MAP;
  message: string;
};

export type FormEmailResult = {
  sent: boolean;
  mock: boolean;
  provider: EmailProvider;
};

export async function submitContactForm(input: ContactFormInput) {
  const category = CATEGORY_MAP[input.type] ?? 'general';
  const subject = `Contacto web: ${input.type} — ${input.name}`;
  const bodyParts = [
    `Nombre: ${input.name}`,
    `Email: ${input.email}`,
    input.clinic ? `Clínica: ${input.clinic}` : null,
    `Tipo: ${input.type}`,
    '',
    input.message
  ].filter(Boolean);
  const body = bodyParts.join('\n');

  let ticket: SupportRequest | null = null;
  if (hasSupabaseConfig()) {
    const db = getSupabaseAdmin();
    const { data, error } = await db
      .from('support_requests')
      .insert({
        requester_name: input.name,
        requester_email: input.email,
        subject,
        body,
        category,
        status: 'open'
      })
      .select()
      .single();
    if (error) throw error;
    ticket = data as SupportRequest;
  }

  const inbox = notifyInbox();
  if (!hasSupabaseConfig()) {
    addPublicContactTicketDemo({
      name: input.name,
      email: input.email,
      type: input.type,
      message: input.message,
      clinic: input.clinic
    });
  }

  const email = await sendMailBatch([
    {
      to: inbox,
      replyTo: input.email,
      subject: `[Dentista+] ${subject}`,
      text: body,
      html: `<p>${textToHtml(body)}</p>`
    },
    {
      to: input.email,
      subject: 'Hemos recibido tu mensaje — Dentista+',
      text: `Hola ${input.name},\n\nGracias por contactar con Dentista+. Hemos registrado tu consulta y te responderemos en menos de 24 horas laborables.\n\nUn saludo,\nEquipo Dentista+`
    }
  ]);

  return { ticketId: ticket?.id ?? null, email };
}

const PRO_PLAN_LABELS = {
  pro_clinica: 'PRO Clínica',
  pro_multi: 'PRO Multi-clínica'
} as const;

export type ProAccessFormInput = {
  clinic_name: string;
  contact_name: string;
  email: string;
  phone: string;
  branches: number;
  plan: keyof typeof PRO_PLAN_LABELS;
  message: string;
};

export async function submitProAccessForm(input: ProAccessFormInput) {
  const planLabel = PRO_PLAN_LABELS[input.plan];
  const message = [
    `Solicitud de acceso PRO — ${planLabel}`,
    '',
    `Clínica: ${input.clinic_name}`,
    `Contacto: ${input.contact_name}`,
    `Teléfono: ${input.phone}`,
    `Sedes: ${input.branches}`,
    `Plan: ${planLabel}`,
    '',
    input.message
  ].join('\n');

  return submitContactForm({
    name: input.contact_name,
    email: input.email,
    clinic: input.clinic_name,
    type: 'clinica',
    message
  });
}

export async function notifyClinicRegistration(input: {
  clinic_name: string;
  owner_name: string;
  email: string;
  phone: string;
  registrationId: string;
}): Promise<FormEmailResult> {
  const inbox = notifyInbox();
  const text = [
    'Nueva solicitud de alta de clínica',
    '',
    `Centro: ${input.clinic_name}`,
    `Responsable: ${input.owner_name}`,
    `Email: ${input.email}`,
    `Teléfono: ${input.phone}`,
    `ID solicitud: ${input.registrationId}`,
    '',
    'Revisar en panel: /platform/registros'
  ].join('\n');

  return sendMailBatch([
    {
      to: inbox,
      replyTo: input.email,
      subject: `[Dentista+] Nueva alta: ${input.clinic_name}`,
      text
    },
    {
      to: input.email,
      subject: 'Solicitud de alta recibida — Dentista+',
      text: `Hola ${input.owner_name},\n\nHemos recibido la solicitud de alta para «${input.clinic_name}». La revisaremos manualmente y te contactaremos en menos de 24 horas laborables con los siguientes pasos.\n\nReferencia: ${input.registrationId}\n\nUn saludo,\nEquipo Dentista+`
    }
  ]);
}

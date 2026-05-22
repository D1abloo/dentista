import { z } from 'zod';

export const clinicQuerySchema = z.object({
  clinicId: z.string().min(1).default('demo-clinic')
});

export const patientQuerySchema = clinicQuerySchema.extend({
  q: z.string().trim().max(120).default(''),
  dentistId: z.string().min(1).optional()
});

export const appointmentListQuerySchema = clinicQuerySchema.extend({
  dentistId: z.string().min(1).optional()
});

export const availabilityQuerySchema = clinicQuerySchema.extend({
  dentistId: z.string().min(1).optional(),
  treatmentId: z.string().min(1).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).default('2026-05-24')
});

export const loginSchema = z.object({
  role: z.enum(['patient', 'admin', 'super_admin', 'auto']).default('auto'),
  portal: z.enum(['patient', 'admin', 'platform']).optional(),
  email: z.string().email(),
  password: z.string().min(6).max(120)
});

export const clinicLogoSchema = z.object({
  logoDataUrl: z
    .string()
    .max(520_000)
    .optional()
    .refine((v) => !v || v.startsWith('data:image/'), { message: 'Formato de imagen no válido.' }),
  clear: z.boolean().optional()
});

export const contactFormSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  clinic: z.string().max(120).optional(),
  type: z.enum(['paciente', 'clinica', 'facturacion', 'tecnico', 'otro']),
  message: z.string().min(10).max(4000),
  accept_terms: z.literal(true, {
    errorMap: () => ({ message: 'Debes aceptar la política de privacidad.' })
  })
});

export const proAccessFormSchema = z.object({
  clinic_name: z.string().min(2, 'Indica el nombre de la clínica.').max(120),
  contact_name: z.string().min(2, 'Indica tu nombre.').max(120),
  email: z.string().email('Email no válido.'),
  phone: z.string().min(6, 'Indica un teléfono de contacto.').max(40),
  branches: z.coerce.number().int().min(1, 'Indica al menos 1 sede.').max(500),
  plan: z.enum(['pro_clinica', 'pro_multi']),
  message: z.string().min(10, 'El mensaje debe tener al menos 10 caracteres.').max(4000),
  accept_terms: z.literal(true, {
    errorMap: () => ({ message: 'Debes aceptar la política de privacidad.' })
  })
});

export const clinicRegistrationSchema = z.object({
  clinic_name: z.string().min(2).max(120),
  owner_name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().min(6).max(40),
  address: z.string().max(200).optional(),
  city: z.string().max(80).optional(),
  message: z.string().max(2000).optional()
});

export const patientRegistrationSchema = z
  .object({
    full_name: z.string().min(2, 'Indica tu nombre completo.').max(120),
    email: z.string().email('Email no válido.'),
    phone: z
      .string()
      .min(9, 'Teléfono obligatorio (mín. 9 dígitos).')
      .max(20)
      .regex(/^[\d\s+()-]+$/, 'Formato de teléfono no válido.'),
    dni: z
      .string()
      .min(8, 'DNI/NIE obligatorio.')
      .max(20)
      .regex(/^[0-9A-Za-z]+$/, 'Solo letras y números, sin espacios.'),
    birth_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha no válida.')
      .optional()
      .or(z.literal('')),
    clinic_id: z.string().uuid('Selecciona una clínica.'),
    password: z
      .string()
      .min(8, 'Mínimo 8 caracteres.')
      .max(120)
      .regex(/[A-Za-z]/, 'Incluye al menos una letra.')
      .regex(/\d/, 'Incluye al menos un número.'),
    password_confirm: z.string().min(8).max(120),
    accept_terms: z.literal(true, {
      errorMap: () => ({ message: 'Debes aceptar los términos de uso.' })
    }),
    accept_privacy: z.literal(true, {
      errorMap: () => ({ message: 'Debes aceptar la política de privacidad.' })
    })
  })
  .refine((d) => d.password === d.password_confirm, {
    message: 'Las contraseñas no coinciden.',
    path: ['password_confirm']
  });

export type PatientRegistrationInput = z.infer<typeof patientRegistrationSchema>;

export const patientActivateSchema = z.object({
  token: z.string().min(16).max(256)
});

export const registrationReviewSchema = z.object({
  id: z.string().uuid(),
  decision: z.enum(['approved', 'rejected']),
  review_notes: z.string().max(500).optional()
});

export const clinicStatusSchema = z.object({
  clinicId: z.string().uuid(),
  status: z.enum(['pending', 'active', 'suspended', 'rejected'])
});

export const clinicPlanSchema = z.object({
  clinicId: z.string().uuid(),
  plan: z.enum(['essential', 'professional', 'enterprise'])
});

export const platformUsersQuerySchema = z.object({
  clinicId: z.string().uuid().optional()
});

export const platformSettingsPatchSchema = z.object({
  key: z.enum(['branding', 'registration']),
  value: z.record(z.unknown())
});

export const branchCreateSchema = z.object({
  name: z.string().min(2).max(120),
  address: z.string().max(200).optional(),
  city: z.string().max(80).optional(),
  phone: z.string().min(6).max(40).optional(),
  email: z.string().email().optional(),
  isMainBranch: z.boolean().optional()
});

export const branchPatchSchema = z.object({
  clinicId: z.string().uuid(),
  name: z.string().min(2).max(120).optional(),
  address: z.string().max(200).optional(),
  city: z.string().max(80).optional(),
  phone: z.string().min(6).max(40).optional(),
  email: z.string().email().optional(),
  isMainBranch: z.boolean().optional(),
  status: z.enum(['pending', 'active', 'suspended', 'rejected']).optional()
});

export const organizationCreateSchema = z.object({
  organizationName: z.string().min(2).max(120),
  ownerName: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().min(6).max(40),
  address: z.string().max(200).optional(),
  branches: z
    .array(
      z.object({
        name: z.string().min(2).max(120),
        address: z.string().max(200).optional(),
        city: z.string().max(80).optional(),
        phone: z.string().min(6).max(40).optional(),
        email: z.string().email().optional()
      })
    )
    .min(1)
    .max(20),
  createAdmin: z.boolean().optional(),
  adminPassword: z.string().min(6).max(120).optional()
});

export const platformBranchCreateSchema = branchCreateSchema.extend({
  tenantId: z.string().uuid()
});

export const supportStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed'])
});

export const appointmentSchema = z.object({
  clinicId: z.string().min(1).default('demo-clinic'),
  patientId: z.string().min(1),
  patientName: z.string().min(2),
  patientEmail: z.string().email().optional(),
  patientPhone: z.string().min(6).max(40).optional(),
  dentistId: z.string().min(1),
  treatmentId: z.string().min(1),
  roomName: z.string().min(1).default('Gabinete 1'),
  startsAt: z.string().datetime({ offset: true }),
  notes: z.string().max(1000).optional()
});

export const appointmentActionSchema = z.object({
  clinicId: z.string().min(1).default('demo-clinic'),
  appointmentId: z.string().min(1),
  action: z.enum(['confirm', 'complete', 'cancel', 'no_show', 'reschedule']),
  startsAt: z.string().datetime({ offset: true }).optional(),
  roomName: z.string().min(1).optional(),
  notes: z.string().max(1000).optional()
}).superRefine((value, ctx) => {
  if (value.action === 'reschedule' && !value.startsAt) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['startsAt'],
      message: 'La nueva fecha es obligatoria para reprogramar.'
    });
  }
});

export const reminderSchema = z.object({
  clinicId: z.string().min(1).default('demo-clinic'),
  channel: z.enum(['whatsapp', 'email', 'sms']),
  appointmentIds: z.array(z.string().min(1)).min(1),
  template: z.string().min(3).max(500)
});

export const appointmentNotificationSchema = z.object({
  channels: z.array(z.enum(['whatsapp', 'email', 'sms'])).min(1),
  patientId: z.string().min(1),
  appointmentId: z.string().min(1),
  patientName: z.string().min(2),
  patientEmail: z.string().email().optional(),
  patientPhone: z.string().min(6).max(40).optional(),
  treatmentName: z.string().min(2),
  dentistName: z.string().min(2),
  clinicName: z.string().min(2),
  cabinetName: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/)
}).superRefine((value, ctx) => {
  if (value.channels.includes('email') && !value.patientEmail) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['patientEmail'],
      message: 'El correo es obligatorio para enviar confirmación por email.'
    });
  }
  if ((value.channels.includes('whatsapp') || value.channels.includes('sms')) && !value.patientPhone) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['patientPhone'],
      message: 'El teléfono es obligatorio para enviar confirmación por WhatsApp o SMS.'
    });
  }
});

export const reportCreateSchema = z.object({
  clinicId: z.string().uuid(),
  patientId: z.string().uuid(),
  appointmentId: z.string().uuid().optional(),
  title: z.string().min(2).max(160),
  description: z.string().min(3).max(8000),
  diagnosis: z.string().max(5000).optional(),
  recommendations: z.string().max(5000).optional(),
  fileName: z.string().max(255).optional(),
  fileRef: z.string().max(20000).optional(),
  mimeType: z.string().max(120).optional(),
  uploadedBy: z.string().min(2).max(120).default('Admin clínica'),
  visibleToPatient: z.boolean().default(true)
});

export const reportVisibilitySchema = z.object({
  clinicId: z.string().uuid(),
  id: z.string().uuid(),
  visibleToPatient: z.boolean()
});

export const documentCreateSchema = z.object({
  clinicId: z.string().uuid(),
  patientId: z.string().uuid(),
  appointmentId: z.string().uuid().optional(),
  type: z.enum(['informe', 'factura', 'recibo', 'consentimiento', 'radiografia', 'otro']),
  title: z.string().min(2).max(160),
  description: z.string().max(4000).optional(),
  fileName: z.string().max(255).optional(),
  fileRef: z.string().max(20000).optional(),
  mimeType: z.string().max(120).optional(),
  visibility: z.enum(['paciente', 'admin'])
});

export const messageCreateSchema = z.object({
  clinicId: z.string().uuid(),
  patientId: z.string().uuid(),
  subject: z.string().min(2).max(160),
  body: z.string().min(2).max(8000),
  channel: z.enum(['app', 'email', 'whatsapp', 'sms']).default('app'),
  type: z.enum(['recordatorio', 'confirmacion', 'clinica', 'general']).default('clinica')
});

export const consentCreateSchema = z.object({
  clinicId: z.string().uuid(),
  patientId: z.string().uuid(),
  appointmentId: z.string().uuid().optional(),
  treatmentName: z.string().min(2).max(160),
  title: z.string().min(2).max(180),
  body: z.string().min(10).max(12000),
  requiredForPortal: z.boolean().default(true),
  fileRef: z.string().max(20000).optional(),
  fileName: z.string().max(255).optional()
});

export const consentSignSchema = z.object({
  clinicId: z.string().uuid(),
  consentId: z.string().uuid(),
  signatureRef: z.string().min(10),
  fileRef: z.string().max(20000).optional(),
  fileName: z.string().max(255).optional()
});

export const stripeCheckoutSchema = z.object({
  clinicId: z.string().uuid(),
  patientId: z.string().uuid(),
  invoiceId: z.string().uuid().optional(),
  amount: z.number().positive(),
  concept: z.string().min(2).max(200),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional()
});

export const portalAccessTokenCreateSchema = z
  .object({
    patientId: z.string().uuid(),
    staffProfileId: z.string().uuid().optional(),
    dentistId: z.string().uuid().optional(),
    targetClinicId: z.string().uuid().optional(),
    label: z.string().max(120).optional(),
    expiresInHours: z.number().int().min(1).max(168).default(24)
  })
  .refine((d) => Boolean(d.staffProfileId || d.dentistId), {
    message: 'Indica el profesional (perfil o dentista).'
  });

export const portalAccessTokenRevokeSchema = z.object({
  tokenId: z.string().uuid()
});

export const portalAccessExchangeSchema = z.object({
  token: z.string().min(16).max(200)
});

export const clinicUserCreateSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(6).max(120).optional(),
    fullName: z.string().min(2).max(120),
    accessType: z.enum(['clinic', 'patient']),
    role: z.enum(['clinic_admin', 'admin', 'owner', 'dentist', 'receptionist', 'patient']),
    clinicId: z.string().uuid().optional(),
    permission: z.enum(['read', 'write', 'execute']).default('write'),
    specialty: z.string().max(80).optional(),
    sendEmail: z.boolean().default(true)
  })
  .refine((d) => (d.accessType === 'patient' ? d.role === 'patient' : d.role !== 'patient'), {
    message: 'El tipo de acceso no coincide con el rol.'
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(120),
    confirmPassword: z.string().min(8).max(120)
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword']
  });

export const portalAccessAuditSchema = z.object({
  eventType: z.enum(['nav_click', 'view_report', 'view_document', 'view_invoice', 'view_consent', 'other']),
  pagePath: z.string().max(300).optional(),
  resourceLabel: z.string().max(200).optional(),
  resourceId: z.string().max(120).optional()
});

export type ClinicQuery = z.infer<typeof clinicQuerySchema>;
export type PatientQuery = z.infer<typeof patientQuerySchema>;
export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type AppointmentInput = z.infer<typeof appointmentSchema>;
export type AppointmentActionInput = z.infer<typeof appointmentActionSchema>;
export type ReminderInput = z.infer<typeof reminderSchema>;
export type AppointmentNotificationInput = z.infer<typeof appointmentNotificationSchema>;
export type ReportCreateInput = z.infer<typeof reportCreateSchema>;
export type ReportVisibilityInput = z.infer<typeof reportVisibilitySchema>;
export type DocumentCreateInput = z.infer<typeof documentCreateSchema>;
export type MessageCreateInput = z.infer<typeof messageCreateSchema>;
export type ConsentCreateInput = z.infer<typeof consentCreateSchema>;
export type ConsentSignInput = z.infer<typeof consentSignSchema>;
export type StripeCheckoutInput = z.infer<typeof stripeCheckoutSchema>;

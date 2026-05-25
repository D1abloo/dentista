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
  password: z.string().min(6).max(120),
  remember: z.boolean().optional()
});

export const selectPortalSchema = z.object({
  portal: z.enum(['patient', 'admin', 'platform'])
});

export const switchClinicSchema = z.object({
  clinicId: z.string().uuid('Centro clínico no válido.')
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

/** Alta de paciente por personal de clínica (recepción / admin). */
export const adminPatientCreateSchema = z.object({
  full_name: z.string().min(2, 'Indica el nombre completo.').max(120),
  email: z.string().email('Email no válido.'),
  phone: z
    .string()
    .min(9, 'Teléfono obligatorio.')
    .max(20)
    .regex(/^[\d\s+()-]+$/, 'Formato de teléfono no válido.'),
  dni: z
    .string()
    .max(20)
    .optional()
    .or(z.literal('')),
  birth_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal('')),
  clinic_id: z.string().uuid().optional(),
  send_activation_email: z.boolean().default(true)
});

export type AdminPatientCreateInput = z.infer<typeof adminPatientCreateSchema>;

export const patientActivateSchema = z.object({
  token: z.string().min(16).max(256)
});

export const registrationReviewSchema = z.object({
  id: z.string().uuid(),
  decision: z.enum(['approved', 'rejected']),
  review_notes: z.string().max(500).optional()
});

export const registrationApproveSchema = z.object({
  action: z.literal('approve'),
  id: z.string().min(1),
  plan: z.enum(['essential', 'professional', 'enterprise'], { message: 'Selecciona un plan.' }),
  tenantSlug: z
    .string()
    .min(2, 'Introduce un slug de tenant válido.')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Introduce un slug de tenant válido.'),
  adminEmail: z.string().email('Introduce un email de administrador válido.'),
  createCredentials: z.boolean().optional(),
  welcomeEmail: z.boolean().optional(),
  isolation: z.boolean().optional(),
  subscription: z.boolean().optional()
});

export const registrationRejectSchema = z.object({
  action: z.literal('reject'),
  id: z.string().min(1),
  reason: z.string().min(1, 'El motivo del rechazo es obligatorio.'),
  notify: z.boolean().optional()
});

export const registrationRequestInfoSchema = z.object({
  action: z.literal('request_info'),
  id: z.string().min(1),
  message: z.string().max(500).optional()
});

export const registrationManualSchema = z.object({
  action: z.literal('manual_create'),
  clinicName: z.string().min(2),
  ownerName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  city: z.string().min(2),
  plan: z.string().min(2)
});

export const registrationActionSchema = z.discriminatedUnion('action', [
  registrationApproveSchema,
  registrationRejectSchema,
  registrationRequestInfoSchema,
  registrationManualSchema
]);

const planEnum = z.enum(['essential', 'professional', 'enterprise'], { message: 'Selecciona un plan.' });

export const subscriptionActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('create'),
    clinicId: z.string().min(1, 'Selecciona una clínica.'),
    plan: planEnum,
    seats: z.number().int().min(1, 'El número de asientos debe ser mayor que 0.'),
    billingEmail: z.string().email('Introduce un email de facturación válido.')
  }),
  z.object({ action: z.literal('update_plan'), id: z.string().min(1), plan: planEnum }),
  z.object({
    action: z.literal('update_seats'),
    id: z.string().min(1),
    seats: z.number().int().min(1, 'El número de asientos debe ser mayor que 0.')
  }),
  z.object({ action: z.literal('generate_invoice'), id: z.string().min(1) }),
  z.object({ action: z.literal('send_reminder'), id: z.string().min(1) }),
  z.object({ action: z.literal('suspend'), id: z.string().min(1) }),
  z.object({
    action: z.literal('update_billing'),
    id: z.string().min(1),
    billingEmail: z.string().email('Introduce un email de facturación válido.'),
    taxId: z.string().max(20).optional()
  })
]);

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

const platformSettingsConfigSchema = z.object({
  branding: z.object({
    appName: z.string().min(1, 'El nombre de la app es obligatorio.'),
    supportEmail: z.string().email('Introduce un email de soporte válido.'),
    publicUrl: z.string().url('Introduce una URL válida.'),
    footerLegal: z.string().max(500),
    primaryColor: z.string().min(4),
    secondaryColor: z.string().min(4),
    logoMain: z.string().nullable().optional(),
    logoCompact: z.string().nullable().optional(),
    favicon: z.string().nullable().optional()
  }),
  registration: z.object({
    autoApprove: z.boolean(),
    requireEmailVerification: z.boolean(),
    requireTaxData: z.boolean(),
    requirePhone: z.boolean(),
    requireTerms: z.boolean(),
    autoTenantOnApprove: z.boolean(),
    sendAdminCredentials: z.boolean(),
    defaultIsolation: z.boolean(),
    manualReviewProMulti: z.boolean(),
    defaultPlan: z.string().min(1),
    initialSeats: z.number().int().min(1, 'El límite de asientos debe ser mayor que 0.')
  }),
  security: z.object({
    require2fa: z.boolean(),
    strongPassword: z.boolean(),
    blockFailedAttempts: z.boolean(),
    auditSensitive: z.boolean(),
    sessionExpiryMinutes: z.number().int().min(5).max(480),
    maxFailedAttempts: z.number().int().min(1).max(20)
  }),
  emails: z.object({
    fromEmail: z.string().email('Introduce un email de soporte válido.'),
    fromName: z.string().min(1),
    templates: z.record(z.string())
  }),
  limits: z.object({
    initialSeats: z.number().int().min(1),
    maxFileSizeMb: z.number().int().min(1, 'El tamaño máximo de archivo debe ser válido.'),
    logRetentionDays: z.number().int().min(7),
    maxOpenTickets: z.number().int().min(1),
    clinicsPerOrg: z.number().int().min(1),
    docsPerClinic: z.number().int().min(100)
  }),
  integrations: z.object({
    stripeEnabled: z.boolean(),
    redisCache: z.boolean(),
    webhooksEnabled: z.boolean()
  }),
  advanced: z.object({
    maintenanceMode: z.boolean(),
    debugRequests: z.boolean()
  })
});

export const platformSettingsActionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('save'), config: platformSettingsConfigSchema }),
  z.object({ action: z.literal('reset') }),
  z.object({
    action: z.literal('test_email'),
    to: z.string().email().optional()
  })
]);

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

const ticketPriorityEnum = z.enum(['low', 'normal', 'high', 'urgent'], { message: 'Selecciona una prioridad.' });
const ticketStatusEnum = z.enum(['open', 'pending', 'in_progress', 'resolved', 'closed']);
const ticketTypeEnum = z.enum(['patient', 'clinic', 'staff', 'system', 'billing']);

export const supportActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('create'),
    subject: z.string().min(1, 'Introduce un asunto.'),
    message: z.string().min(1, 'Introduce un mensaje.'),
    priority: ticketPriorityEnum,
    type: ticketTypeEnum,
    requesterName: z.string().min(1, 'Introduce un nombre.'),
    requesterEmail: z.string().email('Introduce un email válido.'),
    clinicId: z.string().optional()
  }),
  z.object({
    action: z.literal('assign'),
    id: z.string().min(1),
    assigneeId: z.string().min(1, 'Selecciona un responsable.')
  }),
  z.object({
    action: z.literal('assign_bulk'),
    assigneeId: z.string().min(1, 'Selecciona un responsable.')
  }),
  z.object({
    action: z.literal('update_status'),
    id: z.string().min(1),
    status: ticketStatusEnum
  }),
  z.object({
    action: z.literal('update_priority'),
    id: z.string().min(1),
    priority: ticketPriorityEnum
  }),
  z.object({
    action: z.literal('link_clinic'),
    id: z.string().min(1),
    clinicId: z.string().min(1, 'Selecciona una clínica.')
  }),
  z.object({
    action: z.literal('reply'),
    id: z.string().min(1),
    message: z.string().min(1, 'Introduce un mensaje.'),
    template: z.string().optional(),
    sendCopy: z.boolean().optional()
  }),
  z.object({ action: z.literal('close'), id: z.string().min(1) }),
  z.object({
    action: z.literal('update_sla'),
    responseHours: z.number().int().min(1).max(168),
    urgentHours: z.number().int().min(1).max(48)
  })
]);

export const metricsActionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('refresh') }),
  z.object({
    action: z.literal('update_retention'),
    retentionDays: z.number().int().min(7, 'Mínimo 7 días.').max(365, 'Máximo 365 días.')
  })
]);

export const securityActionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('run_review') }),
  z.object({ action: z.literal('revoke_session'), sessionId: z.string().min(1) }),
  z.object({
    action: z.literal('update_policies'),
    policies: z.object({
      require2fa: z.boolean(),
      strongPassword: z.boolean(),
      blockFailedAttempts: z.boolean(),
      auditSensitive: z.boolean(),
      sessionExpiryMinutes: z.number().int().min(5).max(480),
      maxFailedAttempts: z.number().int().min(1).max(20)
    })
  }),
  z.object({ action: z.literal('run_policy_test'), policyId: z.string().min(1) })
]);

export const clientAuditLogSchema = z.object({
  event_type: z.string().min(3).max(120),
  module: z.string().min(2).max(80),
  action: z.string().min(2).max(200),
  severity: z.enum(['info', 'low', 'medium', 'high', 'critical']).optional(),
  result: z.enum(['ok', 'blocked', 'error', 'denied']).optional(),
  message: z.string().max(500).optional(),
  resource_type: z.string().max(80).optional(),
  resource_id: z.string().max(80).optional(),
  route: z.string().max(300).optional(),
  metadata: z.record(z.unknown()).optional()
});

export const auditActionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('refresh') }),
  z.object({ action: z.literal('mark_reviewed'), id: z.string().min(1) }),
  z.object({ action: z.literal('escalate'), id: z.string().min(1) }),
  z.object({
    action: z.literal('update_retention'),
    retentionDays: z.number().int().min(30).max(365)
  }),
  z.object({ action: z.literal('log_export'), format: z.enum(['csv', 'pdf']).optional() })
]);

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
  diagnosis: z.string().min(3).max(5000),
  recommendations: z.string().min(3).max(5000),
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

export const reportUpdateSchema = reportCreateSchema.extend({
  id: z.string().uuid()
});

export const dentistProfileUpdateSchema = z.object({
  clinicId: z.string().uuid(),
  dentistId: z.string().uuid(),
  fullName: z.string().min(2).max(120),
  specialty: z.string().min(2).max(80),
  collegiateNumber: z.string().min(3).max(40),
  email: z.string().email().max(160).optional().or(z.literal('')),
  phone: z.string().max(40).optional().or(z.literal(''))
});

export const clinicalProfessionalBodySchema = z.object({
  clinicId: z.string().uuid(),
  dentistId: z.string().uuid().optional(),
  fullName: z.string().min(2).max(120),
  visibleTitle: z.string().max(80).optional(),
  collegiateNumber: z.string().max(40).optional(),
  professionalCollege: z.string().max(120).optional(),
  specialty: z.string().min(2).max(80),
  secondarySpecialties: z.array(z.string().max(80)).optional(),
  languages: z.array(z.string().max(40)).optional(),
  email: z.string().max(160).optional(),
  phone: z.string().max(40).optional(),
  reportBio: z.string().max(4000).optional(),
  agendaColor: z.string().max(20).optional(),
  active: z.boolean(),
  photoRef: z.string().max(50000).optional(),
  signatureRef: z.string().max(50000).optional(),
  photoName: z.string().max(255).optional(),
  signatureName: z.string().max(255).optional(),
  profileId: z.string().uuid().optional()
});

export const linkProfessionalUserSchema = z.object({
  clinicId: z.string().uuid(),
  dentistId: z.string().uuid(),
  profileId: z.string().uuid()
});

export const unlinkProfessionalUserSchema = z.object({
  clinicId: z.string().uuid(),
  dentistId: z.string().uuid()
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
  type: z
    .enum(['recordatorio', 'confirmacion', 'clinica', 'general', 'factura', 'documento'])
    .default('clinica'),
  fromPatient: z.boolean().optional()
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

const scheduleTimeSchema = z
  .string()
  .regex(/^\d{1,2}:\d{2}$/)
  .transform((t) => {
    const [h, m] = t.split(':');
    return `${String(Number(h)).padStart(2, '0')}:${m}`;
  });

export const scheduleBlockCreateSchema = z.object({
  clinicId: z.string().min(1).optional(),
  dentistId: z.string().min(1),
  dentistIds: z.array(z.string().min(1)).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: scheduleTimeSchema,
  endTime: scheduleTimeSchema.optional(),
  reason: z.string().min(1).max(200),
  durationMinutes: z.coerce.number().int().min(15).max(480).default(60),
  blockGroupId: z.string().min(4).max(80).optional(),
  notes: z.string().max(500).optional()
});

export const treatmentCreateSchema = z.object({
  clinicId: z.string().uuid().optional(),
  name: z.string().min(2).max(120),
  description: z.string().max(500).optional().default(''),
  durationMinutes: z.coerce.number().int().min(15).max(480).default(45),
  /** Precio en euros (se guarda como céntimos en BD). */
  price: z.coerce.number().min(0).max(999_999),
  active: z.boolean().default(true)
});

export const scheduleBlockBulkUnblockSchema = z
  .object({
    clinicId: z.string().uuid().optional(),
    fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    /** all = todo el periodo en la sede; dentist = solo el profesional indicado */
    scope: z.enum(['all', 'dentist']),
    dentistId: z.string().uuid().optional()
  })
  .refine((d) => d.toDate >= d.fromDate, { message: 'La fecha final debe ser posterior a la inicial.' })
  .refine((d) => d.scope !== 'dentist' || d.dentistId, {
    message: 'Indica el profesional para desbloquear su agenda.',
    path: ['dentistId']
  });

export const scheduleBlockDeleteSchema = z
  .object({
    clinicId: z.string().min(1).optional(),
    id: z.string().min(1).max(120).optional(),
    blockGroupId: z.string().min(4).max(80).optional(),
    /** UUIDs separados por coma (desbloqueo de grupos sin block_group_id en BD). */
    ids: z.string().min(1).max(4000).optional()
  })
  .refine((d) => Boolean(d.id || d.blockGroupId || d.ids), {
    message: 'Indica id, blockGroupId o ids.'
  });

export const clinicUserCreateSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(6).max(120).optional(),
    fullName: z.string().min(2).max(120),
    accessType: z.literal('clinic').default('clinic'),
    role: z.enum(['clinic_admin', 'admin', 'owner', 'dentist', 'receptionist']),
    clinicId: z.string().uuid().optional(),
    permission: z.enum(['read', 'write', 'execute']).default('write'),
    specialty: z.string().max(80).optional(),
    collegiateNumber: z.string().max(40).optional(),
    sendEmail: z.boolean().default(true)
  })
  .superRefine((data, ctx) => {
    if (data.role === 'dentist' && (!data.collegiateNumber?.trim() || data.collegiateNumber.trim().length < 3)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El número de colegiado es obligatorio para dentistas.',
        path: ['collegiateNumber']
      });
    }
  });

export const staffClinicAccessGrantSchema = z
  .object({
    authUserId: z.string().uuid(),
    clinicId: z.string().uuid(),
    role: z.enum(['clinic_admin', 'admin', 'owner', 'dentist', 'receptionist']),
    specialty: z.string().max(80).optional(),
    collegiateNumber: z.string().max(40).optional()
  })
  .superRefine((data, ctx) => {
    if (data.role === 'dentist' && (!data.collegiateNumber?.trim() || data.collegiateNumber.trim().length < 3)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Nº de colegiado obligatorio para dentistas.',
        path: ['collegiateNumber']
      });
    }
  });

export const staffClinicAccessRevokeSchema = z.object({
  profileId: z.string().uuid()
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
export type ReportUpdateInput = z.infer<typeof reportUpdateSchema>;
export type DentistProfileUpdateInput = z.infer<typeof dentistProfileUpdateSchema>;
export type DocumentCreateInput = z.infer<typeof documentCreateSchema>;
export type MessageCreateInput = z.infer<typeof messageCreateSchema>;
export type ConsentCreateInput = z.infer<typeof consentCreateSchema>;
export type ConsentSignInput = z.infer<typeof consentSignSchema>;
export type StripeCheckoutInput = z.infer<typeof stripeCheckoutSchema>;

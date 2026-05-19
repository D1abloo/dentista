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
  role: z.enum(['patient', 'admin', 'super_admin']),
  email: z.string().email(),
  password: z.string().min(6).max(120)
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

export type ClinicQuery = z.infer<typeof clinicQuerySchema>;
export type PatientQuery = z.infer<typeof patientQuerySchema>;
export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type AppointmentInput = z.infer<typeof appointmentSchema>;
export type AppointmentActionInput = z.infer<typeof appointmentActionSchema>;
export type ReminderInput = z.infer<typeof reminderSchema>;
export type AppointmentNotificationInput = z.infer<typeof appointmentNotificationSchema>;

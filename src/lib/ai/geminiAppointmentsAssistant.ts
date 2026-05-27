import { GoogleGenerativeAI, SchemaType, type ResponseSchema } from '@google/generative-ai'
import { z } from 'zod'
import { logError } from '@/lib/logger'
import { hasGeminiConfig } from '@/lib/ai/geminiBookingAssistant'

export const geminiAppointmentsIntentSchema = z.object({
  intent: z
    .enum([
      'book_appointment',
      'review_appointments',
      'next_appointment',
      'reschedule_appointment',
      'cancel_appointment',
      'appointment_status',
      'check_appointments',
      'contact_clinic',
      'urgency_warning',
      'unknown'
    ])
    .default('unknown'),
  action: z.string().nullable().optional(),
  treatment: z.string().nullable().optional(),
  urgency: z.enum(['low', 'normal', 'high']).default('normal'),
  clinic_preference: z.string().nullable().optional(),
  professional_preference: z.string().nullable().optional(),
  date_preference: z.string().nullable().optional(),
  time_preference: z.enum(['morning', 'afternoon', 'any']).nullable().optional(),
  patient_name: z.string().nullable().optional(),
  patient_email: z.string().nullable().optional(),
  patient_phone: z.string().nullable().optional(),
  patient_dni: z.string().nullable().optional(),
  reason: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  appointment_reference: z.string().nullable().optional(),
  requires_identity_verification: z.boolean().default(false),
  missing_fields: z.array(z.string()).default([]),
  assistant_message: z.string().min(1),
  should_fetch_availability: z.boolean().default(false),
  severe_symptoms: z.boolean().default(false)
})

export type GeminiAppointmentsIntent = z.infer<typeof geminiAppointmentsIntentSchema>

const SYSTEM_INSTRUCTION = `You are the AgendaClinic appointment assistant for patients on the public website. Speak only in Spanish.

You help users:
- book new appointments (book_appointment)
- review their appointments (review_appointments)
- see next appointment (next_appointment)
- reschedule (reschedule_appointment)
- cancel (cancel_appointment)
- understand appointment status (appointment_status)
- check appointments with email/DNI/NHC (check_appointments) — ask for one identifier only
- contact the clinic (contact_clinic)

Never invent appointment availability or existing appointments. Never show private data without verification.
For review_appointments, next_appointment, cancel_appointment, reschedule_appointment, appointment_status: set requires_identity_verification=true until patient is verified.

Return JSON only with all fields. Supported intents listed above.

missing_fields examples: treatment, clinic_preference, professional_preference, date_preference, time_preference, patient_name, patient_email, patient_phone, patient_identity, appointment_selection.

should_fetch_availability=true only for booking/reschedule when enough booking fields are known.`

const RESPONSE_SCHEMA: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    intent: { type: SchemaType.STRING },
    action: { type: SchemaType.STRING, nullable: true },
    treatment: { type: SchemaType.STRING, nullable: true },
    urgency: { type: SchemaType.STRING },
    clinic_preference: { type: SchemaType.STRING, nullable: true },
    professional_preference: { type: SchemaType.STRING, nullable: true },
    date_preference: { type: SchemaType.STRING, nullable: true },
    time_preference: { type: SchemaType.STRING, nullable: true },
    patient_name: { type: SchemaType.STRING, nullable: true },
    patient_email: { type: SchemaType.STRING, nullable: true },
    patient_phone: { type: SchemaType.STRING, nullable: true },
    patient_dni: { type: SchemaType.STRING, nullable: true },
    reason: { type: SchemaType.STRING, nullable: true },
    notes: { type: SchemaType.STRING, nullable: true },
    appointment_reference: { type: SchemaType.STRING, nullable: true },
    requires_identity_verification: { type: SchemaType.BOOLEAN },
    missing_fields: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    assistant_message: { type: SchemaType.STRING },
    should_fetch_availability: { type: SchemaType.BOOLEAN },
    severe_symptoms: { type: SchemaType.BOOLEAN }
  },
  required: [
    'intent',
    'assistant_message',
    'missing_fields',
    'requires_identity_verification',
    'should_fetch_availability',
    'severe_symptoms'
  ]
}

function env(key: string) {
  return String((import.meta.env as Record<string, string | undefined>)[key] ?? '').trim()
}

function getModelName() {
  return env('GEMINI_MODEL') || 'gemini-1.5-pro'
}

function fallbackIntent(message: string): GeminiAppointmentsIntent {
  const lower = message.toLowerCase()

  if (/ver mis citas|mis citas|revisar citas/.test(lower)) {
    return {
      intent: 'review_appointments',
      action: 'list',
      treatment: null,
      urgency: 'normal',
      clinic_preference: null,
      professional_preference: null,
      date_preference: null,
      time_preference: null,
      patient_name: null,
      patient_email: null,
      patient_phone: null,
      requires_identity_verification: true,
      missing_fields: ['patient_identity'],
      assistant_message:
        'Para proteger tus datos, necesito identificarte antes de mostrar tus citas.',
      should_fetch_availability: false,
      severe_symptoms: false
    }
  }

  if (/próxima cita|proxima cita|cuándo tengo|cuando tengo/.test(lower)) {
    return {
      intent: 'next_appointment',
      action: 'next',
      treatment: null,
      urgency: 'normal',
      clinic_preference: null,
      professional_preference: null,
      date_preference: null,
      time_preference: null,
      patient_name: null,
      patient_email: null,
      patient_phone: null,
      requires_identity_verification: true,
      missing_fields: ['patient_identity'],
      assistant_message:
        'Para proteger tus datos, necesito identificarte antes de mostrar tu próxima cita.',
      should_fetch_availability: false,
      severe_symptoms: false
    }
  }

  if (/cancelar|anular|no puedo asistir/.test(lower)) {
    return {
      intent: 'cancel_appointment',
      action: 'cancel',
      treatment: null,
      urgency: 'normal',
      clinic_preference: null,
      professional_preference: null,
      date_preference: null,
      time_preference: null,
      patient_name: null,
      patient_email: null,
      patient_phone: null,
      requires_identity_verification: true,
      missing_fields: ['patient_identity', 'appointment_selection'],
      assistant_message: 'Para cancelar una cita, primero identifícate y selecciona la cita.',
      should_fetch_availability: false,
      severe_symptoms: false
    }
  }

  if (/cambiar|mover|reprogramar|no puedo ir/.test(lower)) {
    return {
      intent: 'reschedule_appointment',
      action: 'reschedule',
      treatment: null,
      urgency: 'normal',
      clinic_preference: null,
      professional_preference: null,
      date_preference: null,
      time_preference: null,
      patient_name: null,
      patient_email: null,
      patient_phone: null,
      requires_identity_verification: true,
      missing_fields: ['patient_identity', 'appointment_selection'],
      assistant_message: 'Selecciona la cita que quieres cambiar después de identificarte.',
      should_fetch_availability: false,
      severe_symptoms: false
    }
  }

  if (/contactar|hablar con|teléfono de la clínica|telefono/.test(lower)) {
    return {
      intent: 'contact_clinic',
      action: 'contact',
      treatment: null,
      urgency: 'normal',
      clinic_preference: null,
      professional_preference: null,
      date_preference: null,
      time_preference: null,
      patient_name: null,
      patient_email: null,
      patient_phone: null,
      requires_identity_verification: false,
      missing_fields: [],
      assistant_message: 'Puedes contactar con la clínica desde la página de contacto o por teléfono.',
      should_fetch_availability: false,
      severe_symptoms: false
    }
  }

  const treatment = /limpieza/.test(lower)
    ? 'limpieza dental'
    : /revisión|revision/.test(lower)
      ? 'revisión'
      : /dolor|muela/.test(lower)
        ? 'dolor dental'
        : null
  const date = /mañana/.test(lower) ? 'mañana' : /esta semana/.test(lower) ? 'esta semana' : null

  return {
    intent: 'book_appointment',
    action: 'book',
    treatment,
    urgency: /dolor/.test(lower) ? 'high' : 'normal',
    clinic_preference: null,
    professional_preference: null,
    date_preference: date,
    time_preference: /tarde/.test(lower) ? 'afternoon' : 'any',
    patient_name: null,
    patient_email: null,
    patient_phone: null,
    requires_identity_verification: false,
    missing_fields: treatment ? (date ? [] : ['date_preference']) : ['treatment'],
    assistant_message: treatment
      ? date
        ? 'Buscaré huecos disponibles. ¿Alguna preferencia de profesional?'
        : '¿Qué día te viene mejor?'
      : '¿Qué tratamiento o motivo de la cita necesitas?',
    should_fetch_availability: Boolean(treatment && date),
    severe_symptoms: false
  }
}

export async function interpretAppointmentsMessage(input: {
  message: string
  conversation: Array<{ role: 'user' | 'assistant'; text: string }>
  catalogSummary: string
  currentStateSummary: string
  identityVerified: boolean
}): Promise<GeminiAppointmentsIntent> {
  if (!hasGeminiConfig()) return fallbackIntent(input.message)

  try {
    const genAI = new GoogleGenerativeAI(env('GEMINI_API_KEY'))
    const model = genAI.getGenerativeModel({
      model: getModelName(),
      systemInstruction: SYSTEM_INSTRUCTION
    })

    const history = input.conversation.slice(-12).map((entry) => ({
      role: entry.role === 'assistant' ? ('model' as const) : ('user' as const),
      parts: [{ text: entry.text }]
    }))

    const prompt = [
      `Paciente verificado: ${input.identityVerified ? 'sí' : 'no'}`,
      'Catálogo:',
      input.catalogSummary,
      'Estado:',
      input.currentStateSummary,
      'Mensaje:',
      input.message
    ].join('\n')

    const result = await model.generateContent({
      contents: [...history, { role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.35,
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA
      }
    })

    const parsed = geminiAppointmentsIntentSchema.safeParse(JSON.parse(result.response.text()))
    if (!parsed.success) return fallbackIntent(input.message)
    if (input.identityVerified && parsed.data.requires_identity_verification) {
      return { ...parsed.data, requires_identity_verification: false }
    }
    return parsed.data
  } catch (error) {
    logError('gemini.appointments.call', error)
    return fallbackIntent(input.message)
  }
}

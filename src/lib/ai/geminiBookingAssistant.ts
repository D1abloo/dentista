import { GoogleGenerativeAI, SchemaType, type ResponseSchema } from '@google/generative-ai'
import { z } from 'zod'
import { logError } from '@/lib/logger'

export const geminiBookingIntentSchema = z.object({
  intent: z.enum(['book_appointment', 'general_question', 'urgency_warning']).default('book_appointment'),
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
  missing_fields: z.array(z.string()).default([]),
  assistant_message: z.string().min(1),
  should_fetch_availability: z.boolean().default(false),
  severe_symptoms: z.boolean().default(false)
})

export type GeminiBookingIntent = z.infer<typeof geminiBookingIntentSchema>

const SYSTEM_INSTRUCTION = `You are the AgendaClinic appointment booking assistant. Speak only in Spanish. Help users book clinic appointments. Ask one clear question at a time. Extract booking intent into structured JSON. Never invent appointment availability. Never confirm an appointment unless the backend provides a valid slot and the user confirms. Never ask for sensitive clinical history. If the user reports pain or urgency, suggest an urgent appointment type and recommend contacting the clinic if it seems serious.

If user describes severe symptoms (intense pain, swelling, fever, bleeding, trauma, difficulty breathing), set severe_symptoms=true and intent=urgency_warning with a safety message in Spanish.

Return JSON only with fields:
intent, treatment, urgency, clinic_preference, professional_preference, date_preference, time_preference, patient_name, patient_email, patient_phone, patient_dni, reason, notes, missing_fields, assistant_message, should_fetch_availability, severe_symptoms.

missing_fields should list what is still needed among: treatment, clinic_preference, professional_preference, date_preference, time_preference, patient_name, patient_email, patient_phone.

Set should_fetch_availability=true only when treatment, date_preference and clinic are known (or only one clinic exists) and professional preference is resolved or user accepts any professional.`

const RESPONSE_SCHEMA: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    intent: { type: SchemaType.STRING },
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
    missing_fields: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    assistant_message: { type: SchemaType.STRING },
    should_fetch_availability: { type: SchemaType.BOOLEAN },
    severe_symptoms: { type: SchemaType.BOOLEAN }
  },
  required: ['intent', 'assistant_message', 'missing_fields', 'should_fetch_availability', 'severe_symptoms']
}

function env(key: string) {
  return String((import.meta.env as Record<string, string | undefined>)[key] ?? '').trim()
}

export function hasGeminiConfig() {
  const key = env('GEMINI_API_KEY')
  return Boolean(key && !key.includes('YOUR_'))
}

function getModelName() {
  return env('GEMINI_MODEL') || 'gemini-1.5-pro'
}

function fallbackIntent(message: string): GeminiBookingIntent {
  const lower = message.toLowerCase()
  const severe =
    /fiebre|sangr|hinch|trauma|respir|urgencia grave|no puedo respirar/.test(lower)
  if (severe) {
    return {
      intent: 'urgency_warning',
      treatment: lower.includes('dolor') ? 'urgencia' : null,
      urgency: 'high',
      clinic_preference: null,
      professional_preference: null,
      date_preference: null,
      time_preference: null,
      patient_name: null,
      patient_email: null,
      patient_phone: null,
      missing_fields: ['treatment'],
      assistant_message:
        'Por seguridad, contacta directamente con la clínica o acude a urgencias si los síntomas son graves. También puedo ayudarte a buscar el primer hueco disponible. ¿Qué tratamiento necesitas?',
      should_fetch_availability: false,
      severe_symptoms: true
    }
  }

  const treatment = /limpieza/.test(lower)
    ? 'limpieza dental'
    : /revision|revisión/.test(lower)
      ? 'revisión'
      : /dolor|muela/.test(lower)
        ? 'dolor dental'
        : /ortodoncia/.test(lower)
          ? 'ortodoncia'
          : /blanqueamiento/.test(lower)
            ? 'blanqueamiento'
            : /urgencia/.test(lower)
              ? 'urgencia'
              : null

  const date = /mañana/.test(lower)
    ? 'mañana'
    : /hoy/.test(lower)
      ? 'hoy'
      : /esta semana/.test(lower)
        ? 'esta semana'
        : null
  const time = /tarde/.test(lower) ? 'afternoon' : /mañana/.test(lower) && !/mañana por/.test(lower) ? 'morning' : 'any'

  const missing: string[] = []
  if (!treatment) missing.push('treatment')
  if (!date) missing.push('date_preference')

  let assistant = 'Hola, dime qué necesitas y te ayudo a reservar.'
  if (treatment && date) {
    assistant =
      'Perfecto. Voy a buscar huecos disponibles para tu cita. ¿Tienes preferencia por algún profesional o te vale cualquiera disponible?'
  } else if (treatment) {
    assistant = 'Entendido. ¿Qué día o franja te viene mejor?'
  } else {
    assistant = '¿Qué tratamiento o motivo de la cita necesitas?'
  }

  return {
    intent: 'book_appointment',
    treatment,
    urgency: /dolor|urgencia|muela/.test(lower) ? 'high' : 'normal',
    clinic_preference: null,
    professional_preference: /dra|dr\.|doctor/.test(lower) ? message : null,
    date_preference: date,
    time_preference: time,
    patient_name: null,
    patient_email: null,
    patient_phone: null,
    missing_fields: missing,
    assistant_message: assistant,
    should_fetch_availability: Boolean(treatment && date),
    severe_symptoms: false
  }
}

export async function interpretBookingMessage(input: {
  message: string
  conversation: Array<{ role: 'user' | 'assistant'; text: string }>
  catalogSummary: string
  currentStateSummary: string
}): Promise<GeminiBookingIntent> {
  if (!hasGeminiConfig()) {
    return fallbackIntent(input.message)
  }

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
      'Contexto de catálogo (solo referencia, no inventes disponibilidad):',
      input.catalogSummary,
      '',
      'Estado actual de la reserva:',
      input.currentStateSummary,
      '',
      'Nuevo mensaje del usuario:',
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

    const raw = result.response.text()
    const parsed = geminiBookingIntentSchema.safeParse(JSON.parse(raw))
    if (!parsed.success) {
      logError('gemini.booking.parse', parsed.error.flatten())
      return fallbackIntent(input.message)
    }
    return parsed.data
  } catch (error) {
    logError('gemini.booking.call', error)
    return fallbackIntent(input.message)
  }
}

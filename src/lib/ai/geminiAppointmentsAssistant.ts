import { GoogleGenerativeAI, SchemaType, type ResponseSchema } from '@google/generative-ai'
import { z } from 'zod'
import { getLearningContextSummary, recordConversationTurn } from '@/lib/ai/conversationLearning'
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
  treatment_id: z.string().uuid().nullable().optional(),
  clinic_id: z.string().uuid().nullable().optional(),
  professional_id: z.string().uuid().nullable().optional(),
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
  severe_symptoms: z.boolean().default(false),
  user_message_summary: z.string().nullable().optional()
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

CRITICAL RULES:
- Never invent appointment availability or existing appointments.
- Never show private data without verification.
- Map free-text to the catalog: use treatment_id, clinic_id, professional_id when you can match an item from the JSON catalog.
- Understand synonyms and colloquial Spanish (ej. "limpieza" → Limpieza dental profesional, "blanquear" → Blanqueamiento LED, "me duele" → Urgencia dental).
- Learn from conversation history and session patterns to infer intent even with short or informal messages.
- When the user selects or mentions a catalog item, fill treatment_id/clinic_id/professional_id AND the human-readable name fields.
- For review_appointments, next_appointment, cancel_appointment, reschedule_appointment, appointment_status: set requires_identity_verification=true until patient is verified.
- assistant_message must guide the user and mention the next step; suggest tapping an option when missing_fields is not empty.
- user_message_summary: one short Spanish phrase summarizing what the user meant (for learning).

Return JSON only with all fields. Supported intents listed above.

missing_fields examples: treatment, clinic_preference, professional_preference, date_preference, time_preference, patient_name, patient_email, patient_phone, patient_identity, appointment_selection.

should_fetch_availability=true only for booking/reschedule when clinic_id, treatment_id and date_preference are known.`

const RESPONSE_SCHEMA: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    intent: { type: SchemaType.STRING },
    action: { type: SchemaType.STRING, nullable: true },
    treatment: { type: SchemaType.STRING, nullable: true },
    treatment_id: { type: SchemaType.STRING, nullable: true },
    clinic_id: { type: SchemaType.STRING, nullable: true },
    professional_id: { type: SchemaType.STRING, nullable: true },
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
    severe_symptoms: { type: SchemaType.BOOLEAN },
    user_message_summary: { type: SchemaType.STRING, nullable: true }
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
  return env('GEMINI_MODEL') || 'gemini-2.5-flash'
}

function normalize(text: string) {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

type CatalogTreatment = { id: string; name: string; clinic_id?: string }

function matchTreatmentFromCatalog(
  message: string,
  treatments: CatalogTreatment[]
): { name: string; id: string } | null {
  const lower = normalize(message)
  for (const t of treatments) {
    const name = normalize(t.name)
    if (lower.includes(name) || name.includes(lower)) return { name: t.name, id: t.id }
  }
  const synonyms: Array<{ re: RegExp; pick: (list: CatalogTreatment[]) => CatalogTreatment | undefined }> = [
    { re: /limpieza|higiene|sarro/, pick: (list) => list.find((t) => /limpieza/i.test(t.name)) },
    { re: /blanque|blanco|estetic/, pick: (list) => list.find((t) => /blanque/i.test(t.name)) },
    { re: /revision|revisar|control|chequeo/, pick: (list) => list.find((t) => /revisi/i.test(t.name)) },
    { re: /dolor|urgencia|muela|duele|emergencia/, pick: (list) => list.find((t) => /urgencia/i.test(t.name)) },
    { re: /cita de (.+)/, pick: (list) => {
      const m = lower.match(/cita de (.+)/)
      if (!m?.[1]) return undefined
      const q = normalize(m[1])
      return list.find((t) => normalize(t.name).includes(q) || q.includes(normalize(t.name)))
    }}
  ]
  for (const rule of synonyms) {
    if (!rule.re.test(lower)) continue
    const hit = rule.pick(treatments)
    if (hit) return { name: hit.name, id: hit.id }
  }
  return null
}

function fallbackIntent(
  message: string,
  catalog?: { treatments?: CatalogTreatment[] }
): GeminiAppointmentsIntent {
  const lower = message.toLowerCase()
  const treatments = catalog?.treatments ?? []
  const matched = matchTreatmentFromCatalog(message, treatments)

  const baseExtras = {
    treatment_id: matched?.id ?? null,
    clinic_id: null,
    professional_id: null,
    user_message_summary: message.slice(0, 80)
  }

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
        'Para proteger tus datos, necesito identificarte antes de mostrar tus citas. Puedes usar una de las opciones siguientes.',
      should_fetch_availability: false,
      severe_symptoms: false,
      ...baseExtras
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
      severe_symptoms: false,
      ...baseExtras
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
      severe_symptoms: false,
      ...baseExtras
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
      severe_symptoms: false,
      ...baseExtras
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
      severe_symptoms: false,
      ...baseExtras
    }
  }

  if (/cualquier profesional|me da igual el profesional|sin preferencia de profesional/.test(lower)) {
    return {
      intent: 'book_appointment',
      action: 'book',
      treatment: matched?.name ?? null,
      treatment_id: matched?.id ?? null,
      clinic_id: null,
      professional_id: null,
      professional_preference: 'cualquier',
      urgency: 'normal',
      clinic_preference: null,
      date_preference: /mañana/.test(lower) ? 'mañana' : /esta semana/.test(lower) ? 'esta semana' : 'esta semana',
      time_preference: /tarde/.test(lower) ? 'afternoon' : /mañana/.test(lower) ? 'morning' : 'any',
      patient_name: null,
      patient_email: null,
      patient_phone: null,
      requires_identity_verification: false,
      missing_fields: matched ? [] : ['treatment'],
      assistant_message: matched
        ? 'Perfecto. Busco huecos con cualquier profesional. Elige día u horario:'
        : 'Elige primero el tratamiento que necesitas:',
      should_fetch_availability: Boolean(matched),
      severe_symptoms: false,
      user_message_summary: 'Sin preferencia de profesional'
    }
  }

  if (/reservar|nueva cita|quiero (una )?cita|pedir cita/.test(lower) && !matched) {
    const names = treatments.map((t) => t.name).slice(0, 4).join(', ')
    return {
      intent: 'book_appointment',
      action: 'book',
      treatment: null,
      treatment_id: null,
      clinic_id: null,
      professional_id: null,
      urgency: 'normal',
      clinic_preference: null,
      professional_preference: null,
      date_preference: null,
      time_preference: null,
      patient_name: null,
      patient_email: null,
      patient_phone: null,
      requires_identity_verification: false,
      missing_fields: ['treatment'],
      assistant_message: names
        ? `¿Qué tratamiento necesitas? Puedes elegir: ${names}.`
        : '¿Qué tratamiento o motivo de la cita necesitas?',
      should_fetch_availability: false,
      severe_symptoms: false,
      user_message_summary: 'Quiere reservar cita'
    }
  }

  const treatmentName = matched?.name ?? (/limpieza/.test(lower)
    ? treatments.find((t) => /limpieza/i.test(t.name))?.name ?? 'limpieza dental'
    : /revisión|revision/.test(lower)
      ? treatments.find((t) => /revisi/i.test(t.name))?.name ?? 'revisión'
      : /dolor|muela|urgencia/.test(lower)
        ? treatments.find((t) => /urgencia/i.test(t.name))?.name ?? 'urgencia dental'
        : /blanque/.test(lower)
          ? treatments.find((t) => /blanque/i.test(t.name))?.name ?? null
          : null)

  const treatmentId =
    matched?.id ??
    (treatmentName ? treatments.find((t) => t.name === treatmentName)?.id ?? null : null)

  const professionalPref = /prefiero cita con|con el doctor|con la doctora|con dr\.? /i.test(message)
    ? message.replace(/.*prefiero cita con\s*/i, '').trim()
    : /cualquier profesional|me da igual/.test(lower)
      ? 'cualquier'
      : null

  const date = /hoy/.test(lower)
    ? 'hoy'
    : /mañana/.test(lower)
      ? 'mañana'
      : /proxima semana|próxima semana/.test(lower)
        ? 'próxima semana'
        : /esta semana|cuanto antes|lo antes posible/.test(lower)
          ? 'esta semana'
          : null

  return {
    intent: 'book_appointment',
    action: 'book',
    treatment: treatmentName,
    treatment_id: treatmentId,
    clinic_id: null,
    professional_id: null,
    urgency: /dolor|urgencia/.test(lower) ? 'high' : 'normal',
    clinic_preference: null,
    professional_preference: professionalPref,
    date_preference: date,
    time_preference: /por la tarde|tarde/.test(lower)
      ? 'afternoon'
      : /por la mañana|mañanas/.test(lower)
        ? 'morning'
        : 'any',
    patient_name: null,
    patient_email: null,
    patient_phone: null,
    requires_identity_verification: false,
    missing_fields: treatmentName
      ? date
        ? professionalPref
          ? []
          : ['professional_preference']
        : ['date_preference']
      : ['treatment'],
    assistant_message: treatmentName
      ? date
        ? professionalPref
          ? 'Busco huecos disponibles. Elige el horario que prefieras:'
          : '¿Tienes preferencia de profesional o te da igual?'
        : '¿Qué día te viene mejor? Puedes elegir una opción:'
      : treatments.length
        ? `Elige un tratamiento de la lista o dime cuál necesitas: ${treatments.map((t) => t.name).join(', ')}.`
        : '¿Qué tratamiento o motivo de la cita necesitas?',
    should_fetch_availability: Boolean(treatmentName && date && (professionalPref === 'cualquier' || professionalPref)),
    severe_symptoms: /dolor fuerte|no aguanto|sangra mucho/.test(lower),
    user_message_summary: treatmentName ? `Cita de ${treatmentName}` : message.slice(0, 80)
  }
}

export async function interpretAppointmentsMessage(input: {
  message: string
  conversation: Array<{ role: 'user' | 'assistant'; text: string }>
  catalogSummary: string
  catalogJson?: string
  currentStateSummary: string
  identityVerified: boolean
  catalogTreatments?: CatalogTreatment[]
}): Promise<{ intent: GeminiAppointmentsIntent; usedGemini: boolean }> {
  const catalog = { treatments: input.catalogTreatments ?? [] }
  if (!hasGeminiConfig()) {
    const intent = fallbackIntent(input.message, catalog)
    await recordConversationTurn({
      userMessage: input.message,
      intent: intent.intent,
      treatmentLabel: intent.treatment,
      matchedTreatmentId: intent.treatment_id,
      usedGemini: false,
      missingFields: intent.missing_fields
    })
    return { intent, usedGemini: false }
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
      `Paciente verificado: ${input.identityVerified ? 'sí' : 'no'}`,
      'Catálogo JSON (usa IDs exactos cuando coincidan):',
      input.catalogJson ?? input.catalogSummary,
      'Aprendizaje de sesión:',
      getLearningContextSummary(),
      'Estado actual:',
      input.currentStateSummary,
      'Mensaje del paciente:',
      input.message
    ].join('\n')

    const result = await model.generateContent({
      contents: [...history, { role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA
      }
    })

    const parsed = geminiAppointmentsIntentSchema.safeParse(JSON.parse(result.response.text()))
    if (!parsed.success) {
      const intent = fallbackIntent(input.message, catalog)
      await recordConversationTurn({
        userMessage: input.message,
        intent: intent.intent,
        treatmentLabel: intent.treatment,
        matchedTreatmentId: intent.treatment_id,
        usedGemini: false,
        missingFields: intent.missing_fields
      })
      return { intent, usedGemini: false }
    }

    let intent = parsed.data
    if (input.identityVerified && intent.requires_identity_verification) {
      intent = { ...intent, requires_identity_verification: false }
    }

    await recordConversationTurn({
      userMessage: input.message,
      intent: intent.intent,
      treatmentLabel: intent.treatment,
      matchedTreatmentId: intent.treatment_id,
      usedGemini: true,
      missingFields: intent.missing_fields
    })

    return { intent, usedGemini: true }
  } catch (error) {
    logError('gemini.appointments.call', error)
    const intent = fallbackIntent(input.message, catalog)
    await recordConversationTurn({
      userMessage: input.message,
      intent: intent.intent,
      treatmentLabel: intent.treatment,
      matchedTreatmentId: intent.treatment_id,
      usedGemini: false,
      missingFields: intent.missing_fields
    })
    return { intent, usedGemini: false }
  }
}

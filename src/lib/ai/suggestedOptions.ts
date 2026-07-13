import type {
  PublicBookingClinic,
  PublicBookingProfessional,
  PublicBookingTreatment
} from '@/lib/services/publicAiBooking'
import type { GeminiAppointmentsIntent } from '@/lib/ai/geminiAppointmentsAssistant'

export type SuggestedOptionKind =
  | 'intent'
  | 'treatment'
  | 'professional'
  | 'clinic'
  | 'date'
  | 'time'
  | 'manage'
  | 'help'

export type SuggestedOption = {
  kind: SuggestedOptionKind
  label: string
  message: string
  clinicId?: string
  treatmentId?: string
  professionalId?: string
}

const INTENT_OPTIONS: SuggestedOption[] = [
  { kind: 'intent', label: 'Reservar nueva cita', message: 'Quiero reservar una cita nueva' },
  { kind: 'intent', label: 'Ver mis citas', message: 'Ver mis citas' },
  { kind: 'intent', label: 'Próxima cita', message: '¿Cuál es mi próxima cita?' },
  { kind: 'intent', label: 'Cambiar una cita', message: 'Quiero cambiar una cita' },
  { kind: 'intent', label: 'Cancelar una cita', message: 'Quiero cancelar una cita' },
  { kind: 'help', label: 'Hablar con la clínica', message: 'Necesito hablar con mi clínica' }
]

const DATE_OPTIONS: SuggestedOption[] = [
  { kind: 'date', label: 'Hoy', message: 'Me viene bien hoy' },
  { kind: 'date', label: 'Mañana', message: 'Me viene bien mañana' },
  { kind: 'date', label: 'Esta semana', message: 'Esta semana' },
  { kind: 'date', label: 'Próxima semana', message: 'La próxima semana' },
  { kind: 'date', label: 'Cuanto antes', message: 'Lo antes posible' }
]

const TIME_OPTIONS: SuggestedOption[] = [
  { kind: 'time', label: 'Por la mañana', message: 'Prefiero cita por la mañana' },
  { kind: 'time', label: 'Por la tarde', message: 'Prefiero cita por la tarde' },
  { kind: 'time', label: 'Mediodía', message: 'Me viene bien al mediodía' },
  { kind: 'time', label: 'Cualquier hora', message: 'Cualquier hora me vale' }
]

const PATIENT_SYMPTOM_OPTIONS: SuggestedOption[] = [
  { kind: 'treatment', label: 'Me duele una muela', message: 'Tengo dolor dental y necesito cita de urgencia' },
  { kind: 'treatment', label: 'Solo revisión', message: 'Quiero una revisión y diagnóstico' },
  { kind: 'treatment', label: 'Limpieza', message: 'Quiero una cita de limpieza dental profesional' },
  { kind: 'treatment', label: 'Blanqueamiento', message: 'Quiero una cita de blanqueamiento LED' }
]

const PROFESSIONAL_ANY: SuggestedOption = {
  kind: 'professional',
  label: 'Cualquier profesional',
  message: 'Me da igual el profesional'
}

function capOptions<T>(items: T[], max: number) {
  return items.slice(0, max)
}

export function buildSuggestedOptions(input: {
  mode: 'book' | 'manage' | 'help'
  clinics: PublicBookingClinic[]
  treatments: PublicBookingTreatment[]
  professionals: PublicBookingProfessional[]
  bookingState: {
    clinicId?: string
    treatmentId?: string
    professionalId?: string
    datePreferenceLabel?: string
  }
  intent?: GeminiAppointmentsIntent | null
  identityVerified?: boolean
  hasSlots?: boolean
  welcome?: boolean
}): SuggestedOption[] {
  const missing = new Set(input.intent?.missing_fields ?? [])
  const isBook =
    input.mode === 'book' ||
    input.intent?.intent === 'book_appointment' ||
    input.intent?.intent === 'urgency_warning' ||
    input.intent?.intent === 'reschedule_appointment'

  if (input.welcome || (!input.bookingState.treatmentId && !input.intent)) {
    const treatmentChips = capOptions(
      input.treatments.map((t) => ({
        kind: 'treatment' as const,
        label: t.name,
        message: `Quiero una cita de ${t.name}`,
        treatmentId: t.id,
        clinicId: t.clinicId
      })),
      8
    )
    return [
      ...INTENT_OPTIONS.slice(0, 2),
      ...treatmentChips,
      ...PATIENT_SYMPTOM_OPTIONS.filter(
        (chip) => !treatmentChips.some((t) => t.label.toLowerCase().includes(chip.label.toLowerCase().slice(0, 6)))
      ).slice(0, 2),
      ...INTENT_OPTIONS.slice(2)
    ]
  }

  if (input.mode === 'manage' || input.intent?.requires_identity_verification) {
    if (!input.identityVerified) {
      return [
        { kind: 'manage', label: 'Ver mis citas', message: 'Ver mis citas' },
        { kind: 'manage', label: 'Próxima cita', message: '¿Cuál es mi próxima cita?' },
        { kind: 'manage', label: 'Cambiar cita', message: 'Quiero cambiar una cita' },
        { kind: 'manage', label: 'Cancelar cita', message: 'Quiero cancelar una cita' }
      ]
    }
    return [
      { kind: 'manage', label: 'Ver todas mis citas', message: 'Muéstrame todas mis citas' },
      { kind: 'manage', label: 'Próxima cita', message: '¿Cuál es mi próxima cita?' },
      { kind: 'manage', label: 'Cambiar una cita', message: 'Quiero cambiar una cita' },
      { kind: 'manage', label: 'Cancelar una cita', message: 'Quiero cancelar una cita' }
    ]
  }

  if (input.hasSlots) {
    return [
      { kind: 'date', label: 'Buscar otro día', message: 'Busca otro día disponible' },
      { kind: 'professional', label: 'Otro profesional', message: 'Prueba con otro profesional' },
      { kind: 'date', label: 'Primera cita libre', message: 'Muéstrame la primera cita disponible' },
      ...TIME_OPTIONS
    ]
  }

  if (isBook) {
    if (!input.bookingState.treatmentId || missing.has('treatment')) {
      const chips = capOptions(
        input.treatments.map((t) => ({
          kind: 'treatment' as const,
          label: t.name,
          message: `Quiero una cita de ${t.name}`,
          treatmentId: t.id,
          clinicId: t.clinicId
        })),
        10
      )
      if (chips.length) return chips
    }

    if (input.clinics.length > 1 && (!input.bookingState.clinicId || missing.has('clinic_preference'))) {
      return capOptions(
        input.clinics.map((c) => ({
          kind: 'clinic' as const,
          label: c.name,
          message: `Quiero cita en ${c.name}`,
          clinicId: c.id
        })),
        6
      )
    }

    if (input.bookingState.treatmentId && !input.bookingState.professionalId && professionalsAvailable(input)) {
      const proChips = capOptions(
        input.professionals.map((p) => ({
          kind: 'professional' as const,
          label: p.fullName,
          message: `Prefiero cita con ${p.fullName}`,
          professionalId: p.id,
          clinicId: p.clinicId
        })),
        6
      )
      return [...proChips, PROFESSIONAL_ANY]
    }

    if (input.bookingState.treatmentId && (!input.bookingState.datePreferenceLabel || missing.has('date_preference'))) {
      return DATE_OPTIONS
    }

    if (input.bookingState.treatmentId && missing.has('time_preference')) {
      return TIME_OPTIONS
    }

    if (input.bookingState.treatmentId) {
      return [...DATE_OPTIONS.slice(0, 3), ...TIME_OPTIONS]
    }
  }

  return INTENT_OPTIONS
}

function professionalsAvailable(input: {
  professionals: PublicBookingProfessional[]
  intent?: GeminiAppointmentsIntent | null
}) {
  return input.professionals.length > 0 || Boolean(input.intent?.missing_fields?.includes('professional_preference'))
}

export function buildCatalogJson(input: {
  clinics: PublicBookingClinic[]
  treatments: PublicBookingTreatment[]
  professionals: PublicBookingProfessional[]
}) {
  return JSON.stringify(
    {
      clinics: input.clinics.map((c) => ({ id: c.id, name: c.name, address: c.address })),
      treatments: input.treatments.map((t) => ({
        id: t.id,
        clinic_id: t.clinicId,
        name: t.name,
        duration_minutes: t.durationMinutes
      })),
      professionals: input.professionals.map((p) => ({
        id: p.id,
        clinic_id: p.clinicId,
        name: p.fullName,
        specialty: p.specialty
      }))
    },
    null,
    0
  )
}

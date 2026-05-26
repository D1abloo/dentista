import { addDays, format } from 'date-fns'
import type {
  PublicBookingClinic,
  PublicBookingProfessional,
  PublicBookingTreatment
} from '@/lib/services/publicAiBooking'

export type ResolvedBookingContext = {
  clinicId?: string
  clinicName?: string
  treatmentId?: string
  treatmentName?: string
  professionalId?: string
  professionalName?: string
  dateRange?: { from: string; to: string }
  preferredTime: 'morning' | 'afternoon' | 'any'
}

function normalize(text: string) {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

function fuzzyMatchName(query: string | null | undefined, options: { id: string; name: string }[]) {
  if (!query) return undefined
  const q = normalize(query)
  if (!q || q.includes('cualquier') || q.includes('indiferente')) return undefined
  const exact = options.find((item) => normalize(item.name) === q)
  if (exact) return exact
  return options.find((item) => normalize(item.name).includes(q) || q.includes(normalize(item.name)))
}

export function resolveDateRange(preference: string | null | undefined): { from: string; to: string } {
  const today = new Date()
  const pref = normalize(preference ?? '')
  if (pref.includes('hoy')) {
    const d = format(today, 'yyyy-MM-dd')
    return { from: d, to: d }
  }
  if (pref.includes('manana')) {
    const d = format(addDays(today, 1), 'yyyy-MM-dd')
    return { from: d, to: d }
  }
  if (pref.includes('proxima semana')) {
    return {
      from: format(addDays(today, 7), 'yyyy-MM-dd'),
      to: format(addDays(today, 14), 'yyyy-MM-dd')
    }
  }
  if (pref.includes('esta semana') || pref.includes('cuanto antes') || pref.includes('primer hueco')) {
    return {
      from: format(today, 'yyyy-MM-dd'),
      to: format(addDays(today, 7), 'yyyy-MM-dd')
    }
  }
  return {
    from: format(today, 'yyyy-MM-dd'),
    to: format(addDays(today, 14), 'yyyy-MM-dd')
  }
}

export function resolvePreferredTime(value: string | null | undefined): 'morning' | 'afternoon' | 'any' {
  const pref = normalize(value ?? '')
  if (pref.includes('tarde') || pref === 'afternoon') return 'afternoon'
  if (pref.includes('manana') || pref.includes('morning')) return 'morning'
  return 'any'
}

export function resolveBookingContext(input: {
  clinics: PublicBookingClinic[]
  treatments: PublicBookingTreatment[]
  professionals: PublicBookingProfessional[]
  clinicPreference?: string | null
  treatmentQuery?: string | null
  professionalPreference?: string | null
  datePreference?: string | null
  timePreference?: string | null
  currentClinicId?: string
}): ResolvedBookingContext {
  const clinic =
    fuzzyMatchName(input.clinicPreference, input.clinics.map((c) => ({ id: c.id, name: c.name }))) ??
    (input.currentClinicId ? input.clinics.find((c) => c.id === input.currentClinicId) : input.clinics[0])

  const treatment = fuzzyMatchName(
    input.treatmentQuery,
    input.treatments.map((t) => ({ id: t.id, name: t.name }))
  )

  const professional = fuzzyMatchName(
    input.professionalPreference,
    input.professionals.map((p) => ({ id: p.id, name: p.fullName }))
  )

  const clinicRow =
    clinic ??
    (input.currentClinicId
      ? input.clinics.find((c) => c.id === input.currentClinicId)
      : input.clinics[0])

  return {
    clinicId: clinicRow?.id,
    clinicName: clinicRow?.name,
    treatmentId: treatment?.id,
    treatmentName: treatment?.name,
    professionalId: professional?.id,
    professionalName: professional?.name,
    dateRange: resolveDateRange(input.datePreference),
    preferredTime: resolvePreferredTime(input.timePreference)
  }
}

export function bookingFieldsReady(ctx: ResolvedBookingContext) {
  return Boolean(ctx.clinicId && ctx.treatmentId && ctx.dateRange)
}

export function patientFieldsReady(input: {
  patientName?: string | null
  patientEmail?: string | null
  patientPhone?: string | null
}) {
  return Boolean(input.patientName?.trim() && input.patientEmail?.trim() && input.patientPhone?.trim())
}

export type TrustClinic = {
  name: string
  short: string
  initials: string
  accent: string
  city: string
}

/** Clínicas de referencia (seed local + social proof landing). */
export const TRUST_CLINICS: TrustClinic[] = [
  { name: 'Clínica Dental Nova', short: 'Dental Nova', initials: 'DN', accent: '#0d9488', city: 'Madrid' },
  { name: 'Sonrisa Clínica Dental', short: 'Sonrisa', initials: 'SC', accent: '#0ea5e9', city: 'Valencia' },
  { name: 'Dental Horizonte', short: 'Horizonte', initials: 'DH', accent: '#6366f1', city: 'Barcelona' },
  { name: 'Clínica Mediterráneo', short: 'Mediterráneo', initials: 'CM', accent: '#0891b2', city: 'Málaga' },
  { name: 'Dental Plus', short: 'Dental Plus', initials: 'DP', accent: '#059669', city: 'Sevilla' }
]

export type Testimonial = {
  quote: string
  author: string
  role: string
  clinicKey: string
}

export const LANDING_TESTIMONIALS: Testimonial[] = [
  {
    quote:
      'Desde que usamos AgendaClinic la recepción deja de perder la mañana al teléfono. Las reservas online y los recordatorios nos han reducido las ausencias de forma clara.',
    author: 'Clínica Dental Nova',
    role: 'Madrid · 3 gabinetes',
    clinicKey: 'Clínica Dental Nova'
  },
  {
    quote:
      'El portal del paciente nos da una imagen muy profesional. Informes, facturas y citas en un solo sitio — mis pacientes lo agradecen.',
    author: 'Sonrisa Clínica Dental',
    role: 'Valencia · Equipo de 6',
    clinicKey: 'Sonrisa Clínica Dental'
  },
  {
    quote:
      'La migración fue sencilla y el soporte respondió rápido. La agenda por profesional y la facturación integrada nos ahorran horas cada semana.',
    author: 'Dental Horizonte',
    role: 'Barcelona · Multi-sede',
    clinicKey: 'Dental Horizonte'
  },
  {
    quote:
      'El asistente de citas con IA resuelve reservas fuera de horario sin que recepción tenga que intervenir. Los huecos son reales y no hay dobles reservas.',
    author: 'Clínica Mediterráneo',
    role: 'Málaga · 2 sedes',
    clinicKey: 'Clínica Mediterráneo'
  },
  {
    quote:
      'Facturación, consentimientos y agenda en la misma plataforma. Por fin dejamos de saltar entre Excel, WhatsApp y un programa viejo.',
    author: 'Dental Plus',
    role: 'Sevilla · 4 profesionales',
    clinicKey: 'Dental Plus'
  }
]

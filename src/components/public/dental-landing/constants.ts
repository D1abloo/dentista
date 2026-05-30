import { brandImageAlts, brandImages } from '@/lib/brand/assets'

export const DENTAL_IMAGES = {
  hero: brandImages.agenda,
  citas: brandImages.citas,
  portal: brandImages.inicio,
  informes: brandImages.informes,
  doctor: brandImages.doctor,
  mensajes: brandImages.mensajes
} as const

export const DENTAL_IMAGE_ALTS = {
  hero: 'Agenda clínica dental en AgendaClinic',
  citas: 'Paciente reservando cita dental online',
  portal: 'Portal del paciente en móvil',
  informes: 'Informes clínicos dentales en AgendaClinic',
  doctor: 'Panel de gestión de citas de clínica dental',
  mensajes: 'Comunicación clínica con pacientes'
} as const

export { brandImages, brandImageAlts }

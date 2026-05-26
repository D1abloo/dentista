/**
 * Imágenes en `/public/img` — servidas como `/img/...`.
 * Nombres alineados con secciones de la app.
 */
export const brandImages = {
  logo: '/img/logo.webp',
  inicio: '/img/inicio.webp',
  agenda: '/img/agenda.webp',
  citas: '/img/citas.webp',
  informes: '/img/informes.webp',
  mensajes: '/img/mensajes.webp',
  doctor: '/img/Dr.webp'
} as const;

export type BrandImageKey = keyof typeof brandImages;

export const brandImageAlts: Record<BrandImageKey, string> = {
  logo: 'Logo de AgendaClinic',
  inicio: 'Mockup del portal del paciente de AgendaClinic',
  agenda: 'Agenda clínica dental de AgendaClinic con citas y disponibilidad',
  citas: 'Agenda de citas online de AgendaClinic',
  informes: 'Informes clínicos en AgendaClinic',
  mensajes: 'Mensajes con la clínica en AgendaClinic',
  doctor: 'Panel de administración de AgendaClinic'
};

/** Imagen principal del hero: agenda clínica. */
export const heroAgendaImage = brandImages.agenda;

/** Fallback de captura panel clínica si falla la carga de la agenda. */
export const clinicDashboardFallback = brandImages.citas;

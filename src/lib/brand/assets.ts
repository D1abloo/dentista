/**
 * Imágenes en `/public/img` — servidas como `/img/...`.
 * Nombres alineados con secciones de la app.
 */
export const brandImages = {
  logo: '/img/logo.webp',
  inicio: '/img/inicio.webp',
  citas: '/img/citas.webp',
  informes: '/img/informes.webp',
  mensajes: '/img/mensajes.webp',
  doctor: '/img/Dr.webp'
} as const;

export type BrandImageKey = keyof typeof brandImages;

export const brandImageAlts: Record<BrandImageKey, string> = {
  logo: 'Logo de AgendaClinic',
  inicio: 'Mockup del portal del paciente de AgendaClinic',
  citas: 'Agenda de citas online de AgendaClinic',
  informes: 'Informes clínicos en AgendaClinic',
  mensajes: 'Mensajes con la clínica en AgendaClinic',
  doctor: 'Panel de administración de AgendaClinic'
};

/** Fallback de captura panel clínica si no hay PNG de guía. */
export const clinicDashboardFallback = brandImages.doctor;

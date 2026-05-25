/** Marca global AgendaClinic — textos visibles en UI. */
export const BRAND_NAME = 'AgendaClinic';

export const BRAND_TAGLINE_PUBLIC = 'Gestión inteligente de citas';
export const BRAND_TAGLINE_CLINIC = 'Tu clínica organizada';
export const BRAND_TAGLINE_PATIENT = 'Portal del paciente';
export const BRAND_TAGLINE_PLATFORM = 'Plataforma';

export const BRAND_PANEL_CLINIC = 'Panel clínica';
export const BRAND_ACCESS_CLINIC = 'Acceso a clínica';
export const BRAND_ACCESS_PLATFORM = 'Acceso plataforma';

export const BRAND_LOGO_ALT = 'Logo de AgendaClinic';

export const BRAND_FOOTER_DESC =
  'La plataforma para gestionar citas, pacientes, agenda, informes, documentos, facturación y portal del paciente desde un entorno seguro.';

export const BRAND_COPYRIGHT = `© 2026 ${BRAND_NAME}. Todos los derechos reservados.`;

export type BrandContext = 'public' | 'clinic' | 'patient' | 'platform' | 'footer';

export function brandTagline(context: BrandContext): string {
  switch (context) {
    case 'clinic':
      return BRAND_PANEL_CLINIC;
    case 'patient':
      return BRAND_TAGLINE_PATIENT;
    case 'platform':
      return BRAND_TAGLINE_PLATFORM;
    case 'footer':
      return BRAND_TAGLINE_PUBLIC;
    default:
      return BRAND_TAGLINE_PUBLIC;
  }
}

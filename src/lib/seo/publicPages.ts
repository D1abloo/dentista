import { BRAND_SEO, absoluteUrl } from '@/lib/seo/siteConfig';

export type PageSeo = {
  title: string;
  description: string;
  keywords?: string;
  path: string;
  ogTitle?: string;
  ogDescription?: string;
};

const k = BRAND_SEO.defaultKeywords;

export const publicPageSeo: Record<string, PageSeo> = {
  '/': {
    path: '/',
    title: 'AgendaClinic | Software dental para citas, pacientes y facturación',
    description:
      'Digitaliza tu clínica dental con AgendaClinic: agenda inteligente, ficha de pacientes, informes, documentos, facturas, pagos y portal del paciente con acceso seguro.',
    keywords: `${k}, AgendaClinic`,
    ogTitle: 'AgendaClinic — Software dental para clínicas modernas',
    ogDescription:
      'Gestiona citas, pacientes, informes clínicos, facturación y comunicación con pacientes desde una sola plataforma en la nube.'
  },
  '/contacto': {
    path: '/contacto',
    title: 'Contacto y soporte | AgendaClinic',
    description:
      'Contacta con AgendaClinic: soporte para clínicas dentales y pacientes. Formulario, email y respuesta en menos de 24 horas laborables.',
    keywords: 'contacto software dental, soporte AgendaClinic, demo clínica dental',
    ogTitle: 'Contacto AgendaClinic',
    ogDescription: 'Solicita información, demo o soporte para tu clínica dental.'
  },
  '/ayuda': {
    path: '/ayuda',
    title: 'Centro de ayuda | Guías AgendaClinic para clínicas y pacientes',
    description:
      'Guías y preguntas frecuentes sobre AgendaClinic: reservar citas, informes, facturas, pagos, consentimientos y panel de clínica.',
    keywords: 'ayuda software dental, guía portal paciente dental, tutorial agenda clínica',
    ogTitle: 'Centro de ayuda AgendaClinic',
    ogDescription: 'Resuelve dudas sobre el portal del paciente y el panel de clínica.'
  },
  '/portal-paciente': {
    path: '/portal-paciente',
    title: 'Portal del paciente dental | Citas, informes y facturas',
    description:
      'Accede al portal del paciente AgendaClinic: consulta citas, descarga informes y documentos, paga facturas y firma consentimientos de forma segura.',
    keywords:
      'portal paciente dental, área paciente clínica dental, mis citas dentista, facturas paciente dental',
    ogTitle: 'Portal del paciente · AgendaClinic',
    ogDescription: 'Tu clínica y tú, conectados: citas, documentos y pagos en un solo lugar.'
  },
  '/registro-clinica': {
    path: '/registro-clinica',
    title: 'Registrar mi clínica dental | Alta AgendaClinic',
    description:
      'Solicita el alta de tu clínica en AgendaClinic. Software dental con datos aislados por centro, revisión de solicitud y activación por email.',
    keywords: 'registro clínica dental, software dental para clínicas, alta SaaS dental',
    ogTitle: 'Registrar clínica en AgendaClinic',
    ogDescription: 'Empieza a digitalizar agenda, pacientes y facturación de tu clínica.'
  },
  '/registro-paciente': {
    path: '/registro-paciente',
    title: 'Registro de paciente | Portal dental AgendaClinic',
    description:
      'Crea tu cuenta de paciente en AgendaClinic para reservar citas online y acceder a informes, documentos y facturas de tu clínica.',
    keywords: 'registro paciente dental, cuenta portal paciente, reservar cita dentista online',
    ogTitle: 'Registro paciente AgendaClinic',
    ogDescription: 'Activa tu cuenta y reserva citas con tu clínica dental.'
  },
  '/privacidad': {
    path: '/privacidad',
    title: 'Política de privacidad | AgendaClinic',
    description:
      'Política de privacidad y protección de datos de AgendaClinic: RGPD, derechos del usuario y seguridad multi-tenant para clínicas dentales.',
    keywords: 'privacidad software dental, RGPD clínica dental'
  },
  '/cookies': {
    path: '/cookies',
    title: 'Política de cookies | AgendaClinic',
    description:
      'Información sobre el uso de cookies y tecnologías similares en la web y aplicación AgendaClinic.',
    keywords: 'cookies AgendaClinic, política cookies'
  },
  '/terminos': {
    path: '/terminos',
    title: 'Términos y condiciones | AgendaClinic',
    description:
      'Condiciones de uso del software AgendaClinic para clínicas dentales y usuarios del portal del paciente.',
    keywords: 'términos uso software dental'
  }
};

export function seoForPath(pathname: string): PageSeo | null {
  const path = pathname === '/' ? '/' : pathname.replace(/\/$/, '') || '/';
  return publicPageSeo[path] ?? null;
}

export function canonicalForPath(pathname: string): string {
  return absoluteUrl(pathname === '/' ? '/' : pathname.replace(/\/$/, '') || '/');
}

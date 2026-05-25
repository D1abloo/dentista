import { Cloud, Receipt, Shield, Smartphone } from 'lucide-react';

export const landingTrustMetrics = [
  { value: 50, prefix: '+', suffix: '', label: 'clínicas digitalizadas' },
  { value: 12000, prefix: '+', suffix: '', label: 'citas gestionadas' },
  { value: 8000, prefix: '+', suffix: '', label: 'documentos compartidos' },
  { value: 99.9, prefix: '', suffix: '%', label: 'disponibilidad', decimals: 1 }
] as const;

export const landingFinalCtaBenefits = [
  { icon: Cloud, label: 'Sin instalación' },
  { icon: Smartphone, label: 'Portal paciente incluido' },
  { icon: Receipt, label: 'Facturación y pagos' },
  { icon: Shield, label: 'Seguridad multi-tenant' }
] as const;

/** URLs sociales: vacío = no mostrar enlace externo (icono oculto o deshabilitado). */
export const publicSocialLinks = {
  facebook: import.meta.env.PUBLIC_SOCIAL_FACEBOOK ?? '',
  instagram: import.meta.env.PUBLIC_SOCIAL_INSTAGRAM ?? '',
  linkedin: import.meta.env.PUBLIC_SOCIAL_LINKEDIN ?? '',
  youtube: import.meta.env.PUBLIC_SOCIAL_YOUTUBE ?? ''
} as const;

export const publicFooterColumns = [
  {
    title: 'Producto',
    links: [
      { href: '/#funcionalidades', label: 'Agenda clínica' },
      { href: '/portal-paciente', label: 'Portal paciente' },
      { href: '/#funcionalidades', label: 'Informes clínicos' },
      { href: '/#funcionalidades', label: 'Documentos' },
      { href: '/#precios', label: 'Facturación' },
      { href: '/#funcionalidades', label: 'Pagos' },
      { href: '/privacidad', label: 'Seguridad' }
    ]
  },
  {
    title: 'Soluciones',
    links: [
      { href: '/registro-clinica', label: 'Para clínicas' },
      { href: '/#precios', label: 'Para multi-sede' },
      { href: '/portal-paciente', label: 'Para pacientes' },
      { href: '/platform/login', label: 'Para administración' },
      { href: '/login/admin', label: 'Para doctores' },
      { href: '/login/admin', label: 'Para recepción' }
    ]
  },
  {
    title: 'Recursos',
    links: [
      { href: '/ayuda', label: 'Centro de ayuda' },
      { href: '/ayuda#faq', label: 'Preguntas frecuentes' },
      { href: '/contacto', label: 'Contacto' },
      { href: '/documentacion', label: 'Guías' },
      { href: '/ayuda', label: 'Blog' },
      { href: '/contacto?tipo=soporte', label: 'Soporte' }
    ]
  },
  {
    title: 'Legal',
    links: [
      { href: '/terminos', label: 'Términos' },
      { href: '/privacidad', label: 'Privacidad' },
      { href: '/cookies', label: 'Cookies' },
      { href: '/privacidad', label: 'Seguridad' },
      { href: '/privacidad', label: 'Protección de datos' }
    ]
  },
  {
    title: 'Accesos',
    links: [
      { href: '/portal-paciente', label: 'Portal paciente' },
      { href: '/login/admin', label: 'Panel clínica' },
      { href: '/platform/login', label: 'Plataforma' },
      { href: '/#contacto-pro', label: 'Solicitar demo' }
    ]
  }
] as const;

export const publicFooterBottomLinks = [
  { href: '/ayuda', label: 'Estado del servicio' },
  { href: '/ayuda#accesibilidad', label: 'Accesibilidad' },
  { href: '/ayuda', label: 'Mapa del sitio' }
] as const;

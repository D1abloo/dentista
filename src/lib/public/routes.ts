export type PublicNavItem =
  | { label: string; type: 'hash'; sectionId: string }
  | { label: string; type: 'path'; path: string }

/** Navegación principal del sitio público (header). */
export const PUBLIC_PRIMARY_NAV: PublicNavItem[] = [
  { label: 'Inicio', type: 'hash', sectionId: 'inicio' },
  { label: 'Citas online', type: 'hash', sectionId: 'citas-online' },
  { label: 'Para clínicas', type: 'hash', sectionId: 'para-clinicas' },
  { label: 'Portal paciente', type: 'path', path: '/portal-paciente' },
  { label: 'Cómo funciona', type: 'hash', sectionId: 'como-funciona' },
  { label: 'Planes', type: 'hash', sectionId: 'planes' },
  { label: 'Ayuda', type: 'path', path: '/ayuda' }
]

export const PUBLIC_WIDGET_CITAS_HREF = '#widget-citas' as const

export const PUBLIC_HEADER_CTA = {
  lookup: { label: 'Consultar cita', sectionId: 'consulta-cita' },
  book: { label: 'Reservar cita', href: PUBLIC_WIDGET_CITAS_HREF }
} as const

export type PublicFooterColumn = {
  title: string
  links: Array<{ label: string; href: string }>
}

export const PUBLIC_FOOTER_COLUMNS: PublicFooterColumn[] = [
  {
    title: 'Producto',
    links: [
      { label: 'Reservar cita', href: PUBLIC_WIDGET_CITAS_HREF },
      { label: 'Agenda clínica', href: '/login/admin' },
      { label: 'Portal paciente', href: '/portal-paciente' },
      { label: 'Informes', href: '/login/admin' },
      { label: 'Facturación', href: '/login/admin' }
    ]
  },
  {
    title: 'Para pacientes',
    links: [
      { label: 'Reservar cita', href: PUBLIC_WIDGET_CITAS_HREF },
      { label: 'Consultar cita', href: PUBLIC_WIDGET_CITAS_HREF },
      { label: 'Cambiar cita', href: PUBLIC_WIDGET_CITAS_HREF },
      { label: 'Cancelar cita', href: PUBLIC_WIDGET_CITAS_HREF },
      { label: 'Portal paciente', href: '/portal-paciente' }
    ]
  },
  {
    title: 'Para clínicas',
    links: [
      { label: 'Agenda', href: '/login/admin' },
      { label: 'Pacientes', href: '/login/admin' },
      { label: 'Profesionales', href: '/login/admin' },
      { label: 'Tratamientos', href: '/login/admin' },
      { label: 'Facturación', href: '/login/admin' },
      { label: 'Reportes', href: '/login/admin' }
    ]
  },
  {
    title: 'Recursos',
    links: [
      { label: 'Centro de ayuda', href: '/ayuda' },
      { label: 'Preguntas frecuentes', href: '/ayuda' },
      { label: 'Contacto', href: '/contacto' },
      { label: 'Guías', href: '/ayuda' }
    ]
  },
  {
    title: 'Legal',
    links: [
      { label: 'Términos', href: '/terminos' },
      { label: 'Privacidad', href: '/privacidad' },
      { label: 'Cookies', href: '/cookies' },
      { label: 'Seguridad', href: '/privacidad' }
    ]
  },
  {
    title: 'Accesos',
    links: [
      { label: 'Portal paciente', href: '/portal-paciente' },
      { label: 'Panel clínica', href: '/login/admin' },
      { label: 'Plataforma', href: '/platform/login' }
    ]
  }
]

const isHomePath = (pathname: string) => pathname === '/' || pathname === ''

/** Resuelve anclas de la home: en `/` → `#id`, fuera → `/#id`. */
export const resolveHomeSectionHref = (sectionId: string, pathname = '/'): string => {
  const hash = `#${sectionId}`
  return isHomePath(pathname) ? hash : `/${hash}`
}

export const hrefForNavItem = (item: PublicNavItem, pathname = '/'): string => {
  if (item.type === 'path') return item.path
  return resolveHomeSectionHref(item.sectionId, pathname)
}

export const isHashOnlyHref = (href: string) => href.startsWith('#')

export const scrollToSection = (sectionId: string) => {
  document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

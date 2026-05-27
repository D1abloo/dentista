import { DentistaWebpLockup } from '@/components/brand/DentistaWebpLogo'
import { ResponsiveContainer } from './ResponsiveContainer'

const COLUMNS = [
  {
    title: 'Producto',
    links: [
      { href: '/login/admin', label: 'Agenda clínica' },
      { href: '/portal-paciente', label: 'Portal paciente' },
      { href: '/citas-con-ia', label: 'Citas con IA' },
      { href: '/login/admin', label: 'Informes' },
      { href: '/login/admin', label: 'Facturación' },
      { href: '/login/admin', label: 'Pagos' }
    ]
  },
  {
    title: 'Soluciones',
    links: [
      { href: '/login/admin', label: 'Para clínicas' },
      { href: '/portal-paciente', label: 'Para pacientes' },
      { href: '/login/admin', label: 'Para doctores' },
      { href: '/login/admin', label: 'Para administración' },
      { href: '/platform/login', label: 'Multi-sede' }
    ]
  },
  {
    title: 'Recursos',
    links: [
      { href: '/ayuda', label: 'Centro de ayuda' },
      { href: '/ayuda', label: 'Preguntas frecuentes' },
      { href: '/contacto', label: 'Contacto' },
      { href: '/ayuda', label: 'Guías' },
      { href: '/ayuda', label: 'Blog' }
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
      { href: '/#planes', label: 'Solicitar demo' }
    ]
  }
] as const

export function AppFooter() {
  return (
    <footer className="ac-footer">
      <ResponsiveContainer wide className="ac-footer__grid">
        <div className="ac-footer__brand">
          <a href="/" className="ac-footer__logo">
            <DentistaWebpLockup placement="footer" context="footer" />
          </a>
          <span>Gestión inteligente de citas</span>
          <p>
            La plataforma para gestionar citas, pacientes, agenda, informes, documentos, facturación y portal del
            paciente desde un entorno seguro.
          </p>
        </div>
        {COLUMNS.map((column) => (
          <section key={column.title} className="ac-footer__col" aria-label={column.title}>
            <h3>{column.title}</h3>
            {column.links.map((link) => (
              <a key={link.href + link.label} href={link.href}>
                {link.label}
              </a>
            ))}
          </section>
        ))}
      </ResponsiveContainer>
      <ResponsiveContainer wide className="ac-footer__bottom">
        <span>© 2026 AgendaClinic. Todos los derechos reservados.</span>
      </ResponsiveContainer>
    </footer>
  )
}

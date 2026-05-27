import { DentistaWebpLockup } from '@/components/brand/DentistaWebpLogo'
import { ResponsiveContainer } from './ResponsiveContainer'

const COLUMNS = [
  {
    title: 'Producto',
    links: [
      { href: '#funciones', label: 'Funciones' },
      { href: '#citas-ia', label: 'Citas con IA' },
      { href: '#planes', label: 'Planes' }
    ]
  },
  {
    title: 'Soluciones',
    links: [
      { href: '/portal-paciente', label: 'Portal paciente' },
      { href: '/login/admin', label: 'Panel clínica' },
      { href: '/platform/login', label: 'Plataforma' }
    ]
  },
  {
    title: 'Recursos',
    links: [
      { href: '/ayuda', label: 'Centro de ayuda' },
      { href: '/contacto', label: 'Contacto' },
      { href: '/citas-con-ia', label: 'Asistente IA' }
    ]
  },
  {
    title: 'Legal',
    links: [
      { href: '/privacidad', label: 'Privacidad' },
      { href: '/terminos', label: 'Términos' },
      { href: '/cookies', label: 'Cookies' }
    ]
  }
] as const

export function AppFooter() {
  return (
    <footer className="ac-footer">
      <ResponsiveContainer wide className="ac-footer__grid">
        <div className="ac-footer__brand">
          <a href="#inicio" className="ac-footer__logo">
            <DentistaWebpLockup placement="footer" context="footer" />
          </a>
          <p>
            AgendaClinic centraliza citas, pacientes, agenda clínica, documentos, facturación y pagos desde una sola
            plataforma.
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

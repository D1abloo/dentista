import { DentistaWebpLockup } from '@/components/brand/DentistaWebpLogo'
import { Mail } from 'lucide-react'
import { DentalContainer } from './DentalContainer'

const COLS = [
  {
    title: 'Producto',
    links: [
      { href: '/citas-con-ia', label: 'Citas online' },
      { href: '/login/admin', label: 'Agenda clínica' },
      { href: '/portal-paciente', label: 'Portal paciente' },
      { href: '/citas-con-ia', label: 'Citas con IA' },
      { href: '/login/admin', label: 'Informes' },
      { href: '/login/admin', label: 'Facturación' }
    ]
  },
  {
    title: 'Para pacientes',
    links: [
      { href: '/citas-con-ia', label: 'Reservar cita' },
      { href: '#consulta-cita', label: 'Consultar cita' },
      { href: '/citas-con-ia', label: 'Cambiar cita' },
      { href: '/citas-con-ia', label: 'Cancelar cita' },
      { href: '/portal-paciente', label: 'Portal paciente' }
    ]
  },
  {
    title: 'Para clínicas',
    links: [
      { href: '/login/admin', label: 'Agenda' },
      { href: '/login/admin', label: 'Pacientes' },
      { href: '/login/admin', label: 'Profesionales' },
      { href: '/login/admin', label: 'Tratamientos' },
      { href: '/login/admin', label: 'Facturación' },
      { href: '/login/admin', label: 'Reportes' }
    ]
  },
  {
    title: 'Recursos',
    links: [
      { href: '/ayuda', label: 'Centro de ayuda' },
      { href: '/ayuda', label: 'Preguntas frecuentes' },
      { href: '/contacto', label: 'Contacto' },
      { href: '/ayuda', label: 'Guías' }
    ]
  },
  {
    title: 'Legal',
    links: [
      { href: '/terminos', label: 'Términos' },
      { href: '/privacidad', label: 'Privacidad' },
      { href: '/cookies', label: 'Cookies' },
      { href: '/privacidad', label: 'Seguridad' }
    ]
  },
  {
    title: 'Accesos',
    links: [
      { href: '/portal-paciente', label: 'Portal paciente' },
      { href: '/login/admin', label: 'Panel clínica' },
      { href: '/platform/login', label: 'Plataforma' }
    ]
  }
] as const

export const DentalFooter = () => (
  <footer className="adb-footer">
    <DentalContainer wide className="adb-footer__grid">
      <div className="adb-footer__brand">
        <a href="/">
          <DentistaWebpLockup placement="footer" context="footer" />
        </a>
        <strong>AgendaClinic</strong>
        <span>Gestión inteligente de citas</span>
        <p>Plataforma de citas online para clínicas dentales: reservas, agenda, portal paciente y facturación.</p>
        <a href="/contacto" className="adb-footer__mail" aria-label="Contacto">
          <Mail className="h-4 w-4" aria-hidden />
        </a>
      </div>
      {COLS.map((col) => (
        <section key={col.title} aria-label={col.title}>
          <h3>{col.title}</h3>
          {col.links.map((link) => (
            <a key={link.label} href={link.href}>
              {link.label}
            </a>
          ))}
        </section>
      ))}
    </DentalContainer>
    <DentalContainer wide className="adb-footer__bottom">
      <span>© 2026 AgendaClinic. Todos los derechos reservados.</span>
    </DentalContainer>
  </footer>
)

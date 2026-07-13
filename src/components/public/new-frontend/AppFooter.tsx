import { DentistaWebpLockup } from '@/components/brand/DentistaWebpLogo'
import { Linkedin, Mail } from 'lucide-react'
import type { MouseEvent } from 'react'
import { openAiAppointmentsWidget } from '@/lib/public/aiWidget'
import { PUBLIC_FOOTER_COLUMNS } from '@/lib/public/routes'
import { ResponsiveContainer } from './ResponsiveContainer'

const WIDGET_LINK_HREFS = new Set(['#widget-citas'])

export function AppFooter() {
  const handleLinkClick = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!WIDGET_LINK_HREFS.has(href)) return
    event.preventDefault()
    openAiAppointmentsWidget()
  }

  return (
    <footer className="ac-footer">
      <ResponsiveContainer wide className="ac-footer__grid">
        <div className="ac-footer__brand">
          <a href="/" className="ac-footer__logo">
            <DentistaWebpLockup placement="footer" context="footer" />
          </a>
          <strong>AgendaClinic</strong>
          <span>Gestión inteligente de citas</span>
          <p>
            Plataforma clínica para reservas online, agenda, portal del paciente, informes, documentos y
            facturación — con asistente de citas integrado.
          </p>
          <div className="ac-footer__social">
            <a href="/contacto" aria-label="Contacto por email">
              <Mail className="h-4 w-4" aria-hidden />
            </a>
            <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn AgendaClinic">
              <Linkedin className="h-4 w-4" aria-hidden />
            </a>
          </div>
        </div>
        {PUBLIC_FOOTER_COLUMNS.map((column) => (
          <section key={column.title} className="ac-footer__col" aria-label={column.title}>
            <h3>{column.title}</h3>
            {column.links.map((link) => (
              <a key={link.href + link.label} href={link.href} onClick={(event) => handleLinkClick(event, link.href)}>
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

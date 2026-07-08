import { DentistaWebpLockup } from '@/components/brand/DentistaWebpLogo'
import { Mail } from 'lucide-react'
import { PUBLIC_FOOTER_COLUMNS } from '@/lib/public/routes'
import { DentalContainer } from './DentalContainer'

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
      {PUBLIC_FOOTER_COLUMNS.map((col) => (
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

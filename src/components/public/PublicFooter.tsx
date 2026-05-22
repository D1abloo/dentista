import { Facebook, Instagram, Linkedin } from 'lucide-react';
import { DentistaWebpLockup } from '@/components/brand/DentistaWebpLogo';

const links = [
  { href: '/reserva', label: 'Reservar cita' },
  { href: '/login/paciente', label: 'Portal paciente' },
  { href: '/login/admin', label: 'Acceso clínica' },
  { href: '/ayuda', label: 'Centro de ayuda' },
  { href: '/registro-clinica', label: 'Registrar clínica' },
  { href: '/privacidad', label: 'Privacidad' },
  { href: '/terminos', label: 'Términos' },
  { href: '/cookies', label: 'Cookies' }
];

export function PublicFooter() {
  return (
    <footer className="lp-footer lp-footer--corp">
      <div className="shell lp-footer__grid lp-footer__grid--simple">
        <div className="lp-footer__brand">
          <a href="/" className="lp-footer__logo">
            <DentistaWebpLockup placement="footer" />
          </a>
          <p>Citas, informes y facturas en un solo portal seguro para pacientes y clínicas.</p>
          <div className="lp-footer__social">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <Facebook className="h-4 w-4" />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <Instagram className="h-4 w-4" />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <Linkedin className="h-4 w-4" />
            </a>
          </div>
        </div>
        <nav className="lp-footer__links" aria-label="Enlaces">
          {links.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>
      </div>
      <div className="shell lp-footer__copy">© {new Date().getFullYear()} Dentista+. Todos los derechos reservados.</div>
    </footer>
  );
}

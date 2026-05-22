import { Facebook, Instagram, Linkedin } from 'lucide-react';
import { DentistaWebpLockup } from '@/components/brand/DentistaWebpLogo';

const defaultNavLinks = [
  { href: '/', label: 'Inicio' },
  { href: '/reserva', label: 'Reservar cita' },
  { href: '/login/paciente', label: 'Portal paciente' },
  { href: '/ayuda', label: 'Ayuda' },
  { href: '/contacto', label: 'Contacto' }
];

const proNavLinks = [
  { href: '/#funcionalidades', label: 'Funciones' },
  { href: '/#precios', label: 'Precios' },
  { href: '/login/admin', label: 'Acceso clínica' },
  { href: '/ayuda', label: 'Ayuda' },
  { href: '/#contacto-pro', label: 'Solicitar PRO' }
];

const legalLinks = [
  { href: '/privacidad', label: 'Privacidad' },
  { href: '/terminos', label: 'Términos' },
  { href: '/cookies', label: 'Cookies' }
];

export function PublicFooter({ variant = 'default' }: { variant?: 'default' | 'pro' }) {
  const navLinks = variant === 'pro' ? proNavLinks : defaultNavLinks;
  const tagline =
    variant === 'pro'
      ? 'Software PRO para clínicas dentales: agenda, expedientes, facturación y portal del paciente.'
      : 'Citas, informes y facturas en un portal seguro para pacientes y familias.';

  return (
    <footer className={`lp-footer lp-footer--corp${variant === 'pro' ? ' lp-footer--pro' : ''}`}>
      <div className="shell lp-footer__grid">
        <div className="lp-footer__brand">
          <a href="/" className="lp-footer__logo">
            <DentistaWebpLockup placement="footer" />
          </a>
          <p className="lp-footer__tagline">{tagline}</p>
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

        <div className="lp-footer__col">
          <h4 className="lp-footer__heading">Navegación</h4>
          <nav className="lp-footer__nav" aria-label="Navegación">
            {navLinks.map((l) => (
              <a key={l.href} href={l.href}>
                {l.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="lp-footer__col">
          <h4 className="lp-footer__heading">Legal</h4>
          <nav className="lp-footer__nav" aria-label="Legal">
            {legalLinks.map((l) => (
              <a key={l.href} href={l.href}>
                {l.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
      <div className="shell lp-footer__copy">© {new Date().getFullYear()} Dentista+. Todos los derechos reservados.</div>
    </footer>
  );
}

import { Facebook, Instagram, Linkedin, Youtube } from 'lucide-react';
import { DentistaWebpLockup } from '@/components/brand/DentistaWebpLogo';

const defaultNavLinks = [
  { href: '/', label: 'Inicio' },
  { href: '/reserva', label: 'Reservar cita' },
  { href: '/login/paciente', label: 'Portal paciente' },
  { href: '/ayuda', label: 'Ayuda' },
  { href: '/contacto', label: 'Contacto' }
];

const premiumColumns = [
  {
    title: 'Producto',
    links: [
      { href: '/#funcionalidades', label: 'Funciones' },
      { href: '/login/paciente', label: 'Portal paciente' },
      { href: '/login/admin', label: 'Panel clínica' },
      { href: '/platform/login', label: 'Plataforma' },
      { href: '/#precios', label: 'Planes' }
    ]
  },
  {
    title: 'Recursos',
    links: [
      { href: '/ayuda', label: 'Ayuda' },
      { href: '/ayuda', label: 'Centro de soporte' },
      { href: '/ayuda', label: 'Guías' },
      { href: '/ayuda#faq', label: 'Preguntas frecuentes' },
      { href: '/contacto', label: 'Blog' }
    ]
  },
  {
    title: 'Legal',
    links: [
      { href: '/terminos', label: 'Términos y condiciones' },
      { href: '/privacidad', label: 'Política de privacidad' },
      { href: '/cookies', label: 'Política de cookies' }
    ]
  },
  {
    title: 'Accesos',
    links: [
      { href: '/login/paciente', label: 'Portal paciente' },
      { href: '/login/admin', label: 'Panel clínica' },
      { href: '/platform/login', label: 'Plataforma' }
    ]
  }
];

const legalLinks = [
  { href: '/privacidad', label: 'Privacidad' },
  { href: '/terminos', label: 'Términos' },
  { href: '/cookies', label: 'Cookies' }
];

export function PublicFooter({ variant = 'default' }: { variant?: 'default' | 'pro' | 'premium' }) {
  const isPremium = variant === 'premium' || variant === 'pro';
  const tagline = isPremium
    ? 'La plataforma #1 para clínicas dentales que quieren digitalizar su gestión y ofrecer la mejor experiencia a sus pacientes.'
    : 'Citas, informes y facturas en un portal seguro para pacientes y familias.';

  if (variant === 'premium') {
    return (
      <footer className="df-lp-footer">
        <div className="shell df-lp-footer__grid">
          <div className="df-lp-footer__brand">
            <a href="/" className="df-lp-footer__logo">
              <DentistaWebpLockup placement="footer" />
            </a>
            <p>{tagline}</p>
            <div className="df-lp-footer__social">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <Linkedin className="h-4 w-4" />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                <Youtube className="h-4 w-4" />
              </a>
            </div>
          </div>
          {premiumColumns.map((col) => (
            <div key={col.title} className="df-lp-footer__col">
              <h4>{col.title}</h4>
              <nav aria-label={col.title}>
                {col.links.map((l) => (
                  <a key={l.href + l.label} href={l.href}>
                    {l.label}
                  </a>
                ))}
              </nav>
            </div>
          ))}
        </div>
        <div className="shell df-lp-footer__bottom">
          <span>© 2026 Dentista+. Todos los derechos reservados.</span>
        </div>
      </footer>
    );
  }

  const navLinks = variant === 'pro' ? premiumColumns[0].links : defaultNavLinks;

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

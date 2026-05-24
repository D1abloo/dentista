import { Facebook, Instagram, Linkedin, Youtube } from 'lucide-react';
import { DentistaWebpLockup } from '@/components/brand/DentistaWebpLogo';

const FOOTER_COLUMNS = [
  {
    title: 'Explorar',
    links: [
      { href: '/#producto', label: 'Producto' },
      { href: '/#funcionalidades', label: 'Funciones' },
      { href: '/#precios', label: 'Planes' },
      { href: '/portal-paciente', label: 'Portal del paciente' }
    ]
  },
  {
    title: 'Recursos',
    links: [
      { href: '/ayuda', label: 'Centro de ayuda' },
      { href: '/ayuda#faq', label: 'Preguntas frecuentes' },
      { href: '/contacto', label: 'Contacto' },
      { href: '/documentacion', label: 'Documentación' }
    ]
  },
  {
    title: 'Legal',
    links: [
      { href: '/terminos', label: 'Términos' },
      { href: '/privacidad', label: 'Privacidad' },
      { href: '/cookies', label: 'Cookies' }
    ]
  }
];

/** Pie de página del sitio público (sin variantes de panel admin). */
export function PublicFooter() {
  return (
    <footer className="ps-footer">
      <div className="ps-shell ps-footer__grid">
        <div className="ps-footer__brand">
          <a href="/" className="ps-footer__logo">
            <DentistaWebpLockup placement="footer" />
          </a>
          <p>
            La plataforma dental para gestionar clínicas con portal del paciente, informes y facturación con la
            calidez que merece tu consulta.
          </p>
          <div className="ps-footer__social">
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
        {FOOTER_COLUMNS.map((col) => (
          <div key={col.title} className="ps-footer__col">
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
      <div className="ps-shell ps-footer__bottom">
        <span>© {new Date().getFullYear()} Dentista+. Todos los derechos reservados.</span>
      </div>
    </footer>
  );
}

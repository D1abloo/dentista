import { Facebook, Instagram, Linkedin } from 'lucide-react';
import { ClinicBrandLockup } from '@/components/brand/ClinicBrandLogo';

const product = [
  { href: '/#caracteristicas', label: 'Características' },
  { href: '/reserva', label: 'Reservar cita' },
  { href: '/ayuda', label: 'Centro de ayuda' },
  { href: '/login', label: 'Acceso pacientes y clínicas' }
];

const company = [
  { href: '/contacto', label: 'Contacto' },
  { href: '/ayuda', label: 'Tutoriales y guías' },
  { href: '/registro-clinica', label: 'Registrar clínica' },
  { href: '/#precios', label: 'Precios' }
];

const legal = [
  { href: '/privacidad', label: 'Privacidad' },
  { href: '/terminos', label: 'Términos' },
  { href: '/cookies', label: 'Cookies' }
];

export function PublicFooter() {
  return (
    <footer className="lp-footer lp-footer--brand">
      <div className="lp-footer__clinic-bg" aria-hidden />
      <div className="shell lp-footer__grid">
        <div className="lp-footer__brand">
          <a href="/" className="lp-footer__logo">
            <ClinicBrandLockup size={40} theme="dark" />
          </a>
          <p>La plataforma dental que conecta pacientes y clínicas con seguridad, diseño premium y gestión integral.</p>
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
        <div>
          <h4>Producto</h4>
          {product.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </div>
        <div>
          <h4>Compañía</h4>
          {company.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </div>
        <div>
          <h4>Legal</h4>
          {legal.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </div>
      </div>
      <div className="shell lp-footer__copy">© {new Date().getFullYear()} Dentista+. Todos los derechos reservados.</div>
    </footer>
  );
}

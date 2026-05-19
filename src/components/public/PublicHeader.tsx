import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { LogoMark } from '@/components/brand/Logo';

const links = [
  { href: '/', label: 'Inicio' },
  { href: '/#caracteristicas', label: 'Características' },
  { href: '/#demo', label: 'Demo' },
  { href: '/#precios', label: 'Precios' },
  { href: '/contacto', label: 'Contacto' }
];

export function PublicHeader({ activeHref }: { activeHref?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="pub-header">
      <div className="shell pub-header__inner">
        <a href="/" className="pub-header__brand">
          <LogoMark size={36} />
          <span className="font-[family-name:var(--display)] text-lg">Dentista+</span>
        </a>
        <nav className="pub-nav" aria-label="Principal">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={activeHref && (l.href === activeHref || (activeHref === '/contacto' && l.href === '/contacto')) ? 'pub-nav__link--active' : undefined}
              aria-current={activeHref === l.href ? 'page' : undefined}
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="pub-actions">
          <a href="/login" className="btn btn--outline btn--sm hidden sm:inline-flex">
            Iniciar sesión
          </a>
          <a href="/reserva" className="btn btn--primary btn--sm">
            Reservar cita
          </a>
          <button type="button" className="pub-menu-btn lg:hidden" onClick={() => setOpen((v) => !v)} aria-label="Menú">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open ? (
        <nav className="pub-drawer lg:hidden" aria-label="Menú móvil">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ))}
          <a href="/login" className="mt-2 block" onClick={() => setOpen(false)}>
            Iniciar sesión
          </a>
        </nav>
      ) : null}
    </header>
  );
}

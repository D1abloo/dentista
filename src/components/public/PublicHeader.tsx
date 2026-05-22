import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { DentistaWebpLockup } from '@/components/brand/DentistaWebpLogo';

const links = [
  { href: '/', label: 'Inicio' },
  { href: '/#caracteristicas', label: 'Funciones' },
  { href: '/ayuda', label: 'Ayuda' },
  { href: '/contacto', label: 'Contacto' }
];

export function PublicHeader({ activeHref }: { activeHref?: string }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`pub-header pub-header--corp${scrolled ? ' pub-header--scrolled' : ''}`}>
      <div className="shell pub-header__inner">
        <a href="/" className="pub-header__brand">
          <DentistaWebpLockup placement="header" />
        </a>
        <nav className="pub-nav" aria-label="Principal">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={activeHref && l.href === activeHref ? 'pub-nav__link--active' : undefined}
              aria-current={activeHref === l.href ? 'page' : undefined}
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="pub-actions">
          <a href="/login/paciente" className="btn btn--outline-teal btn--sm hidden md:inline-flex">
            Entrar como paciente
          </a>
          <a href="/reserva" className="btn btn--teal btn--sm">
            Reservar cita
          </a>
          <button type="button" className="pub-menu-btn lg:hidden" onClick={() => setOpen((v) => !v)} aria-label="Menú">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open ? (
        <nav className="pub-drawer pub-drawer--corp lg:hidden" aria-label="Menú móvil">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ))}
          <div className="pub-drawer__cta">
            <a href="/reserva" className="btn btn--teal btn--block" onClick={() => setOpen(false)}>
              Reservar cita
            </a>
            <a href="/login/paciente" className="btn btn--outline-teal btn--block" onClick={() => setOpen(false)}>
              Entrar como paciente
            </a>
          </div>
        </nav>
      ) : null}
    </header>
  );
}

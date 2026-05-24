import { useEffect, useState, type MouseEvent } from 'react';
import { Menu, X } from 'lucide-react';
import { DentistaWebpLockup } from '@/components/brand/DentistaWebpLogo';
import { EnterPortalDropdown } from './EnterPortalDropdown';
import { handleLandingHashLink } from '@/lib/publicScroll';

const NAV_LINKS = [
  { href: '/', label: 'Inicio' },
  { href: '/#producto', label: 'Producto' },
  { href: '/#funcionalidades', label: 'Funciones' },
  { href: '/#precios', label: 'Planes' },
  { href: '/ayuda', label: 'Ayuda' },
  { href: '/contacto', label: 'Contacto' }
];

type Props = {
  activeHref?: string;
  onWantDemo?: () => void;
};

export function PublicHeader({ activeHref, onWantDemo }: Props) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function onNavClick(e: MouseEvent<HTMLAnchorElement>, href: string) {
    handleLandingHashLink(e, href);
    setOpen(false);
  }

  function wantDemoClick() {
    setOpen(false);
    if (window.location.pathname === '/' && onWantDemo) {
      onWantDemo();
      return;
    }
    window.location.href = '/?plan=pro_clinica#contacto-pro';
  }

  return (
    <header className={`ps-header${scrolled ? ' ps-header--scrolled' : ''}`}>
      <div className="ps-shell ps-header__inner">
        <a href="/" className="ps-header__brand">
          <DentistaWebpLockup placement="header" />
        </a>

        <nav className="ps-nav" aria-label="Principal">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href + l.label}
              href={l.href}
              className={activeHref && l.href === activeHref ? 'ps-nav__link--active' : undefined}
              aria-current={activeHref === l.href ? 'page' : undefined}
              onClick={(e) => onNavClick(e, l.href)}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="ps-header__actions">
          <a href="/reserva" className="ps-btn ps-btn--ghost ps-btn--sm hidden md:inline-flex">
            Reservar
          </a>
          <button type="button" className="ps-btn ps-btn--ghost ps-btn--sm ps-header__demo" onClick={wantDemoClick}>
            Demo clínica
          </button>
          <EnterPortalDropdown onNavigate={() => setOpen(false)} />
          <button
            type="button"
            className="ps-menu-btn lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Menú"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <nav className="ps-drawer lg:hidden" aria-label="Menú móvil">
          {NAV_LINKS.map((l) => (
            <a key={l.href + l.label} href={l.href} onClick={(e) => onNavClick(e, l.href)}>
              {l.label}
            </a>
          ))}
          <div className="ps-drawer__cta">
            <a href="/reserva" className="ps-btn ps-btn--coral ps-btn--block">
              Reservar cita
            </a>
            <button type="button" className="ps-btn ps-btn--primary ps-btn--block" onClick={wantDemoClick}>
              Solicitar demo
            </button>
            <a href="/login/paciente" className="ps-btn ps-btn--outline ps-btn--block">
              Portal paciente
            </a>
          </div>
        </nav>
      ) : null}
    </header>
  );
}

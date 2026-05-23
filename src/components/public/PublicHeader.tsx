import { useEffect, useState, type MouseEvent } from 'react';
import { Menu, X } from 'lucide-react';
import { DentistaWebpLockup } from '@/components/brand/DentistaWebpLogo';
import { EnterPortalDropdown } from './EnterPortalDropdown';
import { handleLandingHashLink } from '@/lib/publicScroll';

const premiumLinks = [
  { href: '/', label: 'Inicio' },
  { href: '/#funcionalidades', label: 'Funciones' },
  { href: '/login/paciente', label: 'Portal paciente' },
  { href: '/login/admin', label: 'Panel clínica' },
  { href: '/platform/login', label: 'Plataforma' },
  { href: '/#precios', label: 'Planes' },
  { href: '/ayuda', label: 'Ayuda' },
  { href: '/contacto', label: 'Contacto' }
];

const defaultLinks = [
  { href: '/', label: 'Inicio' },
  { href: '/#funcionalidades', label: 'Funciones' },
  { href: '/ayuda', label: 'Ayuda' },
  { href: '/contacto', label: 'Contacto' }
];

type Props = {
  activeHref?: string;
  variant?: 'default' | 'pro' | 'premium';
  onWantDemo?: () => void;
};

export function PublicHeader({ activeHref, variant = 'default', onWantDemo }: Props) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isPremium = variant === 'premium';
  const links = isPremium ? premiumLinks : defaultLinks;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
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
    <header
      className={`pub-header pub-header--corp${isPremium ? ' pub-header--pro pub-header--premium' : ''}${scrolled ? ' pub-header--scrolled' : ''}`}
    >
      <div className="shell pub-header__inner">
        <a href="/" className="pub-header__brand">
          <DentistaWebpLockup placement="header" />
        </a>
        <nav className="pub-nav" aria-label="Principal">
          {links.map((l) => (
            <a
              key={l.href + l.label}
              href={l.href}
              className={activeHref && l.href === activeHref ? 'pub-nav__link--active' : undefined}
              aria-current={activeHref === l.href ? 'page' : undefined}
              onClick={(e) => onNavClick(e, l.href)}
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="pub-actions">
          {isPremium ? (
            <>
              <button
                type="button"
                className="df-lp-btn df-lp-btn--secondary df-lp-btn--sm hidden md:inline-flex"
                onClick={wantDemoClick}
              >
                Solicitar demo
              </button>
              <div className="hidden md:block">
                <EnterPortalDropdown onNavigate={() => setOpen(false)} />
              </div>
            </>
          ) : (
            <>
              <a href="/login/paciente" className="btn btn--outline-teal btn--sm hidden md:inline-flex">
                Entrar como paciente
              </a>
              <a href="/reserva" className="btn btn--teal btn--sm">
                Reservar cita
              </a>
            </>
          )}
          <button
            type="button"
            className="pub-menu-btn lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Menú"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open ? (
        <nav className="pub-drawer pub-drawer--corp lg:hidden" aria-label="Menú móvil">
          {links.map((l) => (
            <a key={l.href + l.label} href={l.href} onClick={(e) => onNavClick(e, l.href)}>
              {l.label}
            </a>
          ))}
          <div className="pub-drawer__cta">
            {isPremium ? (
              <>
                <button type="button" className="df-lp-btn df-lp-btn--primary df-lp-btn--block" onClick={wantDemoClick}>
                  Solicitar demo
                </button>
                <a href="/login/paciente" className="df-lp-btn df-lp-btn--secondary df-lp-btn--block">
                  Portal paciente
                </a>
                <a href="/login/admin" className="df-lp-btn df-lp-btn--secondary df-lp-btn--block">
                  Panel clínica
                </a>
                <a href="/platform/login" className="df-lp-btn df-lp-btn--secondary df-lp-btn--block">
                  Plataforma
                </a>
              </>
            ) : (
              <>
                <a href="/reserva" className="btn btn--teal btn--block">
                  Reservar cita
                </a>
                <a href="/login/paciente" className="btn btn--outline-teal btn--block">
                  Entrar como paciente
                </a>
              </>
            )}
          </div>
        </nav>
      ) : null}
    </header>
  );
}

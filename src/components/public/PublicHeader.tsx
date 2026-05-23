import { useEffect, useState, type MouseEvent } from 'react';
import { LogIn, Menu, X } from 'lucide-react';
import { DentistaWebpLockup } from '@/components/brand/DentistaWebpLogo';
import { handleLandingHashLink } from '@/lib/publicScroll';

const proLinks = [
  { href: '/#funcionalidades', label: 'Funciones' },
  { href: '/#beneficios', label: 'Beneficios' },
  { href: '/#seguridad', label: 'Seguridad' },
  { href: '/#precios', label: 'Precios' },
  { href: '/#contacto-pro', label: 'Contacto' }
];

const premiumLinks = [
  { href: '/', label: 'Inicio' },
  { href: '/#funcionalidades', label: 'Funciones' },
  { href: '/login/paciente', label: 'Portal paciente' },
  { href: '/login/admin', label: 'Panel clínica' },
  { href: '/platform/login', label: 'Plataforma' },
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
  onWantPro?: () => void;
  onWantDemo?: () => void;
};

export function PublicHeader({ activeHref, variant = 'default', onWantPro, onWantDemo }: Props) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const links =
    variant === 'premium' ? premiumLinks : variant === 'pro' ? proLinks : defaultLinks;
  const isPro = variant === 'pro';
  const isPremium = variant === 'premium';
  const onDemo = onWantDemo ?? onWantPro;

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
    if (window.location.pathname === '/' && onDemo) {
      onDemo();
      return;
    }
    window.location.href = '/?plan=pro_clinica#contacto-pro';
  }

  return (
    <header
      className={`pub-header pub-header--corp${isPro || isPremium ? ' pub-header--pro pub-header--premium' : ''}${scrolled ? ' pub-header--scrolled' : ''}`}
    >
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
              onClick={(e) => onNavClick(e, l.href)}
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="pub-actions">
          {isPremium ? (
            <>
              <button type="button" className="df-lp-btn df-lp-btn--primary df-lp-btn--sm hidden md:inline-flex" onClick={wantDemoClick}>
                Solicitar demo
              </button>
              <a href="/login" className="df-lp-btn df-lp-btn--secondary df-lp-btn--sm hidden md:inline-flex">
                <LogIn className="h-3.5 w-3.5" aria-hidden />
                Entrar
              </a>
            </>
          ) : isPro ? (
            <>
              <button type="button" className="btn btn--coral btn--sm hidden md:inline-flex" onClick={wantDemoClick}>
                Quiero PRO
              </button>
              <a href="/login/admin" className="pub-link-clinic hidden md:inline-flex">
                Acceso clínica
              </a>
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
            <a key={l.href} href={l.href} onClick={(e) => onNavClick(e, l.href)}>
              {l.label}
            </a>
          ))}
          <div className="pub-drawer__cta">
            {isPremium ? (
              <>
                <button type="button" className="df-lp-btn df-lp-btn--primary df-lp-btn--block" onClick={wantDemoClick}>
                  Solicitar demo
                </button>
                <a href="/login" className="df-lp-btn df-lp-btn--secondary df-lp-btn--block" onClick={() => setOpen(false)}>
                  Entrar
                </a>
              </>
            ) : isPro ? (
              <>
                <button type="button" className="btn btn--coral btn--block" onClick={wantDemoClick}>
                  Quiero PRO
                </button>
                <a href="/login/admin" className="btn btn--outline-teal btn--block" onClick={() => setOpen(false)}>
                  Acceso clínica
                </a>
              </>
            ) : (
              <>
                <a href="/reserva" className="btn btn--teal btn--block" onClick={() => setOpen(false)}>
                  Reservar cita
                </a>
                <a href="/login/paciente" className="btn btn--outline-teal btn--block" onClick={() => setOpen(false)}>
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

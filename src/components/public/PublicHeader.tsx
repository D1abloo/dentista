import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { Calendar, Menu, X } from 'lucide-react';
import { DentistaWebpLockup } from '@/components/brand/DentistaWebpLogo';
import { EnterPortalDropdown } from './EnterPortalDropdown';
import { handleLandingHashLink } from '@/lib/publicScroll';

const NAV_LINKS = [
  { href: '/', label: 'Inicio', hash: false },
  { href: '/#funcionalidades', label: 'Funciones', hash: true },
  { href: '/portal-paciente', label: 'Portal paciente', hash: false },
  { href: '/login/admin', label: 'Panel clínica', hash: false },
  { href: '/platform/login', label: 'Plataforma', hash: false },
  { href: '/#precios', label: 'Planes', hash: true },
  { href: '/ayuda', label: 'Ayuda', hash: false }
] as const;

const MOBILE_EXTRA = { href: '/contacto', label: 'Contacto' } as const;

const PORTAL_LINKS = [
  { href: '/portal-paciente', label: 'Portal paciente' },
  { href: '/login/admin', label: 'Panel clínica' },
  { href: '/platform/login', label: 'Plataforma' }
] as const;

type Props = {
  activeHref?: string;
  onWantDemo?: () => void;
};

export function PublicHeader({ activeHref = '/', onWantDemo }: Props) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusable = drawerRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled])'
    );
    const first = focusable?.[0];
    const last = focusable?.[focusable.length - 1];
    first?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        menuBtnRef.current?.focus();
        return;
      }
      if (e.key !== 'Tab' || !focusable?.length) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function onNavClick(e: MouseEvent<HTMLAnchorElement>, href: string, isHash: boolean) {
    if (isHash) handleLandingHashLink(e, href);
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

  function isActive(href: string) {
    if (activeHref) return href === activeHref;
    if (typeof window === 'undefined') return href === '/';
    const path = window.location.pathname;
    if (href === '/') return path === '/';
    if (href.startsWith('/#')) return false;
    return path === href || path.startsWith(href);
  }

  return (
    <header className={`ps-header ps-header--fade${scrolled ? ' ps-header--scrolled' : ''}`}>
      <div className="ps-shell ps-shell--wide ps-header__inner">
        <a href="/" className="ps-header__brand" aria-label="AgendaClinic — Inicio">
          <DentistaWebpLockup placement="header" context="public" />
        </a>

        <nav className="ps-nav" aria-label="Principal">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href + l.label}
              href={l.href}
              className={isActive(l.href) ? 'ps-nav__link--active' : undefined}
              aria-current={isActive(l.href) ? 'page' : undefined}
              onClick={(e) => onNavClick(e, l.href, l.hash)}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="ps-header__actions">
          <button
            type="button"
            className="ps-btn ps-btn--demo-outline ps-btn--sm ps-header__demo"
            onClick={wantDemoClick}
          >
            <Calendar className="h-3.5 w-3.5" aria-hidden />
            Solicitar demo
          </button>
          <EnterPortalDropdown className="ps-header__enter" onNavigate={() => setOpen(false)} />
          <button
            ref={menuBtnRef}
            type="button"
            className="ps-menu-btn lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="ps-mobile-drawer"
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <div
          id="ps-mobile-drawer"
          className="ps-drawer lg:hidden"
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label="Menú de navegación"
        >
          <div className="ps-drawer__head">
            <a href="/" className="ps-header__brand" onClick={() => setOpen(false)}>
              <DentistaWebpLockup placement="header" context="public" />
            </a>
            <button
              type="button"
              className="ps-menu-btn"
              onClick={() => setOpen(false)}
              aria-label="Cerrar menú"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="ps-drawer__nav" aria-label="Menú móvil">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href + l.label}
                href={l.href}
                onClick={(e) => onNavClick(e, l.href, l.hash)}
              >
                {l.label}
              </a>
            ))}
            <a href={MOBILE_EXTRA.href} onClick={() => setOpen(false)}>
              {MOBILE_EXTRA.label}
            </a>
          </nav>
          <div className="ps-drawer__cta">
            <button type="button" className="ps-btn ps-btn--demo-outline ps-btn--block" onClick={wantDemoClick}>
              <Calendar className="h-3.5 w-3.5" aria-hidden />
              Solicitar demo
            </button>
            <div className="ps-drawer__portals">
              {PORTAL_LINKS.map((p) => (
                <a key={p.href} href={p.href} className="ps-drawer__portal" onClick={() => setOpen(false)}>
                  {p.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}

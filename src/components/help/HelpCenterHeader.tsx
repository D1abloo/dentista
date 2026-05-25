import { useEffect, useState } from 'react';
import { Headphones, Menu, X } from 'lucide-react';
import { DentistaWebpLockup } from '@/components/brand/DentistaWebpLogo';

const QUICK_LINKS = [
  { href: '/portal-paciente', label: 'Portal paciente' },
  { href: '/login/admin', label: 'Panel clínica' },
  { href: '/platform/login', label: 'Plataforma' }
] as const;

export function HelpCenterHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <header
      className={`help-center-header${scrolled ? ' help-center-header--scrolled' : ''}`}
      role="banner"
    >
      <div className="help-center-header__inner ps-shell ps-shell--wide">
        <a href="/" className="help-center-header__brand" aria-label="AgendaClinic — Inicio">
          <DentistaWebpLockup placement="header" context="public" />
          <span className="help-center-header__title">Centro de ayuda</span>
        </a>

        <nav className="help-center-header__nav" aria-label="Accesos rápidos">
          {QUICK_LINKS.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>

        <div className="help-center-header__actions">
          <a href="/contacto?tipo=soporte" className="help-center-header__cta">
            <Headphones className="h-4 w-4" aria-hidden />
            Contactar soporte
          </a>
          <button
            type="button"
            className="help-center-header__menu-btn"
            aria-expanded={open}
            aria-controls="help-center-mobile-nav"
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <nav
          id="help-center-mobile-nav"
          className="help-center-header__drawer"
          aria-label="Menú móvil del centro de ayuda"
        >
          {QUICK_LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ))}
          <a href="/contacto?tipo=soporte" className="help-center-header__cta help-center-header__cta--block">
            Contactar soporte
          </a>
        </nav>
      ) : null}
    </header>
  );
}

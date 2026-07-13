import { useState, type ReactNode } from 'react';

export type PlatformShellProps = {
  title: ReactNode;
  subtitle?: string;
  headerActions?: ReactNode;
  children: ReactNode;
  /** Oculta cabecera por defecto (p. ej. monitorización con topbar propio) */
  hideHeader?: boolean;
  /** Card inferior del sidebar exclusiva de plataforma */
  exclusiveSidebarFooter?: boolean;
};
import { ExternalLink, LogOut, Menu, Shield } from 'lucide-react';
import { LogoMark } from '@/components/brand/Logo';
import { BRAND_NAME, BRAND_TAGLINE_PLATFORM } from '@/lib/brand/identity';
import { useLogout } from '@/components/auth/RoleGate';
import { PortalSwitcher } from '@/components/shared/PortalSwitcher';
import { platformNavSections } from './nav';

export function PlatformShell({ title, subtitle, headerActions, children, hideHeader, exclusiveSidebarFooter }: PlatformShellProps) {
  const [open, setOpen] = useState(false);
  const path = typeof window !== 'undefined' ? window.location.pathname : '';
  const logout = useLogout();

  const rail = (variant: 'rail' | 'drawer') => (
    <aside
      className={
        variant === 'drawer'
          ? 'portal-rail portal-rail--admin portal-rail--platform portal-rail--drawer'
          : 'portal-rail portal-rail--admin portal-rail--platform'
      }
    >
      <a href="/platform" className="plt-brand no-underline">
        <LogoMark size={36} />
        <span className="plt-brand__name">{BRAND_NAME}</span>
        <span className="plt-brand__sub">{BRAND_TAGLINE_PLATFORM}</span>
      </a>
      <div className="plt-admin-card">
        <div className="plt-admin-card__head">
          <Shield className="h-5 w-5" aria-hidden />
          <div>
            <p className="plt-admin-card__title">Super Admin</p>
            <p className="plt-admin-card__sub">Plataforma · multi-tenant</p>
          </div>
        </div>
        <p className="plt-admin-card__desc">
          Cada clínica aprobada opera en su propio panel. Sin contacto cruzado entre organizaciones.
        </p>
      </div>
      <nav className="portal-rail__nav flex-1 overflow-y-auto">
        {platformNavSections.map((section) => (
          <div key={section.id} className="plt-nav-section">
            <p className="plt-nav-section__title">{section.title}</p>
            {section.items.map((item) => {
              const active = path === item.href || (item.href !== '/platform' && path.startsWith(item.href));
              return (
                <a
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  title={item.description}
                  className={`rail-link rail-link--admin plt-rail-link${active ? ' rail-link--active' : ''}`}
                >
                  <item.icon className="h-4 w-4 shrink-0" aria-hidden />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </div>
        ))}
      </nav>
      {exclusiveSidebarFooter ? (
        <div className="plt-rail-exclusive">
          <p>Esta área es exclusiva para administración de la plataforma</p>
          <a href="/ayuda#plataforma">Más información</a>
        </div>
      ) : (
        <a href="/" className="plt-rail-footer" target="_blank" rel="noopener noreferrer">
          <ExternalLink className="h-4 w-4" aria-hidden />
          Sitio público
        </a>
      )}
      <button type="button" className="plt-rail-footer plt-rail-footer--btn" onClick={logout}>
        <LogOut className="h-4 w-4" aria-hidden />
        Salir
      </button>
    </aside>
  );

  return (
    <div className="portal portal--admin portal--platform">
      {rail('rail')}
      {open ? (
        <div className="portal-drawer-backdrop lg:hidden" role="presentation" onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()}>{rail('drawer')}</div>
        </div>
      ) : null}
      <div className="portal-main">
        {!hideHeader ? (
          <header className="portal-top portal-top--admin plt-top">
            <div className="plt-top__left">
              <div className="portal-top__row">
                <h1 className="portal-top__title">{title}</h1>
                <span className="live-pill">PLATAFORMA</span>
              </div>
              {subtitle ? <p className="portal-top__sub">{subtitle}</p> : null}
            </div>
            <div className="plt-top__right">
              <PortalSwitcher />
              {headerActions}
              <a href="/platform/configuracion" className="plt-btn plt-btn--ghost plt-btn--sm no-underline hidden sm:inline-flex">
                Configuración
              </a>
              <button type="button" className="pub-menu-btn lg:hidden" onClick={() => setOpen(true)} aria-label="Abrir menú">
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </header>
        ) : null}
        <main className="portal-body portal-body--admin plt-body">{children}</main>
      </div>
    </div>
  );
}

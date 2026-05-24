import { useState, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { LogOut, Menu, Shield } from 'lucide-react';
import { DentistaWebpLockup } from '@/components/brand/DentistaWebpLogo';
import { useLogout } from '@/components/auth/RoleGate';
import { logPortalAudit, usePortalAccess } from '@/hooks/usePortalAccess';
import { usePatient } from '@/hooks/usePatient';
import { PatientIdentity } from './PatientIdentity';

export type NavItem = { href: string; label: string; icon: LucideIcon };

function Rail({
  nav,
  path,
  patient,
  onNav,
  onLogout,
  variant
}: {
  nav: NavItem[];
  path: string;
  patient: { fullName: string; dni?: string; nhc?: string };
  onNav: (href: string, label: string) => void;
  onLogout: () => void;
  variant: 'drawer' | 'rail';
}) {
  const cls =
    variant === 'drawer'
      ? 'portal-rail portal-rail--patient portal-rail--drawer fixed z-50 flex lg:hidden'
      : 'portal-rail portal-rail--patient';
  return (
    <aside className={cls}>
      <a href="/paciente" className="corp-rail-brand no-underline">
        <DentistaWebpLockup placement="header" />
        <span className="sr-only">Portal paciente</span>
      </a>
      <div className="corp-rail-user corp-rail-user--patient">
        <PatientIdentity patient={patient} size="sm" />
      </div>
      <p className="corp-rail-nav-label">Tu espacio</p>
      <nav className="flex-1 overflow-y-auto">
        {nav.map((item) => {
          const active = path === item.href || (item.href !== '/paciente' && path.startsWith(item.href));
          return (
            <a
              key={item.href}
              href={item.href}
              onClick={() => onNav(item.href, item.label)}
              className={`rail-link ${active ? 'rail-link--active' : ''}`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </a>
          );
        })}
      </nav>
      <div className="corp-rail-secure" role="status">
        <Shield className="inline h-3.5 w-3.5" aria-hidden />
        Portal seguro
        <span>Acceso cifrado · solo tus datos</span>
      </div>
      <div className="corp-rail-footer">
        <button
          type="button"
          className="rail-link corp-rail-logout--patient mt-0 w-full border-0 bg-transparent"
          onClick={onLogout}
        >
          <LogOut className="h-4 w-4" /> Salir
        </button>
      </div>
    </aside>
  );
}

export function PatientShell({
  title,
  nav,
  children,
  clinicStaff = false
}: {
  title: string;
  nav: NavItem[];
  children: ReactNode;
  clinicStaff?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const path = typeof window !== 'undefined' ? window.location.pathname : '';
  const logout = useLogout();
  const patient = usePatient();
  const portalAccess = usePortalAccess();
  const close = () => setOpen(false);

  const onNav = (href: string, label: string) => {
    if (portalAccess.active) {
      void logPortalAudit({ eventType: 'nav_click', pagePath: href, resourceLabel: label });
    }
    close();
  };

  return (
    <div className="portal portal--patient">
      <Rail nav={nav} path={path} patient={patient} onNav={onNav} onLogout={logout} variant="rail" />
      {open ? (
        <div className="portal-drawer-backdrop lg:hidden" role="presentation" onClick={close}>
          <div onClick={(e) => e.stopPropagation()}>
            <Rail nav={nav} path={path} patient={patient} onNav={onNav} onLogout={logout} variant="drawer" />
          </div>
        </div>
      ) : null}
      <div className="portal-main">
        <header className="portal-top portal-top--patient patient-topbar">
          <div className="patient-topbar__brand">
            <span className="patient-topbar__accent" aria-hidden />
            <div className="min-w-0">
              <h1 className="patient-topbar__title">{title}</h1>
              <PatientIdentity patient={patient} size="sm" className="patient-topbar__identity" />
            </div>
          </div>
          <button type="button" className="pub-menu-btn lg:hidden" onClick={() => setOpen(true)} aria-label="Menú">
            <Menu className="h-5 w-5" />
          </button>
        </header>
        <main className="portal-body portal-body--corp portal-body--patient">
          {portalAccess.active ? (
            <div
              className="banner-alert mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-950"
              role="status"
            >
              <p className="m-0">
                Acceso clínico autorizado — {portalAccess.patientName ?? 'paciente'}.
              </p>
              <div className="flex flex-wrap gap-2">
                <a href="/paciente/gestion-clinica" className="btn btn--outline btn--sm shrink-0 no-underline">
                  Gestión clínica
                </a>
                <a href="/admin" className="btn btn--outline btn--sm shrink-0 no-underline">
                  Panel clínica
                </a>
              </div>
            </div>
          ) : clinicStaff ? (
            <div
              className="banner-alert mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800"
              role="status"
            >
              <p className="m-0">Vista clínica en el portal del paciente (sesión de administrador).</p>
              <a href="/paciente/gestion-clinica" className="btn btn--outline btn--sm shrink-0 no-underline">
                Gestión clínica
              </a>
            </div>
          ) : null}
          {children}
        </main>
      </div>
    </div>
  );
}

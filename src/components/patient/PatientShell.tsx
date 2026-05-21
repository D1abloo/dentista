import { useState, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { LogOut, Menu } from 'lucide-react';
import { LogoMark } from '@/components/brand/Logo';
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
  patient: { fullName: string; dni?: string };
  onNav: (href: string, label: string) => void;
  onLogout: () => void;
  variant: 'drawer' | 'rail';
}) {
  const cls =
    variant === 'drawer'
      ? 'portal-rail portal-rail--patient fixed z-50 flex lg:hidden'
      : 'portal-rail portal-rail--patient';
  return (
    <aside className={cls}>
      <a href="/paciente" className="mb-6 flex items-center gap-2 px-2 no-underline">
        <LogoMark size={36} />
        <span className="font-[family-name:var(--display)] text-[var(--navy)]">Dentista+</span>
      </a>
      <div className="mb-4 rounded-xl bg-[#f0fdfa] p-3">
        <PatientIdentity patient={patient} size="sm" />
      </div>
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
      <button type="button" className="rail-link mt-2 w-full border-0 bg-transparent" onClick={onLogout}>
        <LogOut className="h-4 w-4" /> Salir
      </button>
    </aside>
  );
}

export function PatientShell({ title, nav, children }: { title: string; nav: NavItem[]; children: ReactNode }) {
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
        <div className="fixed inset-0 z-50 bg-black/40 lg:hidden" onClick={close}>
          <div onClick={(e) => e.stopPropagation()}>
            <Rail nav={nav} path={path} patient={patient} onNav={onNav} onLogout={logout} variant="drawer" />
          </div>
        </div>
      ) : null}
      <div className="portal-main">
        <header className="portal-top">
          <div className="portal-top__intro">
            <h1 className="portal-top__title">{title}</h1>
            <PatientIdentity patient={patient} size="sm" />
          </div>
          <button type="button" className="pub-menu-btn lg:hidden" onClick={() => setOpen(true)} aria-label="Menú">
            <Menu className="h-5 w-5" />
          </button>
        </header>
        <main className="portal-body">
          {portalAccess.active ? (
            <div className="banner-alert mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-950" role="status">
              <p className="m-0">
                Acceso clínico autorizado — {portalAccess.patientName ?? 'paciente'}.
              </p>
              <a href="/admin" className="btn btn--outline btn--sm shrink-0 no-underline">
                Volver al panel
              </a>
            </div>
          ) : null}
          {children}
        </main>
      </div>
    </div>
  );
}

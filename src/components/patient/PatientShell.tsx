import { useState, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { LogOut, Menu } from 'lucide-react';
import { LogoMark } from '@/components/brand/Logo';
import { useLogout } from '@/components/auth/RoleGate';
import { useDemoStore } from '@/hooks/useDemoStore';
import { usePatient } from '@/hooks/usePatient';
import { IdBadge } from '@/components/ui/IdBadge';

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
  patient: { fullName: string; id: string };
  onNav: () => void;
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
        <p className="text-sm font-bold text-[var(--navy)]">{patient.fullName}</p>
        <IdBadge id={patient.id} kind="paciente" />
      </div>
      <nav className="flex-1 overflow-y-auto">
        {nav.map((item) => {
          const active = path === item.href || (item.href !== '/paciente' && path.startsWith(item.href));
          return (
            <a
              key={item.href}
              href={item.href}
              onClick={onNav}
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
  const { ephemeral } = useDemoStore();
  const close = () => setOpen(false);

  return (
    <div className="portal portal--patient">
      <Rail nav={nav} path={path} patient={patient} onNav={close} onLogout={logout} variant="rail" />
      {open ? (
        <div className="fixed inset-0 z-50 bg-black/40 lg:hidden" onClick={close}>
          <div onClick={(e) => e.stopPropagation()}>
            <Rail nav={nav} path={path} patient={patient} onNav={close} onLogout={logout} variant="drawer" />
          </div>
        </div>
      ) : null}
      <div className="portal-main">
        <header className="portal-top">
          <div>
            <h1 className="portal-top__title">{title}</h1>
            <p className="text-xs font-semibold text-[var(--muted)]">{patient.id}</p>
          </div>
          <button type="button" className="pub-menu-btn lg:hidden" onClick={() => setOpen(true)} aria-label="Menú">
            <Menu className="h-5 w-5" />
          </button>
        </header>
        <main className="portal-body">
          {ephemeral ? (
            <p className="banner-alert mb-4 text-sm" role="status">
              Modo prueba: puedes reservar y gestionar citas en pantalla, pero <strong>nada se guarda</strong> al
              recargar.
            </p>
          ) : null}
          {children}
        </main>
      </div>
    </div>
  );
}

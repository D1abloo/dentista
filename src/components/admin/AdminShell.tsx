import { useEffect, useState, type ReactNode } from 'react';
import { LogOut, Menu } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { AdminStaffSetup } from '@/components/auth/AdminStaffSetup';
import { useLogout } from '@/components/auth/RoleGate';
import { useDemoStore } from '@/hooks/useDemoStore';
import { useTenant } from '@/hooks/useTenant';
import { getStaffProfile, organizationDisplayName, organizationSubtitle } from '@/lib/organization';
import { GlobalIdSearch } from '@/components/shared/GlobalIdSearch';
import { adminNav } from './nav';
import { ClinicBranchSwitcher } from './ClinicBranchSwitcher';

function AdminRail({
  path,
  tenant,
  userLabel,
  onNav,
  onLogout,
  variant
}: {
  path: string;
  tenant: { id: string; name: string; subtitle: string };
  userLabel: string;
  onNav: () => void;
  onLogout: () => void;
  variant: 'drawer' | 'rail';
}) {
  const cls =
    variant === 'drawer'
      ? 'portal-rail portal-rail--admin portal-rail--drawer'
      : 'portal-rail portal-rail--admin';
  return (
    <aside className={cls}>
      <a href="/admin" className="admin-brand mb-6 px-2 no-underline" onClick={onNav}>
        <Logo theme="dark" size={48} />
      </a>
      <div className="admin-org-card mb-4">
        <p className="admin-org-card__name">{tenant.name}</p>
        <p className="admin-org-card__sub">{tenant.subtitle}</p>
        <p className="admin-org-card__user">{userLabel}</p>
      </div>
      <nav className="flex-1 overflow-y-auto">
        {adminNav.map((item) => {
          const active = path === item.href || (item.href !== '/admin' && path.startsWith(item.href));
          return (
            <a
              key={item.href}
              href={item.href}
              onClick={onNav}
              className={`rail-link rail-link--admin ${active ? 'rail-link--active' : ''}`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </a>
          );
        })}
      </nav>
      <a href="/" className="rail-link rail-link--admin text-white/50" onClick={onNav}>
        ← Inicio público
      </a>
      <button type="button" className="admin-logout-btn mt-2" onClick={onLogout}>
        <LogOut className="h-4 w-4" /> Cerrar sesión
      </button>
    </aside>
  );
}

export function AdminShell({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const path = typeof window !== 'undefined' ? window.location.pathname : '';
  const logout = useLogout();
  const scope = useTenant();
  const { state } = useDemoStore();
  const [sessionName, setSessionName] = useState('');
  const orgName = organizationDisplayName(state, scope.tenantId);
  const tenant = {
    id: scope.tenantId,
    name: orgName,
    subtitle: organizationSubtitle(state, scope.tenantId)
  };
  const [staffReady, setStaffReady] = useState(() => Boolean(getStaffProfile(scope.tenantId)));
  const close = () => setOpen(false);

  useEffect(() => {
    void fetch('/api/auth/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((j: { data?: { name?: string; email?: string } }) => {
        if (j.data?.name) setSessionName(j.data.name);
        else if (j.data?.email) setSessionName(j.data.email);
      })
      .catch(() => undefined);
  }, []);

  if (!staffReady) {
    return <AdminStaffSetup onDone={() => setStaffReady(true)} />;
  }

  const userLabel = sessionName || 'Usuario conectado';

  return (
    <div className="portal portal--admin">
      <AdminRail
        path={path}
        tenant={tenant}
        userLabel={userLabel}
        onNav={close}
        onLogout={logout}
        variant="rail"
      />
      {open ? (
        <div
          className="portal-drawer-backdrop lg:hidden"
          role="presentation"
          onClick={close}
          onKeyDown={(e) => e.key === 'Escape' && close()}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <AdminRail
              path={path}
              tenant={tenant}
              userLabel={userLabel}
              onNav={close}
              onLogout={logout}
              variant="drawer"
            />
          </div>
        </div>
      ) : null}
      <div className="portal-main">
        <header className="portal-top portal-top--admin">
          <div>
            <div className="portal-top__row">
              <h1 className="portal-top__title">{title}</h1>
            </div>
            {subtitle ? <p className="portal-top__sub">{subtitle}</p> : null}
            <p className="portal-top__meta">
              {tenant.subtitle} · {tenant.name}
            </p>
          </div>
          <div className="portal-top__actions">
            <div className="hidden lg:flex lg:flex-wrap lg:items-center lg:gap-2">
              <ClinicBranchSwitcher />
            </div>
            <div className="hidden md:block">
              <GlobalIdSearch />
            </div>
            <button type="button" className="admin-logout-btn admin-logout-btn--compact hidden sm:inline-flex" onClick={logout}>
              <LogOut className="h-4 w-4" /> Salir
            </button>
            <button type="button" className="pub-menu-btn lg:hidden" onClick={() => setOpen(true)} aria-label="Menú">
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </header>
        <main className="portal-body portal-body--admin">{children}</main>
      </div>
    </div>
  );
}

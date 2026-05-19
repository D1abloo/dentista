import { useState, type ReactNode } from 'react';
import { LogOut, Menu, Shield } from 'lucide-react';
import { LogoMark } from '@/components/brand/Logo';
import { AdminStaffSetup } from '@/components/auth/AdminStaffSetup';
import { useLogout } from '@/components/auth/RoleGate';
import { isClientDemoMode, isClientLiveMode } from '@/lib/appMode';
import { useDemoStore } from '@/hooks/useDemoStore';
import { useTenant } from '@/hooks/useTenant';
import { getStaffProfile, organizationDisplayName, organizationSubtitle } from '@/lib/organization';
import { GlobalIdSearch } from '@/components/shared/GlobalIdSearch';
import { adminNav } from './nav';
import { TenantSwitcher } from './TenantSwitcher';

function AdminRail({
  path,
  tenant,
  onNav,
  onLogout,
  variant
}: {
  path: string;
  tenant: { id: string; name: string; subtitle: string };
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
      <a href="/admin" className="mb-6 flex items-center gap-2 px-2 no-underline">
        <LogoMark size={36} />
        <span className="font-[family-name:var(--display)] text-white">Dentista+</span>
      </a>
      <div className="mb-4 rounded-xl bg-white/10 p-3 text-white">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-[var(--warn)]" />
          <p className="text-sm font-bold leading-tight">{tenant.name}</p>
        </div>
        <p className="mt-1 text-xs text-white/75">{tenant.subtitle}</p>
        <p className="mt-2 text-[0.65rem] text-white/60">Panel aislado por organización</p>
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
      <a href="/" className="rail-link rail-link--admin text-white/50">
        ← Inicio
      </a>
      <button type="button" className="rail-link rail-link--admin mt-1 w-full border-0 bg-transparent" onClick={onLogout}>
        <LogOut className="h-4 w-4" /> Salir
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
  const { state, dataSource, syncing } = useDemoStore();
  const orgName = organizationDisplayName(state, scope.tenantId);
  const tenant = {
    id: scope.tenantId,
    name: orgName,
    subtitle: organizationSubtitle(state, scope.tenantId)
  };
  const [staffReady, setStaffReady] = useState(
    () => !isClientDemoMode() || Boolean(getStaffProfile(scope.tenantId))
  );
  const close = () => setOpen(false);
  const live = isClientLiveMode();

  if (!staffReady) {
    return <AdminStaffSetup onDone={() => setStaffReady(true)} />;
  }

  const dataLabel =
    dataSource === 'supabase'
      ? syncing
        ? 'Guardando…'
        : 'Supabase'
      : live
        ? 'LIVE · servidor'
        : 'Local';

  return (
    <div className="portal portal--admin">
      <AdminRail path={path} tenant={tenant} onNav={close} onLogout={logout} variant="rail" />
      {open ? (
        <div
          className="portal-drawer-backdrop lg:hidden"
          role="presentation"
          onClick={close}
          onKeyDown={(e) => e.key === 'Escape' && close()}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <AdminRail path={path} tenant={tenant} onNav={close} onLogout={logout} variant="drawer" />
          </div>
        </div>
      ) : null}
      <div className="portal-main">
        <header className="portal-top portal-top--admin">
          <div>
            <div className="portal-top__row">
              <h1 className="portal-top__title">{title}</h1>
              {live ? <span className="live-pill">LIVE</span> : <span className="demo-pill">DEMO</span>}
            </div>
            {subtitle ? <p className="portal-top__sub">{subtitle}</p> : null}
            <p className="portal-top__meta">
              {tenant.subtitle} · {tenant.name}
              <span className="portal-top__data">{dataLabel}</span>
            </p>
          </div>
          <div className="portal-top__actions">
            <div className="hidden lg:block">
              <TenantSwitcher />
            </div>
            <div className="hidden md:block">
              <GlobalIdSearch />
            </div>
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

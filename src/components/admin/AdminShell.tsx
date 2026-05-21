import { useEffect, useState, type ReactNode } from 'react';
import { LogOut, Menu } from 'lucide-react';
import { AdminStaffSetup } from '@/components/auth/AdminStaffSetup';
import { useLogout } from '@/components/auth/RoleGate';
import { isClientLiveMode } from '@/lib/appMode';
import { useDemoStore } from '@/hooks/useDemoStore';
import { useTenant } from '@/hooks/useTenant';
import { getStaffProfile, organizationDisplayName, organizationSubtitle } from '@/lib/organization';
import { getStoredTenantId, settingsFor } from '@/lib/demoStore';
import { GlobalIdSearch } from '@/components/shared/GlobalIdSearch';
import { adminNav } from './nav';
import { ClinicBranchSwitcher } from './ClinicBranchSwitcher';
import { AdminQuickAccess } from './AdminQuickAccess';

function logInspectNav(href: string, label: string) {
  void fetch('/api/platform/inspect', {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ eventType: 'nav_click', pagePath: href, resourceLabel: label })
  });
}

function AdminRail({
  path,
  tenant,
  userLabel,
  clinicLogoUrl,
  platformInspect,
  onNav,
  onLogout,
  variant
}: {
  path: string;
  tenant: { id: string; name: string; subtitle: string };
  userLabel: string;
  clinicLogoUrl: string;
  platformInspect: boolean;
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
        <span className="clinic-brand-logo-shine admin-brand__clinic-logo-wrap">
          <img src={clinicLogoUrl} alt="" className="admin-brand__clinic-logo clinic-brand-logo-shine__img" width={56} height={56} />
        </span>
        <span className="admin-brand__label">Dentista+</span>
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
              onClick={() => {
                if (platformInspect) logInspectNav(item.href, item.label);
                onNav();
              }}
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
  const { state, dataSource } = useDemoStore();
  const live = isClientLiveMode();
  const tenantId = scope.tenantId || getStoredTenantId();
  const [sessionName, setSessionName] = useState('');
  const [platformInspect, setPlatformInspect] = useState(false);
  const orgName = organizationDisplayName(state, tenantId);
  const clinicLogoUrl = settingsFor(state, tenantId).logoUrl ?? '/brand/clinic-shield.svg';
  const tenant = {
    id: tenantId,
    name: orgName,
    subtitle: organizationSubtitle(state, tenantId)
  };
  const [staffReady, setStaffReady] = useState(() => live || Boolean(getStaffProfile(tenantId)));
  const close = () => setOpen(false);

  useEffect(() => {
    void fetch('/api/auth/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((j: { data?: { name?: string; email?: string; platformInspect?: boolean; inspectMode?: string } }) => {
        if (j.data?.name) setSessionName(j.data.name);
        else if (j.data?.email) setSessionName(j.data.email);
        setPlatformInspect(Boolean(j.data?.platformInspect && j.data?.inspectMode === 'clinic_admin'));
        if (live && j.data?.name) setStaffReady(true);
      })
      .catch(() => undefined);
  }, [live]);

  if (!live && !staffReady) {
    return <AdminStaffSetup onDone={() => setStaffReady(true)} />;
  }

  if (live && dataSource === 'loading') {
    return (
      <main className="grid min-h-screen place-items-center bg-[#eef2f7] px-4 text-sm font-bold text-dental-800">
        Cargando panel de clínica…
      </main>
    );
  }

  if (live && dataSource === 'empty') {
    return (
      <main className="grid min-h-screen place-items-center bg-[#eef2f7] px-4">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg">
          <h1 className="font-display text-xl text-dental-950">No se pudo cargar la clínica</h1>
          <p className="mt-2 text-sm text-slate-600">
            Revisa tu sesión o vuelve a iniciar sesión. Si el problema continúa, contacta con soporte.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <a href="/login/admin" className="btn btn--primary btn--sm no-underline">
              Ir al login
            </a>
            <button type="button" className="admin-logout-btn admin-logout-btn--compact" onClick={logout}>
              <LogOut className="h-4 w-4" /> Cerrar sesión
            </button>
          </div>
        </div>
      </main>
    );
  }

  const userLabel = sessionName || 'Usuario conectado';

  return (
    <div className="portal portal--admin">
      {platformInspect ? (
        <div className="platform-inspect-banner" role="status">
          <strong>Revisión de plataforma</strong> — Quedan registrados usuario, rol, fecha/hora y clics.{' '}
          <a href="/platform/incidencias">Volver a plataforma</a>
        </div>
      ) : null}
      <AdminRail
        path={path}
        tenant={tenant}
        userLabel={userLabel}
        clinicLogoUrl={clinicLogoUrl}
        platformInspect={platformInspect}
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
              clinicLogoUrl={clinicLogoUrl}
              platformInspect={platformInspect}
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
            <AdminQuickAccess />
            <div className="hidden lg:flex lg:flex-wrap lg:items-center lg:gap-2">
              <ClinicBranchSwitcher />
            </div>
            <div className="hidden md:block">
              <GlobalIdSearch />
            </div>
            <button type="button" className="admin-logout-btn admin-logout-btn--compact" onClick={logout}>
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Cerrar sesión</span>
              <span className="sm:hidden">Salir</span>
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

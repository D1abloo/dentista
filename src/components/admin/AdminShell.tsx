import { useEffect, useState, type ReactNode } from 'react';
import { LogOut, Menu } from 'lucide-react';
import { AdminStaffSetup } from '@/components/auth/AdminStaffSetup';
import { useLogout } from '@/components/auth/RoleGate';
import { isClientLiveMode } from '@/lib/appMode';
import { useDemoStore } from '@/hooks/useDemoStore';
import { useTenant } from '@/hooks/useTenant';
import { getStaffProfile, organizationDisplayName, organizationSubtitle } from '@/lib/organization';
import { getStoredTenantId, settingsFor } from '@/lib/demoStore';
import { AdminSearch } from './AdminSearch';
import { adminNav } from './nav';
import { adminCompactNav } from './adminCompactNav';
import { isNavItemVisible } from '@/lib/adminNav';
import { useStaffContext } from '@/hooks/useStaffContext';
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
  staffRole,
  onNav,
  onLogout,
  variant,
  compact
}: {
  path: string;
  tenant: { id: string; name: string; subtitle: string };
  userLabel: string;
  clinicLogoUrl: string;
  platformInspect: boolean;
  staffRole?: string;
  onNav: () => void;
  onLogout: () => void;
  variant: 'drawer' | 'rail';
  compact?: boolean;
}) {
  const navSource = compact ? adminCompactNav : adminNav;
  const visibleNav = navSource.filter((item) => isNavItemVisible(item.view, staffRole));
  const cls =
    variant === 'drawer'
      ? `portal-rail portal-rail--admin portal-rail--drawer${compact ? ' portal-rail--compact' : ''}`
      : `portal-rail portal-rail--admin${compact ? ' portal-rail--compact' : ''}`;
  return (
    <aside className={cls}>
      <a href="/admin" className={`admin-brand no-underline${compact ? ' admin-brand--compact' : ' mb-6 px-2'}`} onClick={onNav}>
        <span className="clinic-brand-logo-shine admin-brand__clinic-logo-wrap">
          <img src={clinicLogoUrl} alt="" className="admin-brand__clinic-logo clinic-brand-logo-shine__img" width={56} height={56} />
        </span>
        <span className="admin-brand__label">Dentista+</span>
      </a>
      {!compact ? (
        <div className="admin-org-card mb-4">
          <p className="admin-org-card__name">{tenant.name}</p>
          <p className="admin-org-card__sub">{tenant.subtitle}</p>
          <p className="admin-org-card__user">{userLabel}</p>
        </div>
      ) : null}
      <nav className="portal-rail__nav flex-1 overflow-y-auto">
        {visibleNav.map((item) => {
          const active = path === item.href || (item.href !== '/admin' && path.startsWith(item.href));
          const notify = 'notifyDot' in item && item.notifyDot;
          return (
            <a
              key={`${item.href}-${item.label}`}
              href={item.href}
              onClick={() => {
                if (platformInspect) logInspectNav(item.href, item.label);
                onNav();
              }}
              className={`rail-link rail-link--admin ${active ? 'rail-link--active' : ''}`}
              title={item.label}
            >
              <span className="rail-link__icon-wrap">
                <item.icon className="h-5 w-5" />
                {notify ? <span className="rail-link__dot" aria-label="Avisos pendientes" /> : null}
              </span>
              <span className="rail-link__text">{item.label}</span>
            </a>
          );
        })}
      </nav>
      {!compact ? (
        <a href="/" className="rail-link rail-link--admin text-white/50" onClick={onNav}>
          ← Inicio público
        </a>
      ) : null}
      <button type="button" className="admin-logout-btn mt-2" onClick={onLogout}>
        <LogOut className="h-4 w-4" /> Cerrar sesión
      </button>
    </aside>
  );
}

export function AdminShell({
  title,
  subtitle,
  children,
  dashboardToolbar,
  agendaModule = false,
  compactNav = true
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  dashboardToolbar?: ReactNode;
  agendaModule?: boolean;
  compactNav?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const path = typeof window !== 'undefined' ? window.location.pathname : '';
  const logout = useLogout();
  const scope = useTenant();
  const { state, dataSource } = useDemoStore();
  const live = isClientLiveMode();
  const tenantId = scope.tenantId || getStoredTenantId();
  const [sessionName, setSessionName] = useState('');
  const [sessionStaffRole, setSessionStaffRole] = useState<string | undefined>();
  const [platformInspect, setPlatformInspect] = useState(false);
  const { staff } = useStaffContext();
  const staffRole = staff?.role ?? sessionStaffRole;
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
      .then((j: { data?: { name?: string; email?: string; staffRole?: string; role?: string; platformInspect?: boolean; inspectMode?: string } }) => {
        if (j.data?.name) setSessionName(j.data.name);
        else if (j.data?.email) setSessionName(j.data.email);
        setSessionStaffRole(j.data?.staffRole ?? j.data?.role);
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
        staffRole={staffRole}
        onNav={close}
        onLogout={logout}
        variant="rail"
        compact={compactNav}
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
              staffRole={staffRole}
              onNav={close}
              onLogout={logout}
              variant="drawer"
              compact={compactNav}
            />
          </div>
        </div>
      ) : null}
      <div className="portal-main">
        <header className={`portal-top portal-top--admin admin-topbar${dashboardToolbar ? ' admin-topbar--dashboard' : ''}`}>
          <div className="admin-topbar__brand">
            <div className="admin-topbar__title-wrap">
              <span className="admin-topbar__accent" aria-hidden />
              <h1 className="admin-topbar__title">{title}</h1>
            </div>
            {subtitle ? <p className="admin-topbar__subtitle">{subtitle}</p> : null}
          </div>

          {dashboardToolbar ? (
            <div className="admin-topbar__dashboard-tools">{dashboardToolbar}</div>
          ) : (
            <>
              <div className="admin-topbar__search">
                <AdminSearch />
              </div>
              <div className="admin-topbar__actions">
                <AdminQuickAccess />
                <div className="hidden lg:block">
                  <ClinicBranchSwitcher />
                </div>
                <button type="button" className="admin-logout-btn admin-logout-btn--compact" onClick={logout}>
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Cerrar sesión</span>
                  <span className="sm:hidden">Salir</span>
                </button>
              </div>
            </>
          )}

          <button type="button" className="pub-menu-btn lg:hidden admin-topbar__menu" onClick={() => setOpen(true)} aria-label="Menú">
            <Menu className="h-5 w-5" />
          </button>
        </header>
        <main
          className={`portal-body portal-body--corp portal-body--admin${dashboardToolbar ? ' portal-body--dashboard' : ''}${agendaModule ? ' portal-body--agenda-module' : ''}`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

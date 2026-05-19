import { useState, type ReactNode } from 'react';
import { LogOut, Menu, Shield } from 'lucide-react';
import { LogoMark } from '@/components/brand/Logo';
import { useLogout } from '@/components/auth/RoleGate';
import { useDemoStore } from '@/hooks/useDemoStore';
import { useTenant } from '@/hooks/useTenant';
import { GlobalIdSearch } from '@/components/shared/GlobalIdSearch';
import { IdBadge } from '@/components/ui/IdBadge';
import { adminNav } from './nav';

function AdminRail({
  path,
  tenant,
  onNav,
  onLogout,
  variant
}: {
  path: string;
  tenant: { id: string; name: string };
  onNav: () => void;
  onLogout: () => void;
  variant: 'drawer' | 'rail';
}) {
  const cls =
    variant === 'drawer'
      ? 'portal-rail portal-rail--admin fixed z-50 flex lg:hidden'
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
          <p className="text-sm font-bold">{tenant.name}</p>
        </div>
        <IdBadge id={tenant.id} kind="tenant" />
        <p className="mt-2 text-[0.65rem] text-white/60">Solo datos de esta clínica</p>
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

export function AdminShell({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const path = typeof window !== 'undefined' ? window.location.pathname : '';
  const logout = useLogout();
  const scope = useTenant();
  const { dataSource, syncing } = useDemoStore();
  const tenant = scope.tenant ?? { id: scope.tenantId, name: 'Clínica' };
  const close = () => setOpen(false);

  return (
    <div className="portal portal--admin">
      <AdminRail path={path} tenant={tenant} onNav={close} onLogout={logout} variant="rail" />
      {open ? (
        <div className="fixed inset-0 z-50 bg-black/40 lg:hidden" onClick={close}>
          <div onClick={(e) => e.stopPropagation()}>
            <AdminRail path={path} tenant={tenant} onNav={close} onLogout={logout} variant="drawer" />
          </div>
        </div>
      ) : null}
      <div className="portal-main">
        <header className="portal-top">
          <div>
            <h1 className="portal-top__title">{title}</h1>
            <p className="text-xs font-semibold text-[var(--muted)]">{tenant.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:block">
              <GlobalIdSearch />
            </div>
            <button type="button" className="pub-menu-btn lg:hidden" onClick={() => setOpen(true)} aria-label="Menú">
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </header>
        <main className="portal-body">
          <div className="tenant-banner tenant-banner--admin mb-5 flex flex-wrap items-center gap-2">
            <span>Estás gestionando únicamente</span>
            <strong>{tenant.name}</strong>
            <IdBadge id={tenant.id} kind="tenant" />
            {dataSource === 'supabase' ? (
              <span className="ml-auto text-xs font-semibold text-teal-700">
                {syncing ? 'Guardando en Supabase…' : 'Datos en Supabase'}
              </span>
            ) : null}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}

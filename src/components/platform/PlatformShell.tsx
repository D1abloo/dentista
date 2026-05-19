import { useState, type ReactNode } from 'react';
import { Building2, ClipboardList, LayoutDashboard, LifeBuoy, LogOut, Menu, Shield } from 'lucide-react';
import { LogoMark } from '@/components/brand/Logo';
import { useLogout } from '@/components/auth/RoleGate';

const nav = [
  { href: '/platform', label: 'Resumen', icon: LayoutDashboard },
  { href: '/platform/clinicas', label: 'Clínicas', icon: Building2 },
  { href: '/platform/registros', label: 'Registros', icon: ClipboardList },
  { href: '/platform/soporte', label: 'Soporte', icon: LifeBuoy }
];

export function PlatformShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const path = typeof window !== 'undefined' ? window.location.pathname : '';
  const logout = useLogout();

  const rail = (variant: 'rail' | 'drawer') => (
    <aside className={variant === 'drawer' ? 'portal-rail portal-rail--admin portal-rail--drawer' : 'portal-rail portal-rail--admin'}>
      <a href="/platform" className="mb-6 flex items-center gap-2 px-2 no-underline">
        <LogoMark size={36} />
        <span className="font-[family-name:var(--display)] text-white">Dentista+</span>
      </a>
      <div className="mb-4 rounded-xl bg-white/10 p-3 text-white">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-[var(--warn)]" />
          <div>
            <p className="text-sm font-bold">Super Admin</p>
            <p className="text-xs text-white/70">Plataforma global</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto">
        {nav.map((item) => {
          const active = path === item.href;
          return (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`rail-link rail-link--admin ${active ? 'rail-link--active' : ''}`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </a>
          );
        })}
      </nav>
      <a href="/" className="rail-link rail-link--admin text-white/50">
        ← Sitio público
      </a>
      <button type="button" className="rail-link rail-link--admin mt-1 w-full border-0 bg-transparent" onClick={logout}>
        <LogOut className="h-4 w-4" /> Salir
      </button>
    </aside>
  );

  return (
    <div className="portal portal--admin">
      {rail('rail')}
      {open ? (
        <div className="portal-drawer-backdrop lg:hidden" role="presentation" onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()}>{rail('drawer')}</div>
        </div>
      ) : null}
      <div className="portal-main">
        <header className="portal-top portal-top--admin">
          <div>
            <div className="portal-top__row">
              <h1 className="portal-top__title">{title}</h1>
              <span className="live-pill">PRODUCCIÓN</span>
            </div>
            {subtitle ? <p className="portal-top__sub">{subtitle}</p> : null}
          </div>
          <button type="button" className="pub-menu-btn lg:hidden" onClick={() => setOpen(true)} aria-label="Menú">
            <Menu className="h-5 w-5" />
          </button>
        </header>
        <main className="portal-body portal-body--admin">{children}</main>
      </div>
    </div>
  );
}

import type { ReactNode } from 'react'
import { LogOut, Menu, PanelLeftClose, PanelLeftOpen, Search } from 'lucide-react'
import { Button } from '@/frontend/ds'
import { PortalSwitcherV2 } from '@/frontend/features/shared/PortalSwitcherV2'
import { ShellBreadcrumbs } from './ShellSidebar'

const ShellSearch = ({ placeholder }: { placeholder?: string }) => {
  const [query, setQuery] = useState('')
  return (
    <label className="relative hidden min-w-0 flex-1 md:flex md:max-w-sm">
      <span className="sr-only">Búsqueda</span>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder ?? 'Buscar en el panel…'}
        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-3 text-sm text-slate-800 placeholder:text-slate-400 transition-colors focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/25"
      />
    </label>
  )
}

export const ShellTopbar = ({
  pageTitle,
  breadcrumbRoot,
  collapsed,
  onToggleSidebar,
  onOpenDrawer,
  onLogout,
  userLabel,
  showPortalSwitcher = true,
  topSlot,
  searchPlaceholder
}: {
  pageTitle: string
  breadcrumbRoot: { label: string; href: string }
  collapsed: boolean
  onToggleSidebar: () => void
  onOpenDrawer: () => void
  onLogout: () => void
  userLabel?: string
  showPortalSwitcher?: boolean
  topSlot?: ReactNode
  searchPlaceholder?: string
}) => (
  <header className="pf-glass sticky top-0 z-30 flex h-[var(--pf-topbar-height)] items-center gap-3 px-4 sm:px-6">
    <Button
      variant="ghost"
      size="sm"
      className="lg:hidden"
      onClick={onOpenDrawer}
      aria-label="Abrir menú de navegación"
    >
      <Menu className="h-5 w-5" />
    </Button>
    <Button
      variant="ghost"
      size="sm"
      className="hidden lg:inline-flex"
      onClick={onToggleSidebar}
      aria-label={collapsed ? 'Expandir menú lateral' : 'Contraer menú lateral'}
      aria-pressed={collapsed}
    >
      {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
    </Button>
    {topSlot ?? <ShellBreadcrumbs root={breadcrumbRoot} current={pageTitle} />}
    <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-3">
      <ShellSearch placeholder={searchPlaceholder} />
      {showPortalSwitcher ? <PortalSwitcherV2 /> : null}
      {userLabel ? (
        <div className="hidden text-right sm:block">
          <p className="max-w-[10rem] truncate text-xs font-semibold text-slate-800">{userLabel}</p>
        </div>
      ) : null}
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-emerald-600 text-xs font-bold text-white ring-2 ring-white">
        {userLabel?.slice(0, 2).toUpperCase() ?? 'AC'}
      </span>
      <Button variant="ghost" size="sm" onClick={onLogout} aria-label="Cerrar sesión">
        <LogOut className="h-4 w-4" aria-hidden />
        <span className="hidden sm:inline">Salir</span>
      </Button>
    </div>
  </header>
)

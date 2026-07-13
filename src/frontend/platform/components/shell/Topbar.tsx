import { Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { Button } from '@/frontend/ds'
import { PortalSwitcherV2 } from '@/frontend/features/shared/PortalSwitcherV2'
import type { PlatformView } from '@/frontend/features/platform/nav'
import { Breadcrumbs } from './Breadcrumbs'
import { GlobalSearch } from './GlobalSearch'
import { NotificationCenter } from './NotificationCenter'
import { OrgSelector, UserMenu } from './UserMenu'

export const Topbar = ({
  view,
  collapsed,
  onToggleSidebar,
  onOpenDrawer,
  onLogout
}: {
  view: PlatformView
  collapsed: boolean
  onToggleSidebar: () => void
  onOpenDrawer: () => void
  onLogout: () => void
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
    <Breadcrumbs view={view} />
    <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-3">
      <GlobalSearch />
      <OrgSelector />
      <NotificationCenter />
      <PortalSwitcherV2 />
      <UserMenu onLogout={onLogout} />
    </div>
  </header>
)

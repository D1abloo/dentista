import { useEffect, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/frontend/lib/cn'
import { Button } from '@/frontend/ds'
import { useSidebarState } from '@/frontend/shell/hooks/useSidebarState'
import { useMediaQuery } from '@/frontend/shell/hooks/useMediaQuery'
import { PortalBrand } from '@/frontend/shell/components/PortalBrand'
import { ShellSidebarNav, type PortalNavGroup } from '@/frontend/shell/components/ShellSidebar'
import { ShellTopbar } from '@/frontend/shell/components/ShellTopbar'
import '@/frontend/platform/styles/tokens.css'

export type PortalNavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  active?: boolean
}

export type { PortalNavGroup }

type PortalShellProps = {
  brand: string
  subtitle?: string
  nav: PortalNavItem[]
  navGroups?: PortalNavGroup[]
  pageTitle?: string
  breadcrumbRoot?: { label: string; href: string }
  sidebarStorageKey?: string
  userLabel?: string
  children: ReactNode
  onLogout: () => void
  showPortalSwitcher?: boolean
  topSlot?: ReactNode
  searchPlaceholder?: string
}

export const PortalShell = ({
  brand,
  subtitle,
  nav,
  navGroups,
  pageTitle,
  breadcrumbRoot = { label: 'Panel', href: '#' },
  sidebarStorageKey = 'ac_portal_sidebar_collapsed',
  userLabel,
  children,
  onLogout,
  showPortalSwitcher = true,
  topSlot,
  searchPlaceholder
}: PortalShellProps) => {
  const { collapsed, toggle, ready } = useSidebarState(sidebarStorageKey)
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [drawer, setDrawer] = useState(false)

  useEffect(() => {
    if (isDesktop) setDrawer(false)
  }, [isDesktop])

  if (!ready) {
    return <div className="pf-shell min-h-dvh animate-pulse bg-slate-100" aria-busy="true" />
  }

  const title = pageTitle ?? brand
  const root = breadcrumbRoot.href === '#' ? { label: brand, href: nav[0]?.href ?? '/' } : breadcrumbRoot

  return (
    <div className="pf-shell flex min-h-dvh">
      <a href="#portal-main" className="nx-skip">
        Ir al contenido del panel
      </a>

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-[var(--pf-z-sidebar)] hidden border-r border-slate-800/50 lg:block',
          'transition-[width] duration-[var(--pf-duration-slow)] ease-out',
          collapsed ? 'w-[var(--pf-sidebar-collapsed)]' : 'w-[var(--pf-sidebar-width)]'
        )}
        style={{ background: 'var(--pf-sidebar-bg)' }}
        aria-label="Barra lateral"
      >
        <div className="flex h-full flex-col">
          <div
            className={cn(
              'flex h-[var(--pf-topbar-height)] items-center border-b border-white/10 px-3',
              collapsed ? 'justify-center' : 'px-4'
            )}
          >
            <PortalBrand brand={brand} subtitle={subtitle} collapsed={collapsed} />
          </div>
          <ShellSidebarNav collapsed={collapsed} nav={nav} navGroups={navGroups} />
        </div>
      </aside>

      {drawer ? (
        <div className="fixed inset-0 z-[var(--pf-z-drawer)] lg:hidden" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            aria-label="Cerrar menú"
            onClick={() => setDrawer(false)}
          />
          <aside
            className="relative z-10 flex h-full w-[var(--pf-sidebar-width)] flex-col shadow-2xl"
            style={{
              background: 'var(--pf-sidebar-bg)',
              animation: 'pfSlideInLeft 280ms var(--pf-ease-spring) both'
            }}
          >
            <div className="flex justify-end p-2">
              <Button variant="ghost" size="sm" onClick={() => setDrawer(false)} aria-label="Cerrar menú">
                <X className="h-5 w-5 text-white" />
              </Button>
            </div>
            <div className="px-4 pb-2">
              <PortalBrand brand={brand} subtitle={subtitle} />
            </div>
            <ShellSidebarNav
              collapsed={false}
              nav={nav}
              navGroups={navGroups}
              onNavigate={() => setDrawer(false)}
            />
          </aside>
        </div>
      ) : null}

      <div
        className={cn(
          'flex min-w-0 flex-1 flex-col transition-[margin] duration-[var(--pf-duration-slow)] ease-out',
          collapsed ? 'lg:ml-[var(--pf-sidebar-collapsed)]' : 'lg:ml-[var(--pf-sidebar-width)]'
        )}
      >
        <ShellTopbar
          pageTitle={title}
          breadcrumbRoot={root}
          collapsed={collapsed}
          onToggleSidebar={toggle}
          onOpenDrawer={() => setDrawer(true)}
          onLogout={onLogout}
          userLabel={userLabel}
          showPortalSwitcher={showPortalSwitcher}
          topSlot={topSlot}
          searchPlaceholder={searchPlaceholder}
        />
        <main id="portal-main" className="mx-auto w-full max-w-[var(--pf-content-max)] flex-1">
          {children}
        </main>
      </div>

      <style>{`
        @keyframes pfSlideInLeft {
          from { transform: translateX(-100%); opacity: 0.9; }
          to { transform: translateX(0); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          aside[style*='pfSlideInLeft'] { animation: none !important; }
        }
      `}</style>
    </div>
  )
}

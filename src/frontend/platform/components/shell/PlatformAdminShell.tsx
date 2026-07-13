import { useEffect, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/frontend/ds'
import { cn } from '@/frontend/lib/cn'
import { useSidebarState } from '../../hooks/useSidebarState'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { viewFromPath } from '../../nav/groups'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export const PlatformAdminShell = ({
  children,
  onLogout
}: {
  children: ReactNode
  onLogout: () => void
}) => {
  const { collapsed, toggle, ready } = useSidebarState()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [drawer, setDrawer] = useState(false)
  const [view, setView] = useState(viewFromPath('/platform'))

  useEffect(() => {
    setView(viewFromPath(window.location.pathname))
  }, [])

  useEffect(() => {
    if (isDesktop) setDrawer(false)
  }, [isDesktop])

  if (!ready) {
    return <div className="pf-shell min-h-dvh animate-pulse bg-slate-100" aria-busy="true" />
  }

  return (
    <div className="pf-shell flex min-h-dvh">
      <a href="#pf-main" className="nx-skip">
        Ir al contenido principal
      </a>

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-[var(--pf-z-sidebar)] hidden border-r border-slate-800/50 lg:block',
          'bg-[var(--pf-sidebar-solid)] transition-[width] duration-[var(--pf-duration-slow)] ease-out',
          collapsed ? 'w-[var(--pf-sidebar-collapsed)]' : 'w-[var(--pf-sidebar-width)]'
        )}
        style={{ background: 'var(--pf-sidebar-bg)' }}
        aria-label="Barra lateral"
      >
        <Sidebar collapsed={collapsed} />
      </aside>

      {drawer ? (
        <div className="fixed inset-0 z-[var(--pf-z-drawer)] lg:hidden" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            aria-label="Cerrar menú"
            onClick={() => setDrawer(false)}
          />
          <aside
            className={cn(
              'relative z-10 flex h-full w-[var(--pf-sidebar-width)] flex-col shadow-2xl',
              'animate-[slideIn_280ms_var(--pf-ease-spring)_both]'
            )}
            style={{ background: 'var(--pf-sidebar-bg)' }}
          >
            <div className="flex justify-end p-2">
              <Button variant="ghost" size="sm" onClick={() => setDrawer(false)} aria-label="Cerrar menú">
                <X className="h-5 w-5 text-white" />
              </Button>
            </div>
            <Sidebar collapsed={false} onNavigate={() => setDrawer(false)} />
          </aside>
        </div>
      ) : null}

      <div
        className={cn(
          'flex min-w-0 flex-1 flex-col transition-[margin] duration-[var(--pf-duration-slow)] ease-out',
          collapsed ? 'lg:ml-[var(--pf-sidebar-collapsed)]' : 'lg:ml-[var(--pf-sidebar-width)]'
        )}
      >
        <Topbar
          view={view}
          collapsed={collapsed}
          onToggleSidebar={toggle}
          onOpenDrawer={() => setDrawer(true)}
          onLogout={onLogout}
        />
        <main id="pf-main" className="mx-auto w-full max-w-[var(--pf-content-max)] flex-1">
          {children}
        </main>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(-100%); opacity: 0.9; }
          to { transform: translateX(0); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-\\[slideIn_280ms_var\\(--pf-ease-spring\\)_both\\] {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  )
}

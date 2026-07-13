import { useEffect, useState, type ReactNode } from 'react'
import { LogOut, Menu, X } from 'lucide-react'
import { cn } from '@/frontend/lib/cn'
import { Button } from '@/frontend/ds'
import { PortalSwitcherV2 } from '@/frontend/features/shared/PortalSwitcherV2'

export type PortalNavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  active?: boolean
}

type PortalShellProps = {
  brand: string
  subtitle?: string
  nav: PortalNavItem[]
  userLabel?: string
  children: ReactNode
  onLogout: () => void
  showPortalSwitcher?: boolean
  topSlot?: ReactNode
}

export const PortalShell = ({
  brand,
  subtitle,
  nav,
  userLabel,
  children,
  onLogout,
  showPortalSwitcher = true,
  topSlot
}: PortalShellProps) => {
  const [drawer, setDrawer] = useState(false)
  const [path, setPath] = useState('')

  useEffect(() => {
    setPath(window.location.pathname)
  }, [])

  const NavList = ({ onPick }: { onPick?: () => void }) => (
    <ul className="space-y-1">
      {nav.map((item) => {
        const Icon = item.icon
        const active = item.active ?? (path === item.href || path.startsWith(`${item.href}/`))
        return (
          <li key={item.href}>
            <a
              href={item.href}
              onClick={onPick}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                active
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {item.label}
            </a>
          </li>
        )
      })}
    </ul>
  )

  return (
    <div className="min-h-dvh bg-slate-50">
      <a href="#portal-main" className="nx-skip">
        Ir al contenido del panel
      </a>

      <div className="flex min-h-dvh">
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:block">
          <div className="flex h-16 items-center border-b border-slate-100 px-4">
            <div>
              <p className="font-display text-sm font-semibold text-ink">{brand}</p>
              {subtitle ? <p className="text-xs text-slate-500">{subtitle}</p> : null}
            </div>
          </div>
          <nav className="p-3" aria-label="Panel">
            <NavList />
          </nav>
        </aside>

        {drawer ? (
          <div className="fixed inset-0 z-50 lg:hidden" role="presentation">
            <button
              type="button"
              className="absolute inset-0 bg-slate-900/40"
              aria-label="Cerrar menú"
              onClick={() => setDrawer(false)}
            />
            <aside className="relative z-10 flex h-full w-72 flex-col bg-white shadow-xl">
              <div className="flex h-16 items-center justify-between border-b px-4">
                <span className="font-semibold text-ink">{brand}</span>
                <Button variant="ghost" size="sm" onClick={() => setDrawer(false)} aria-label="Cerrar">
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <nav className="flex-1 overflow-y-auto p-3">
                <NavList onPick={() => setDrawer(false)} />
              </nav>
            </aside>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setDrawer(true)}
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </Button>
            {topSlot}
            <div className="ml-auto flex items-center gap-2">
              {showPortalSwitcher ? <PortalSwitcherV2 /> : null}
              {userLabel ? (
                <span className="hidden text-sm text-slate-600 sm:inline">{userLabel}</span>
              ) : null}
              <Button variant="ghost" size="sm" onClick={onLogout} aria-label="Cerrar sesión">
                <LogOut className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">Salir</span>
              </Button>
            </div>
          </header>

          <main id="portal-main" className="flex-1 p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { cn } from '@/frontend/lib/cn'
import { platformNavGroups, type NavItem } from '../../nav/groups'
import { BrandLogo } from '../brand/BrandLogo'

const isActive = (path: string, href: string) =>
  path === href ||
  (href !== '/platform' && path.startsWith(`${href}/`)) ||
  (href === '/platform' && path === '/platform')

export const Sidebar = ({
  collapsed,
  onNavigate
}: {
  collapsed: boolean
  onNavigate?: () => void
}) => {
  const [path, setPath] = useState('/platform')

  useEffect(() => {
    setPath(window.location.pathname)
  }, [])

  const renderItem = (item: NavItem) => {
    const Icon = item.icon
    const active = isActive(path, item.href)
    return (
      <li key={item.href}>
        <a
          href={item.href}
          onClick={onNavigate}
          aria-current={active ? 'page' : undefined}
          className={cn(
            'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-[var(--pf-duration)]',
            active
              ? 'bg-gradient-to-r from-cyan-600/90 to-emerald-600/90 text-white shadow-md shadow-cyan-900/20'
              : 'text-[var(--pf-sidebar-text)] hover:bg-[var(--pf-sidebar-hover)] hover:text-white'
          )}
        >
          <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
          {!collapsed ? <span className="truncate">{item.label}</span> : null}
          {collapsed ? (
            <span className="pf-sidebar-tooltip" role="tooltip">
              {item.label}
            </span>
          ) : null}
        </a>
      </li>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          'flex h-[var(--pf-topbar-height)] items-center border-b border-white/10 px-3',
          collapsed ? 'justify-center' : 'px-4'
        )}
      >
        <BrandLogo collapsed={collapsed} />
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-4" aria-label="Menú de plataforma">
        {platformNavGroups.map((group) => (
          <div key={group.id} className="mb-5 last:mb-0">
            {!collapsed ? (
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--pf-sidebar-muted)]">
                {group.label}
              </p>
            ) : (
              <div className="mx-auto mb-2 h-px w-6 bg-white/10" aria-hidden />
            )}
            <ul className="space-y-0.5">{group.items.map(renderItem)}</ul>
          </div>
        ))}
      </nav>
    </div>
  )
}

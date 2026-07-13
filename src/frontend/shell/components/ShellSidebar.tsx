import { useEffect, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import type { PortalNavItem } from '@/frontend/layouts/PortalShell'

export const ShellBreadcrumbs = ({
  root,
  current
}: {
  root: { label: string; href: string }
  current: string
}) => {
  const [path, setPath] = useState('')

  useEffect(() => {
    setPath(window.location.pathname)
  }, [])

  return (
    <nav aria-label="Ruta de navegación" className="hidden min-w-0 sm:block">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-slate-500">
        <li>
          <a href={root.href} className="hover:text-brand-700">
            {root.label}
          </a>
        </li>
        {current !== root.label ? (
          <li className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" aria-hidden />
            <span className="truncate font-medium text-slate-800" aria-current="page">
              {current}
            </span>
          </li>
        ) : null}
        {path && path !== root.href && current === root.label ? null : null}
      </ol>
    </nav>
  )
}

export type PortalNavGroup = {
  id: string
  label: string
  items: PortalNavItem[]
}

export const ShellSidebarNav = ({
  collapsed,
  nav,
  navGroups,
  onNavigate
}: {
  collapsed: boolean
  nav: PortalNavItem[]
  navGroups?: PortalNavGroup[]
  onNavigate?: () => void
}) => {
  const [path, setPath] = useState('')

  useEffect(() => {
    setPath(window.location.pathname)
  }, [])

  const renderItem = (item: PortalNavItem) => {
    const Icon = item.icon
    const active = item.active ?? (path === item.href || path.startsWith(`${item.href}/`))
    return (
      <li key={item.href}>
        <a
          href={item.href}
          onClick={onNavigate}
          aria-current={active ? 'page' : undefined}
          className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-[var(--pf-duration)] ${
            active
              ? 'bg-gradient-to-r from-cyan-600/90 to-emerald-600/90 text-white shadow-md shadow-cyan-900/20'
              : 'text-[var(--pf-sidebar-text)] hover:bg-[var(--pf-sidebar-hover)] hover:text-white'
          }`}
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

  const groups = navGroups?.length
    ? navGroups
    : [{ id: 'main', label: '', items: nav }]

  return (
    <nav className="flex-1 overflow-y-auto px-2 py-4" aria-label="Menú del panel">
      {groups.map((group) => (
        <div key={group.id} className="mb-5 last:mb-0">
          {!collapsed && group.label ? (
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--pf-sidebar-muted)]">
              {group.label}
            </p>
          ) : collapsed && group.label ? (
            <div className="mx-auto mb-2 h-px w-6 bg-white/10" aria-hidden />
          ) : null}
          <ul className="space-y-0.5">{group.items.map(renderItem)}</ul>
        </div>
      ))}
    </nav>
  )
}

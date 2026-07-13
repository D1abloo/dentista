import { useEffect, useState, type ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { platformTitles, type PlatformView } from '@/frontend/features/platform/nav'
import { cn } from '@/frontend/lib/cn'

export const Breadcrumbs = ({ view }: { view: PlatformView }) => {
  const [path, setPath] = useState('/platform')

  useEffect(() => {
    setPath(window.location.pathname)
  }, [])

  const crumbs =
    view === 'overview'
      ? [{ label: 'Plataforma', href: '/platform' }]
      : [
          { label: 'Plataforma', href: '/platform' },
          { label: platformTitles[view], href: path }
        ]

  return (
    <nav aria-label="Ruta de navegación" className="hidden sm:block">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-slate-500">
        {crumbs.map((crumb, index) => (
          <li key={crumb.href} className="flex items-center gap-1">
            {index > 0 ? <ChevronRight className="h-3.5 w-3.5 text-slate-400" aria-hidden /> : null}
            {index === crumbs.length - 1 ? (
              <span className="font-medium text-slate-800" aria-current="page">
                {crumb.label}
              </span>
            ) : (
              <a href={crumb.href} className="hover:text-brand-700">
                {crumb.label}
              </a>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export const PageHeaderBlock = ({
  title,
  description,
  actions
}: {
  title: string
  description?: string
  actions?: ReactNode
}) => (
  <header
    className={cn(
      'pf-fade-in flex flex-col gap-4 border-b border-slate-200 bg-white px-4 py-5 sm:px-6 lg:flex-row lg:items-start lg:justify-between'
    )}
  >
    <div className="min-w-0">
      <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{title}</h1>
      {description ? <p className="mt-1 max-w-2xl text-sm text-slate-600">{description}</p> : null}
    </div>
    {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
  </header>
)

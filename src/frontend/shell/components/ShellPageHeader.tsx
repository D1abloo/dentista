import type { ReactNode } from 'react'
import { cn } from '@/frontend/lib/cn'

export const ShellPageHeader = ({
  title,
  description,
  actions,
  className
}: {
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}) => (
  <header
    className={cn(
      'pf-animate-in flex flex-col gap-4 border-b border-slate-200 bg-white px-4 py-5 sm:px-6 lg:flex-row lg:items-start lg:justify-between',
      className
    )}
  >
    <div className="min-w-0">
      <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{title}</h1>
      {description ? <p className="mt-1 max-w-2xl text-sm text-slate-600">{description}</p> : null}
    </div>
    {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
  </header>
)

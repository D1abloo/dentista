import type { ReactNode } from 'react'
import { cn } from '@/frontend/lib/cn'

export const Container = ({
  children,
  className,
  as: Tag = 'div',
  size = 'xl'
}: {
  children: ReactNode
  className?: string
  as?: 'div' | 'section' | 'main'
  size?: 'md' | 'lg' | 'xl' | 'full'
}) => {
  const max = { md: 'max-w-3xl', lg: 'max-w-5xl', xl: 'max-w-7xl', full: 'max-w-[1400px]' }[size]
  return (
    <Tag className={cn('mx-auto w-full px-4 sm:px-6 lg:px-8', max, className)}>{children}</Tag>
  )
}

export const PageHeader = ({
  eyebrow,
  title,
  description,
  actions
}: {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
}) => (
  <header className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
    <div>
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">{eyebrow}</p>
      ) : null}
      <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
        {title}
      </h1>
      {description ? <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">{description}</p> : null}
    </div>
    {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
  </header>
)

import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/frontend/lib/cn'

type CardProps = HTMLAttributes<HTMLElement> & {
  as?: 'article' | 'div' | 'section'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  elevated?: boolean
  children: ReactNode
}

const padMap = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8'
}

export const Card = ({
  as: Tag = 'article',
  padding = 'md',
  elevated = false,
  className,
  children,
  ...props
}: CardProps) => (
  <Tag
    className={cn(
      'rounded-2xl border border-slate-200 bg-white',
      elevated && 'shadow-md',
      padMap[padding],
      className
    )}
    {...props}
  >
    {children}
  </Tag>
)

export const CardHeader = ({
  title,
  description,
  action
}: {
  title: string
  description?: string
  action?: ReactNode
}) => (
  <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
    <div>
      <h2 className="font-display text-lg font-semibold text-slate-900">{title}</h2>
      {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
    </div>
    {action}
  </header>
)

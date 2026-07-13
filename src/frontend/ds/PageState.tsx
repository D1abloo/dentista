import type { ReactNode } from 'react'
import { cn } from '@/frontend/lib/cn'

export const Spinner = ({ label = 'Cargando', className }: { label?: string; className?: string }) => (
  <div className={cn('flex flex-col items-center justify-center gap-3 py-12', className)} role="status">
    <span
      className="h-9 w-9 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600"
      aria-hidden
    />
    <span className="text-sm text-slate-600">{label}</span>
  </div>
)

export const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn('animate-pulse rounded-lg bg-slate-200/80', className)} aria-hidden />
)

export type PageStateProps = {
  variant: 'loading' | 'empty' | 'error' | 'offline' | 'forbidden' | 'success'
  title: string
  description?: string
  action?: ReactNode
}

export const PageState = ({ variant, title, description, action }: PageStateProps) => (
  <section
    className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center"
    aria-live="polite"
  >
    {variant === 'loading' ? <Spinner label="" className="py-0" /> : null}
    <h2 className="font-display text-xl font-semibold text-slate-900">{title}</h2>
    {description ? <p className="mt-2 max-w-md text-sm text-slate-600">{description}</p> : null}
    {action ? <div className="mt-6">{action}</div> : null}
  </section>
)

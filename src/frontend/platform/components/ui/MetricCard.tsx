import type { LucideIcon } from 'lucide-react'
import { cn } from '@/frontend/lib/cn'

const Sparkline = ({ points, className }: { points: number[]; className?: string }) => {
  const max = Math.max(...points, 1)
  const coords = points
    .map((p, i) => `${(i / Math.max(points.length - 1, 1)) * 100},${100 - (p / max) * 80}`)
    .join(' ')
  return (
    <svg className={cn('h-8 w-20', className)} viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden>
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={coords}
        className="text-brand-500 opacity-80"
      />
    </svg>
  )
}

export const MetricCard = ({
  label,
  value,
  hint,
  trend,
  trendLabel,
  icon: Icon,
  tone = 'brand',
  sparkline
}: {
  label: string
  value: string | number
  hint?: string
  trend?: 'up' | 'down' | 'neutral'
  trendLabel?: string
  icon: LucideIcon
  tone?: 'brand' | 'emerald' | 'amber' | 'sky'
  sparkline?: number[]
}) => {
  const iconTone = {
    brand: 'bg-brand-50 text-brand-700 ring-brand-100',
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    amber: 'bg-amber-50 text-amber-700 ring-amber-100',
    sky: 'bg-sky-50 text-sky-700 ring-sky-100'
  }[tone]

  const trendClass = {
    up: 'text-emerald-600',
    down: 'text-rose-600',
    neutral: 'text-slate-500'
  }[trend ?? 'neutral']

  return (
    <article className="pf-card pf-card--lift pf-animate-in p-5">
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-2xl ring-1',
            iconTone
          )}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        {sparkline ? <Sparkline points={sparkline} /> : null}
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink">{value}</p>
      <div className="mt-2 flex items-center gap-2 text-xs">
        {trendLabel ? <span className={cn('font-semibold', trendClass)}>{trendLabel}</span> : null}
        {hint ? <span className="text-slate-500">{hint}</span> : null}
      </div>
    </article>
  )
}

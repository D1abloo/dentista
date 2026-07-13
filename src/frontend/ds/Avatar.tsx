import { cn } from '@/frontend/lib/cn'

const tones = {
  brand: 'bg-brand-100 text-brand-800',
  slate: 'bg-slate-100 text-slate-700',
  emerald: 'bg-emerald-100 text-emerald-800',
  sky: 'bg-sky-100 text-sky-800',
  amber: 'bg-amber-100 text-amber-900',
  rose: 'bg-rose-100 text-rose-800'
} as const

export const Avatar = ({
  name,
  size = 'md',
  className
}: {
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) => {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const toneKey = (['brand', 'slate', 'emerald', 'sky', 'amber', 'rose'] as const)[
    name.length % 6
  ]

  const sizeClass = {
    sm: 'h-8 w-8 text-[10px]',
    md: 'h-10 w-10 text-xs',
    lg: 'h-12 w-12 text-sm'
  }[size]

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-bold ring-2 ring-white',
        tones[toneKey],
        sizeClass,
        className
      )}
      aria-hidden
    >
      {initials || '?'}
    </span>
  )
}

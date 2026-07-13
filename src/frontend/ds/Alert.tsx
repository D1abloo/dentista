import type { ReactNode } from 'react'
import { AlertCircle, CheckCircle2, Info, WifiOff } from 'lucide-react'
import { cn } from '@/frontend/lib/cn'

type AlertTone = 'info' | 'success' | 'warning' | 'danger' | 'offline'

const config: Record<AlertTone, { icon: typeof Info; className: string }> = {
  info: { icon: Info, className: 'border-sky-200 bg-sky-50 text-sky-950' },
  success: { icon: CheckCircle2, className: 'border-emerald-200 bg-emerald-50 text-emerald-950' },
  warning: { icon: AlertCircle, className: 'border-amber-200 bg-amber-50 text-amber-950' },
  danger: { icon: AlertCircle, className: 'border-red-200 bg-red-50 text-red-950' },
  offline: { icon: WifiOff, className: 'border-slate-300 bg-slate-100 text-slate-800' }
}

export const Alert = ({
  tone = 'info',
  title,
  children,
  className
}: {
  tone?: AlertTone
  title?: string
  children: ReactNode
  className?: string
}) => {
  const Icon = config[tone].icon
  return (
    <div
      role={tone === 'danger' || tone === 'warning' ? 'alert' : 'status'}
      className={cn('flex gap-3 rounded-xl border p-4 text-sm', config[tone].className, className)}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
      <div>
        {title ? <p className="font-semibold">{title}</p> : null}
        <div className={title ? 'mt-1' : undefined}>{children}</div>
      </div>
    </div>
  )
}

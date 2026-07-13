import type { ReactNode } from 'react'
import { Building2, ChevronRight, LayoutDashboard, UserRound } from 'lucide-react'
import type { PortalChoiceId, PortalChoiceOption } from '@/lib/auth/portalChoices'
import { Button, Card } from '@/frontend/ds'
import { cn } from '@/frontend/lib/cn'

const ICONS = {
  admin: Building2,
  patient: UserRound,
  platform: LayoutDashboard
} as const

export const PortalChoiceList = ({
  email,
  options,
  loading,
  onSelect
}: {
  email: string
  options: PortalChoiceOption[]
  loading: PortalChoiceId | null
  onSelect: (id: PortalChoiceId) => void
}) => (
  <div role="group" aria-labelledby="portal-choice-title">
    <h2 id="portal-choice-title" className="font-display text-lg font-semibold text-ink">
      Elige dónde entrar
    </h2>
    <p className="mt-2 text-sm text-slate-600">
      La cuenta <strong className="text-ink">{email}</strong> tiene varios accesos.
    </p>
    <ul className="mt-4 space-y-2">
      {options.map((option) => {
        const Icon = ICONS[option.id]
        const busy = loading === option.id
        return (
          <li key={option.id}>
            <button
              type="button"
              disabled={Boolean(loading)}
              onClick={() => onSelect(option.id)}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left',
                'transition hover:border-brand-300 hover:bg-brand-50/50',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500'
              )}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-ink">{option.label}</span>
                <span className="block text-sm text-slate-600">{option.description}</span>
              </span>
              <span className="flex items-center gap-1 text-sm font-medium text-brand-700">
                {busy ? 'Entrando…' : 'Continuar'}
                <ChevronRight className="h-4 w-4" aria-hidden />
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  </div>
)

export const AuthCard = ({
  title,
  description,
  children,
  footer
}: {
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
}) => (
  <div className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-brand-50/60 to-white px-4 py-12">
    <Card className="w-full max-w-md" padding="lg" elevated>
      <h1 className="font-display text-2xl font-semibold text-ink">{title}</h1>
      {description ? <p className="mt-2 text-sm text-slate-600">{description}</p> : null}
      <div className="mt-6">{children}</div>
      {footer ? <footer className="mt-6 border-t border-slate-100 pt-4 text-sm">{footer}</footer> : null}
    </Card>
  </div>
)

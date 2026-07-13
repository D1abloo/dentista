import { useEffect, useRef, useState } from 'react'
import { Building2, ChevronDown, LayoutDashboard, Loader2, UserRound } from 'lucide-react'
import type { PortalChoiceId } from '@/lib/auth/portalSwitcherOptions'
import { ensureAdminAccessBeforeRedirect } from '@/lib/clinicCenters'
import { usePortalSwitcher } from '@/hooks/usePortalSwitcher'
import { cn } from '@/frontend/lib/cn'

const META: Record<PortalChoiceId, { label: string; short: string; icon: typeof Building2 }> = {
  admin: { label: 'Panel clínica', short: 'Clínica', icon: Building2 },
  patient: { label: 'Portal paciente', short: 'Paciente', icon: UserRound },
  platform: { label: 'Plataforma SaaS', short: 'Plataforma', icon: LayoutDashboard }
}

export const PortalSwitcherV2 = () => {
  const { options, currentPortal, enabled, loading } = usePortalSwitcher()
  const [open, setOpen] = useState(false)
  const [switching, setSwitching] = useState<PortalChoiceId | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  if (loading || !enabled || options.length < 2) return null

  const currentKey = currentPortal === 'clinic' ? 'admin' : currentPortal
  const CurrentIcon = META[currentKey].icon

  const handleSelect = async (portal: PortalChoiceId) => {
    const active = (portal === 'admin' && currentPortal === 'clinic') || portal === currentPortal
    if (active || switching) return
    setSwitching(portal)
    setOpen(false)
    try {
      const res = await fetch('/api/auth/select-portal', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ portal })
      })
      const json = (await res.json()) as { data?: { redirect?: string }; error?: { message?: string } }
      if (!res.ok) throw new Error(json.error?.message ?? 'No se pudo cambiar de portal.')
      const dest = json.data?.redirect ?? '/'
      if (dest.startsWith('/admin')) {
        try {
          await ensureAdminAccessBeforeRedirect(dest)
        } catch {
          /* gate */
        }
      }
      window.location.href = dest
    } catch {
      setSwitching(null)
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        disabled={Boolean(switching)}
      >
        {switching ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <CurrentIcon className="h-4 w-4" aria-hidden />
        )}
        {META[currentKey].short}
        <ChevronDown className="h-3.5 w-3.5" aria-hidden />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-lift"
        >
          {options.map((option) => {
            const meta = META[option.id]
            const Icon = meta.icon
            const active =
              (option.id === 'admin' && currentPortal === 'clinic') || option.id === currentPortal
            return (
              <button
                key={option.id}
                type="button"
                role="menuitem"
                disabled={Boolean(switching)}
                onClick={() => void handleSelect(option.id)}
                className={cn(
                  'flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left text-sm',
                  active ? 'bg-brand-50 text-brand-900' : 'hover:bg-slate-50'
                )}
              >
                <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>
                  <span className="block font-semibold">{meta.label}</span>
                  <span className="block text-xs text-slate-500">{option.description}</span>
                </span>
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

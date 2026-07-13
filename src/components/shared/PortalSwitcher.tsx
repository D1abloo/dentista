import { useEffect, useRef, useState } from 'react'
import { Building2, ChevronDown, LayoutDashboard, Loader2, UserRound } from 'lucide-react'
import type { PortalChoiceId } from '@/lib/auth/portalSwitcherOptions'
import type { SessionPortal } from '@/lib/auth/sessionPortal'
import { ensureAdminAccessBeforeRedirect } from '@/lib/clinicCenters'
import { usePortalSwitcher } from '@/hooks/usePortalSwitcher'

const PORTAL_META: Record<
  PortalChoiceId,
  { label: string; short: string; icon: typeof Building2 }
> = {
  admin: { label: 'Panel clínica', short: 'Clínica', icon: Building2 },
  patient: { label: 'Portal paciente', short: 'Paciente', icon: UserRound },
  platform: { label: 'Plataforma SaaS', short: 'Plataforma', icon: LayoutDashboard }
}

type Props = {
  variant?: 'topbar' | 'rail'
}

export function PortalSwitcher({ variant = 'topbar' }: Props) {
  const { options, currentPortal, enabled, loading } = usePortalSwitcher()
  const [open, setOpen] = useState(false)
  const [switching, setSwitching] = useState<PortalChoiceId | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    return () => document.removeEventListener('mousedown', onPointer)
  }, [open])

  if (loading || !enabled || options.length < 2) return null

  const handleSelect = async (portal: PortalChoiceId) => {
    const active =
      (portal === 'admin' && currentPortal === 'clinic') || portal === currentPortal
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
          /* gate ya emitido */
        }
      }
      window.location.href = dest
    } catch {
      setSwitching(null)
    }
  }

  if (variant === 'rail') {
    return (
      <div className="portal-switch-rail" ref={wrapRef}>
        <p className="portal-switch-rail__title">Accesos administrador</p>
        <ul className="portal-switch-rail__list">
          {options.map((option) => {
            const meta = PORTAL_META[option.id]
            const Icon = meta.icon
            const active =
              (option.id === 'admin' && currentPortal === 'clinic') || option.id === currentPortal
            return (
              <li key={option.id}>
                <button
                  type="button"
                  className={`portal-switch-rail__btn${active ? ' portal-switch-rail__btn--active' : ''}`}
                  disabled={Boolean(switching)}
                  aria-current={active ? 'true' : undefined}
                  onClick={() => void handleSelect(option.id)}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  <span>{meta.label}</span>
                  {switching === option.id ? (
                    <Loader2 className="ml-auto h-3.5 w-3.5 animate-spin" aria-hidden />
                  ) : null}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    )
  }

  const currentMeta = PORTAL_META[currentPortal === 'clinic' ? 'admin' : currentPortal]

  return (
    <div
      className={`portal-switch${open ? ' portal-switch--open' : ''}${switching ? ' portal-switch--busy' : ''}`}
      ref={wrapRef}
    >
      <button
        type="button"
        className="portal-switch__trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Cambiar de portal"
        disabled={Boolean(switching)}
        onClick={() => setOpen((value) => !value)}
      >
        {switching ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <currentMeta.icon className="h-4 w-4" aria-hidden />
        )}
        <span className="portal-switch__label">{currentMeta.short}</span>
        <ChevronDown className="portal-switch__chev h-3.5 w-3.5" aria-hidden />
      </button>

      {open ? (
        <div className="portal-switch__panel" role="menu" aria-label="Portales disponibles">
          <p className="portal-switch__panel-title">Cambiar de portal</p>
          <ul className="portal-switch__list">
            {options.map((option) => {
              const meta = PORTAL_META[option.id]
              const Icon = meta.icon
              const active =
                (option.id === 'admin' && currentPortal === 'clinic') || option.id === currentPortal
              const busy = switching === option.id
              return (
                <li key={option.id}>
                  <button
                    type="button"
                    role="menuitem"
                    className={`portal-switch__item${active ? ' portal-switch__item--active' : ''}`}
                    disabled={Boolean(switching)}
                    aria-current={active ? 'true' : undefined}
                    onClick={() => void handleSelect(option.id)}
                  >
                    <span className="portal-switch__item-icon" aria-hidden>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="portal-switch__item-text">
                      <strong>{meta.label}</strong>
                      <small>{option.description}</small>
                    </span>
                    {active ? <span className="portal-switch__badge">Activo</span> : null}
                    {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" aria-hidden /> : null}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

/** @deprecated Usar PortalSwitcher */
export const AdminPortalSwitcher = PortalSwitcher

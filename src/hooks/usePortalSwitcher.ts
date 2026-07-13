import { useEffect, useState } from 'react'
import type { PortalChoiceId, PortalChoiceOption } from '@/lib/auth/portalSwitcherOptions'
import { SUPER_ADMIN_PORTAL_OPTIONS } from '@/lib/auth/portalSwitcherOptions'
import type { SessionPortal } from '@/lib/auth/sessionPortal'

type MePayload = {
  baseRole?: string
  portalSwitcher?: {
    enabled: boolean
    currentPortal: SessionPortal
    options: PortalChoiceOption[]
  }
}

export function usePortalSwitcher() {
  const [options, setOptions] = useState<PortalChoiceOption[]>([])
  const [currentPortal, setCurrentPortal] = useState<SessionPortal>('clinic')
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' })
        if (!res.ok) return
        const json = (await res.json()) as { data?: MePayload }
        const data = json.data
        const switcher = data?.portalSwitcher

        if (switcher?.enabled) {
          const opts =
            switcher.options.length >= 2
              ? switcher.options
              : data?.baseRole === 'super_admin'
                ? SUPER_ADMIN_PORTAL_OPTIONS
                : []
          if (opts.length >= 2) {
            setOptions(opts)
            setCurrentPortal(switcher.currentPortal)
            setEnabled(true)
          }
        }
      } catch {
        /* sin switcher */
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return { options, currentPortal, enabled, loading }
}

export type PortalSwitcherState = ReturnType<typeof usePortalSwitcher>

export type PortalSwitchHandler = (portal: PortalChoiceId) => Promise<void>

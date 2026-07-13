import { useAsync } from '@/frontend/hooks/useAsync'
import { PlatformGate } from '@/components/platform/PlatformGate'
import { useLogout } from '@/components/auth/RoleGate'
import {
  Activity,
  Building2,
  ClipboardList,
  LayoutDashboard,
  Shield,
  Users
} from 'lucide-react'
import { PortalShell } from '@/frontend/layouts/PortalShell'
import { Container, PageHeader, PageState, Skeleton } from '@/frontend/ds'
import type { PlatformDashboardPayload } from '@/lib/platform/dashboardTypes'
import { PlatformOverviewBody } from './PlatformOverviewBody'

const nav = [
  { href: '/platform', label: 'Resumen', icon: LayoutDashboard },
  { href: '/platform/organizaciones', label: 'Organizaciones', icon: Building2 },
  { href: '/platform/clinicas', label: 'Clínicas', icon: ClipboardList },
  { href: '/platform/usuarios', label: 'Usuarios', icon: Users },
  { href: '/platform/seguridad', label: 'Seguridad', icon: Shield },
  { href: '/platform/monitorizacion', label: 'Monitorización', icon: Activity }
]

const PlatformDashboardInner = () => {
  const logout = useLogout()
  const metrics = useAsync(async () => {
    const res = await fetch('/api/platform/overview', { credentials: 'include' })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error?.message ?? 'No se pudo cargar el resumen')
    return json.data
  }, [])

  return (
    <PortalShell brand="Plataforma" subtitle="AgendaClinic SaaS" nav={nav} onLogout={logout}>
      <Container size="full" className="!px-0">
        <PageHeader
          title="Resumen de plataforma"
          description="Estado global de clínicas, usuarios y operaciones."
        />
        {metrics.status === 'loading' || metrics.status === 'idle' ? (
          <Skeleton className="h-40 w-full" />
        ) : null}
        {metrics.status === 'error' ? (
          <PageState variant="error" title="Error al cargar" description={metrics.error} />
        ) : null}
        {metrics.status === 'success' && metrics.data ? (
          <PlatformOverviewBody data={metrics.data as PlatformDashboardPayload} />
        ) : null}
      </Container>
    </PortalShell>
  )
}

export const PlatformDashboard = () => (
  <PlatformGate>
    <PlatformDashboardInner />
  </PlatformGate>
)

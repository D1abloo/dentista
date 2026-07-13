import { PlatformGate } from '@/components/platform/PlatformGate'
import { useLogout } from '@/components/auth/RoleGate'
import { PortalShell } from '@/frontend/layouts/PortalShell'
import { Container, PageHeader } from '@/frontend/ds'
import { AdminGenericModuleView } from '@/frontend/features/admin/views/AdminGenericModuleView'
import { platformApiMap, platformNav, platformTitles, type PlatformView } from './nav'

const Body = ({ view }: { view: PlatformView }) => (
  <AdminGenericModuleView title={platformTitles[view]} endpoint={platformApiMap[view]} />
)

function PlatformAppInner({ view }: { view: PlatformView }) {
  const logout = useLogout()
  const nav = platformNav.map(({ href, label, icon }) => ({ href, label, icon }))

  return (
    <PortalShell brand="Plataforma" subtitle="AgendaClinic SaaS" nav={nav} onLogout={logout}>
      <Container size="full" className="!px-0">
        <PageHeader title={platformTitles[view]} description="Operación global del SaaS dental." />
        <Body view={view} />
      </Container>
    </PortalShell>
  )
}

export const PlatformApp = ({ view = 'overview' }: { view?: PlatformView }) => (
  <PlatformGate>
    <PlatformAppInner view={view} />
  </PlatformGate>
)

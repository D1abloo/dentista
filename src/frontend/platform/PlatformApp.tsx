import { lazy, Suspense } from 'react'
import { PlatformGate } from '@/components/platform/PlatformGate'
import { useLogout } from '@/components/auth/RoleGate'
import { Skeleton } from '@/frontend/ds'
import type { PlatformView } from '@/frontend/features/platform/nav'
import { PlatformAdminShell } from './components/shell/PlatformAdminShell'
import './styles/tokens.css'

const PlatformOverviewPage = lazy(() => import('./pages/PlatformOverviewPage'))
const PlatformUsersPage = lazy(() => import('./pages/PlatformUsersPage'))
const PlatformListPage = lazy(() => import('./pages/PlatformListPage'))

const PageFallback = () => <Skeleton className="m-6 h-48 w-full rounded-2xl" />

const PlatformBody = ({ view }: { view: PlatformView }) => {
  if (view === 'overview') {
    return (
      <Suspense fallback={<PageFallback />}>
        <PlatformOverviewPage />
      </Suspense>
    )
  }
  if (view === 'usuarios') {
    return (
      <Suspense fallback={<PageFallback />}>
        <PlatformUsersPage />
      </Suspense>
    )
  }
  return (
    <Suspense fallback={<PageFallback />}>
      <PlatformListPage view={view} />
    </Suspense>
  )
}

function PlatformAppInner({ view }: { view: PlatformView }) {
  const logout = useLogout()
  return (
    <PlatformAdminShell onLogout={logout}>
      <PlatformBody view={view} />
    </PlatformAdminShell>
  )
}

export const PlatformApp = ({ view = 'overview' }: { view?: PlatformView }) => (
  <PlatformGate>
    <PlatformAppInner view={view} />
  </PlatformGate>
)

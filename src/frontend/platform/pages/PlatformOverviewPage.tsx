import { useAsync } from '@/frontend/hooks/useAsync'
import type { PlatformDashboardPayload } from '@/lib/platform/dashboardTypes'
import { Button, PageState, Skeleton } from '@/frontend/ds'
import { PageHeaderBlock } from '../components/shell/Breadcrumbs'
import { PlatformOverviewPremium } from './PlatformOverviewPremium'

export const PlatformOverviewPage = () => {
  const state = useAsync(async () => {
    const res = await fetch('/api/platform/overview', { credentials: 'include' })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error?.message ?? 'No se pudo cargar el resumen')
    return json.data as PlatformDashboardPayload
  }, [])

  return (
    <div className="pf-animate-in">
      <PageHeaderBlock
        title="Resumen"
        description="Vista general del estado de la plataforma AgendaClinic SaaS."
      />
      <div className="mx-auto max-w-[var(--pf-content-max)] p-4 sm:p-6">
        {state.status === 'loading' || state.status === 'idle' ? (
          <div className="pf-stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((n) => (
              <Skeleton key={n} className="h-36 rounded-2xl" />
            ))}
          </div>
        ) : null}
        {state.status === 'error' ? (
          <PageState
            variant="error"
            title="Error al cargar"
            description={state.error}
            action={
              <Button variant="secondary" onClick={() => window.location.reload()}>
                Reintentar
              </Button>
            }
          />
        ) : null}
        {state.status === 'success' && state.data ? <PlatformOverviewPremium data={state.data} /> : null}
      </div>
    </div>
  )
}

export default PlatformOverviewPage

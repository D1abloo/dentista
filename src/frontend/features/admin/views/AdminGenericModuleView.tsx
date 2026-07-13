import { useAsync } from '@/frontend/hooks/useAsync'
import { Alert, Card, DataTable, PageState, Skeleton } from '@/frontend/ds'
import type { DataColumn } from '@/frontend/ds/DataTable'
import {
  inferColumns,
  platformColumns
} from '@/frontend/features/platform/platformColumns'
import {
  isPlatformDashboardPayload,
  PlatformOverviewBody
} from '@/frontend/features/platform/PlatformOverviewBody'
import type { PlatformView } from '@/frontend/features/platform/nav'

type Row = Record<string, unknown>

const renderObjectPayload = (payload: Record<string, unknown>) => {
  const scalarEntries = Object.entries(payload).filter(
    ([, value]) => value === null || ['string', 'number', 'boolean'].includes(typeof value)
  )
  const arrayEntries = Object.entries(payload).filter(([, value]) => Array.isArray(value)) as [
    string,
    Row[]
  ][]

  return (
    <div className="space-y-6">
      {scalarEntries.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {scalarEntries.map(([key, value]) => (
            <Card key={key} className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {key.replace(/_/g, ' ')}
              </p>
              <p className="mt-2 text-lg font-semibold text-ink">{String(value)}</p>
            </Card>
          ))}
        </div>
      ) : null}
      {arrayEntries.map(([key, rows]) => (
        <div key={key} className="space-y-3">
          <h3 className="font-semibold capitalize text-ink">{key.replace(/_/g, ' ')}</h3>
          <DataTable rows={rows} columns={inferColumns(rows)} caption={key} />
        </div>
      ))}
    </div>
  )
}

export const AdminGenericModuleView = ({
  title,
  description,
  endpoint,
  columns,
  platformView
}: {
  title: string
  description?: string
  endpoint: string
  columns?: DataColumn<Row>[]
  platformView?: PlatformView
}) => {
  const state = useAsync(async () => {
    const res = await fetch(endpoint, { credentials: 'include' })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error?.message ?? `Error al cargar ${title}`)
    return json.data
  }, [endpoint])

  if (state.status === 'loading' || state.status === 'idle') {
    return <Skeleton className="h-48 w-full" />
  }
  if (state.status === 'error') {
    return (
      <PageState
        variant="error"
        title={`No se pudo cargar ${title}`}
        description={state.error}
      />
    )
  }
  if (state.status === 'empty') {
    return <PageState variant="empty" title={`${title} vacío`} description={description} />
  }

  const payload = state.data

  if (isPlatformDashboardPayload(payload)) {
    return (
      <div className="space-y-4">
        {description ? <Alert tone="info">{description}</Alert> : null}
        <PlatformOverviewBody data={payload} />
      </div>
    )
  }

  if (Array.isArray(payload)) {
    const rows = payload as Row[]
    const tableColumns =
      columns ?? (platformView ? platformColumns[platformView] : undefined) ?? inferColumns(rows)
    return (
      <div className="space-y-4">
        {description ? <Alert tone="info">{description}</Alert> : null}
        <DataTable rows={rows} columns={tableColumns} caption={title} />
      </div>
    )
  }

  if (payload && typeof payload === 'object') {
    return (
      <div className="space-y-4">
        {description ? <Alert tone="info">{description}</Alert> : null}
        {renderObjectPayload(payload as Record<string, unknown>)}
      </div>
    )
  }

  return (
    <PageState variant="empty" title={`${title} vacío`} description="No hay datos para mostrar." />
  )
}

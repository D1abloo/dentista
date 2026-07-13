import { useAsync } from '@/frontend/hooks/useAsync'
import { Alert, Card, PageState, Skeleton } from '@/frontend/ds'

export const AdminGenericModuleView = ({
  title,
  description,
  endpoint
}: {
  title: string
  description?: string
  endpoint: string
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
  const preview = Array.isArray(payload)
    ? payload.slice(0, 8)
    : typeof payload === 'object' && payload
      ? Object.entries(payload as Record<string, unknown>).slice(0, 8)
      : []

  return (
    <div className="space-y-4">
      {description ? <Alert tone="info">{description}</Alert> : null}
      <Card>
        <pre className="overflow-x-auto text-xs text-slate-700">
          {JSON.stringify(preview, null, 2)}
        </pre>
      </Card>
    </div>
  )
}

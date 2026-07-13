import { useMemo, useState } from 'react'
import { useAsync } from '@/frontend/hooks/useAsync'
import { Alert, Button, Input, PageState, Skeleton } from '@/frontend/ds'
import { DataTable } from '@/frontend/ds/DataTable'
import {
  inferColumns,
  platformColumns
} from '@/frontend/features/platform/platformColumns'
import { platformApiMap, platformTitles, type PlatformView } from '@/frontend/features/platform/nav'
import { PageHeaderBlock } from '../components/shell/Breadcrumbs'

type Row = Record<string, unknown>

export const PlatformListPage = ({ view }: { view: PlatformView }) => {
  const title = platformTitles[view]
  const endpoint = platformApiMap[view]
  const [search, setSearch] = useState('')

  const state = useAsync(async () => {
    const res = await fetch(endpoint, { credentials: 'include' })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error?.message ?? `Error al cargar ${title}`)
    return json.data
  }, [endpoint, title])

  const rows = useMemo(() => {
    if (!Array.isArray(state.data)) return [] as Row[]
    const q = search.trim().toLowerCase()
    const list = state.data as Row[]
    if (!q) return list
    return list.filter((row) =>
      Object.values(row).some((v) => typeof v === 'string' && v.toLowerCase().includes(q))
    )
  }, [state.data, search])

  const columns = platformColumns[view] ?? inferColumns(rows)

  return (
    <div className="pf-fade-in">
      <PageHeaderBlock title={title} description={`Operación y seguimiento de ${title.toLowerCase()}.`} />
      <div className="space-y-4 p-4 sm:p-6">
        <Input
          id={`${view}-search`}
          label="Buscar"
          placeholder="Filtrar resultados…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {state.status === 'loading' || state.status === 'idle' ? <Skeleton className="h-48 w-full" /> : null}

        {state.status === 'error' ? (
          <PageState variant="error" title={`No se pudo cargar ${title}`} description={state.error} />
        ) : null}

        {state.status === 'success' && !Array.isArray(state.data) ? (
          <Alert tone="info">Este módulo muestra datos estructurados. Consulta las subsecciones disponibles.</Alert>
        ) : null}

        {state.status === 'success' && Array.isArray(state.data) && !rows.length ? (
          <PageState variant="empty" title={`${title} vacío`} description="No hay registros para mostrar." />
        ) : null}

        {state.status === 'success' && rows.length ? (
          <DataTable rows={rows} columns={columns} caption={title} />
        ) : null}

        {state.status === 'error' ? (
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Reintentar
          </Button>
        ) : null}
      </div>
    </div>
  )
}

export default PlatformListPage

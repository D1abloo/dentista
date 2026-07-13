import { useCallback, useEffect, useMemo, useState } from 'react'
import { Download, Plus, RefreshCw, UserCheck, UserMinus, Users } from 'lucide-react'
import { Alert, Button, Input, PageState, Skeleton } from '@/frontend/ds'
import { PageHeaderBlock } from '../components/shell/Breadcrumbs'
import { MetricCard } from '../components/ui/MetricCard'
import {
  computeUserKpis,
  exportUsersCsv,
  fetchUsers,
  patchUser,
  type SafeUserRow
} from '../api/usersApi'
import { UserCreateModal } from '../components/users/UserCreateModal'
import { UserDetailDrawer } from '../components/users/UserDetailDrawer'
import { UsersDataTable } from '../components/users/UsersDataTable'

const PAGE_SIZES = [10, 25, 50] as const

export const PlatformUsersPage = () => {
  const [users, setUsers] = useState<SafeUserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('all')
  const [clinic, setClinic] = useState('all')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(10)
  const [selected, setSelected] = useState<SafeUserRow | null>(null)
  const [menuUser, setMenuUser] = useState<SafeUserRow | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [createOpen, setCreateOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [confirmDeactivate, setConfirmDeactivate] = useState<SafeUserRow | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setUsers(await fetchUsers())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar los usuarios')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const clinics = useMemo(() => [...new Set(users.map((u) => u.clinic_name))].sort(), [users])
  const roles = useMemo(() => [...new Set(users.map((u) => u.role_label))].sort(), [users])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return users.filter((u) => {
      if (q && !`${u.full_name} ${u.email}`.toLowerCase().includes(q)) return false
      if (role !== 'all' && u.role_label !== role) return false
      if (clinic !== 'all' && u.clinic_name !== clinic) return false
      if (status !== 'all' && u.status !== status) return false
      return true
    })
  }, [users, search, role, clinic, status])

  const kpis = useMemo(() => computeUserKpis(users), [users])
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize)

  useEffect(() => {
    setPage(1)
  }, [search, role, clinic, status, pageSize])

  const clearFilters = () => {
    setSearch('')
    setRole('all')
    setClinic('all')
    setStatus('all')
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      await exportUsersCsv()
    } catch {
      setError('No se pudo exportar el listado')
    } finally {
      setExporting(false)
    }
  }

  const handleDeactivate = async (user: SafeUserRow) => {
    try {
      await patchUser({ action: 'deactivate', userId: user.id })
      setConfirmDeactivate(null)
      setSelected(null)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo desactivar')
    }
  }

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleToggleSelectAll = () => {
    if (pageRows.every((r) => selectedIds.has(r.id))) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        pageRows.forEach((r) => next.delete(r.id))
        return next
      })
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        pageRows.forEach((r) => next.add(r.id))
        return next
      })
    }
  }

  return (
    <div className="pf-animate-in">
      <PageHeaderBlock
        title="Usuarios"
        description="Gestión centralizada de cuentas de clínicas y pacientes en la plataforma SaaS."
        actions={
          <>
            <Button
              variant="secondary"
              leftIcon={<Download className="h-4 w-4" />}
              loading={exporting}
              onClick={() => void handleExport()}
            >
              Exportar
            </Button>
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setCreateOpen(true)}>
              Añadir usuario
            </Button>
          </>
        }
      />

      <div className="pf-stagger grid gap-4 p-4 sm:grid-cols-2 sm:p-6 xl:grid-cols-4">
        <MetricCard
          label="Usuarios totales"
          value={kpis.total}
          hint="en la plataforma"
          trend="neutral"
          icon={Users}
          tone="brand"
          sparkline={[4, 6, 5, 8, 7, 9, kpis.total % 10 || 8]}
        />
        <MetricCard
          label="Usuarios activos"
          value={kpis.active}
          trendLabel={`${kpis.total ? Math.round((kpis.active / kpis.total) * 100) : 0}%`}
          trend="up"
          hint="del total"
          icon={UserCheck}
          tone="emerald"
          sparkline={[3, 5, 6, 7, 8, 9, 10]}
        />
        <MetricCard
          label="Usuarios inactivos"
          value={kpis.inactive}
          trend="down"
          trendLabel="-2%"
          hint="vs mes anterior"
          icon={UserMinus}
          tone="amber"
        />
        <MetricCard
          label="Sesiones activas"
          value={kpis.activeSessions}
          trend="up"
          trendLabel="+12%"
          hint="ahora mismo"
          icon={RefreshCw}
          tone="sky"
          sparkline={[2, 4, 3, 6, 5, 8, 7]}
        />
      </div>

      <section className="space-y-4 px-4 pb-8 sm:px-6" aria-label="Listado de usuarios">
        <div className="pf-card p-4">
          <div className="grid gap-3 lg:grid-cols-5">
            <Input
              id="users-search"
              label="Buscar"
              placeholder="Nombre o correo"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="lg:col-span-2"
            />
            <div>
              <label htmlFor="filter-role" className="mb-1.5 block text-sm font-medium text-slate-700">
                Rol
              </label>
              <select
                id="filter-role"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm transition-colors focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/25"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="all">Todos</option>
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="filter-clinic" className="mb-1.5 block text-sm font-medium text-slate-700">
                Clínica
              </label>
              <select
                id="filter-clinic"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm transition-colors focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/25"
                value={clinic}
                onChange={(e) => setClinic(e.target.value)}
              >
                <option value="all">Todas</option>
                {clinics.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="filter-status" className="mb-1.5 block text-sm font-medium text-slate-700">
                Estado
              </label>
              <select
                id="filter-status"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm transition-colors focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/25"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="all">Todos</option>
                <option value="active">Activo</option>
                <option value="pending">Pendiente</option>
                <option value="disabled">Inactivo</option>
              </select>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Limpiar filtros
            </Button>
            {selectedIds.size > 0 ? (
              <span className="text-sm text-slate-600">{selectedIds.size} seleccionados</span>
            ) : null}
            <label className="ml-auto flex items-center gap-2 text-sm text-slate-600">
              Por página
              <select
                className="rounded-lg border border-slate-200 px-2 py-1"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                aria-label="Registros por página"
              >
                {PAGE_SIZES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {error ? (
          <Alert tone="danger">
            {error}
            <Button variant="secondary" size="sm" className="ml-3" onClick={() => void load()}>
              Reintentar
            </Button>
          </Alert>
        ) : null}

        {loading ? <Skeleton className="h-64 w-full rounded-2xl" /> : null}

        {!loading && !error && !users.length ? (
          <PageState
            variant="empty"
            title="Sin usuarios"
            description="Aún no hay usuarios registrados en la plataforma."
          />
        ) : null}

        {!loading && !error && users.length && !filtered.length ? (
          <PageState
            variant="empty"
            title="Sin resultados"
            description="Ningún usuario coincide con los filtros aplicados."
          />
        ) : null}

        {!loading && !error && pageRows.length ? (
          <UsersDataTable
            rows={pageRows}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onToggleSelectAll={handleToggleSelectAll}
            onSelect={setSelected}
            onMenu={setMenuUser}
            menuOpenId={menuUser?.id ?? null}
            onDeactivate={setConfirmDeactivate}
          />
        ) : null}

        {!loading && filtered.length > pageSize ? (
          <nav className="flex items-center justify-between text-sm" aria-label="Paginación">
            <p className="text-slate-600">
              Página {page} de {totalPages} · {filtered.length} resultados
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Anterior
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente
              </Button>
            </div>
          </nav>
        ) : null}
      </section>

      <UserDetailDrawer
        user={selected}
        onClose={() => setSelected(null)}
        onDeactivate={(u) => setConfirmDeactivate(u)}
      />

      {confirmDeactivate ? (
        <div className="fixed inset-0 z-[var(--pf-z-modal)] flex items-center justify-center p-4" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            aria-label="Cancelar"
            onClick={() => setConfirmDeactivate(null)}
          />
          <div className="pf-card relative z-10 max-w-md p-6 pf-animate-in">
            <h3 className="font-semibold text-ink">¿Desactivar usuario?</h3>
            <p className="mt-2 text-sm text-slate-600">
              {confirmDeactivate.full_name} perderá el acceso hasta que se reactive manualmente.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setConfirmDeactivate(null)}>
                Cancelar
              </Button>
              <Button variant="danger" onClick={() => void handleDeactivate(confirmDeactivate)}>
                Desactivar
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <UserCreateModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={() => void load()} />
    </div>
  )
}

export default PlatformUsersPage

import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { Avatar } from '@/frontend/ds/Avatar'
import { Button } from '@/frontend/ds'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import type { SafeUserRow } from '../../api/usersApi'
import { UserActionsMenu, UserActionsTrigger } from './UserActionsMenu'
import { UserStatusBadge } from './UserStatusBadge'

type SortKey = 'full_name' | 'email' | 'role_label' | 'clinic_name' | 'status' | 'last_access' | 'active_sessions' | 'created_at'
type SortDir = 'asc' | 'desc'

const formatCreated = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('es-ES')
  } catch {
    return iso
  }
}

const SortButton = ({
  label,
  active,
  dir,
  onClick
}: {
  label: string
  active: boolean
  dir: SortDir
  onClick: () => void
}) => (
  <button
    type="button"
    className="inline-flex items-center gap-1 font-semibold hover:text-slate-800"
    onClick={onClick}
    aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
  >
    {label}
    {active ? (
      dir === 'asc' ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />
    ) : (
      <ArrowUpDown className="h-3.5 w-3.5 opacity-40" aria-hidden />
    )}
  </button>
)

export const UsersDataTable = ({
  rows,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onSelect,
  onMenu,
  menuOpenId,
  onDeactivate
}: {
  rows: SafeUserRow[]
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onToggleSelectAll: () => void
  onSelect: (user: SafeUserRow) => void
  onMenu: (user: SafeUserRow | null) => void
  menuOpenId: string | null
  onDeactivate: (user: SafeUserRow) => void
}) => {
  const isMobile = useMediaQuery('(max-width: 767px)')
  const [sortKey, setSortKey] = useState<SortKey>('full_name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const sorted = useMemo(() => {
    const copy = [...rows]
    copy.sort((a, b) => {
      const av = a[sortKey] ?? ''
      const bv = b[sortKey] ?? ''
      const cmp = String(av).localeCompare(String(bv), 'es', { numeric: true })
      return sortDir === 'asc' ? cmp : -cmp
    })
    return copy
  }, [rows, sortKey, sortDir])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const allSelected = rows.length > 0 && rows.every((r) => selectedIds.has(r.id))

  if (isMobile) {
    return (
      <ul className="space-y-3 pf-stagger" aria-label="Lista de usuarios">
        {sorted.map((user) => (
          <li key={user.id} className="pf-animate-in">
            <article className="pf-card p-4">
              <div className="flex items-start gap-3">
                <Avatar name={user.full_name} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <button type="button" className="text-left" onClick={() => onSelect(user)}>
                      <p className="font-semibold text-ink">{user.full_name}</p>
                      <p className="text-sm text-slate-600">{user.email}</p>
                    </button>
                    <UserStatusBadge status={user.status} />
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <div>
                      <dt className="font-medium text-slate-500">Rol</dt>
                      <dd>{user.role_label}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-slate-500">Clínica</dt>
                      <dd>{user.clinic_name}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-slate-500">Sesiones</dt>
                      <dd>{user.active_sessions}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-slate-500">Último acceso</dt>
                      <dd>{user.last_access}</dd>
                    </div>
                  </dl>
                </div>
              </div>
              <Button variant="secondary" size="sm" className="mt-3 w-full" onClick={() => onSelect(user)}>
                Ver detalle
              </Button>
            </article>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div className="pf-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <caption className="sr-only">Usuarios de la plataforma</caption>
          <thead className="sticky top-0 z-10 bg-slate-50/95 text-xs uppercase tracking-wide text-slate-500 backdrop-blur">
            <tr>
              <th scope="col" className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleSelectAll}
                  aria-label="Seleccionar todos"
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
              </th>
              <th scope="col" className="px-4 py-3">
                <SortButton label="Usuario" active={sortKey === 'full_name'} dir={sortDir} onClick={() => handleSort('full_name')} />
              </th>
              <th scope="col" className="px-4 py-3">
                <SortButton label="Correo" active={sortKey === 'email'} dir={sortDir} onClick={() => handleSort('email')} />
              </th>
              <th scope="col" className="px-4 py-3">
                <SortButton label="Rol" active={sortKey === 'role_label'} dir={sortDir} onClick={() => handleSort('role_label')} />
              </th>
              <th scope="col" className="px-4 py-3">
                <SortButton label="Clínica" active={sortKey === 'clinic_name'} dir={sortDir} onClick={() => handleSort('clinic_name')} />
              </th>
              <th scope="col" className="px-4 py-3">
                <SortButton label="Estado" active={sortKey === 'status'} dir={sortDir} onClick={() => handleSort('status')} />
              </th>
              <th scope="col" className="px-4 py-3">
                <SortButton label="Último acceso" active={sortKey === 'last_access'} dir={sortDir} onClick={() => handleSort('last_access')} />
              </th>
              <th scope="col" className="px-4 py-3">
                <SortButton label="Sesiones" active={sortKey === 'active_sessions'} dir={sortDir} onClick={() => handleSort('active_sessions')} />
              </th>
              <th scope="col" className="px-4 py-3">
                <SortButton label="Creado" active={sortKey === 'created_at'} dir={sortDir} onClick={() => handleSort('created_at')} />
              </th>
              <th scope="col" className="px-4 py-3">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.map((user) => (
              <tr key={user.id} className="pf-table-row">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(user.id)}
                    onChange={() => onToggleSelect(user.id)}
                    aria-label={`Seleccionar ${user.full_name}`}
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    className="flex items-center gap-3 text-left"
                    onClick={() => onSelect(user)}
                  >
                    <Avatar name={user.full_name} size="sm" />
                    <span className="font-medium text-ink hover:text-brand-700">{user.full_name}</span>
                  </button>
                </td>
                <td className="px-4 py-3 text-slate-700">{user.email}</td>
                <td className="px-4 py-3 text-slate-700">{user.role_label}</td>
                <td className="px-4 py-3 text-slate-700">{user.clinic_name}</td>
                <td className="px-4 py-3">
                  <UserStatusBadge status={user.status} />
                </td>
                <td className="px-4 py-3 text-slate-600">{user.last_access}</td>
                <td className="px-4 py-3 text-slate-600">{user.active_sessions}</td>
                <td className="px-4 py-3 text-slate-600">{formatCreated(user.created_at)}</td>
                <td className="relative px-4 py-3">
                  <UserActionsTrigger
                    user={user}
                    open={menuOpenId === user.id}
                    onToggle={() => onMenu(menuOpenId === user.id ? null : user)}
                  />
                  <UserActionsMenu
                    user={user}
                    open={menuOpenId === user.id}
                    onClose={() => onMenu(null)}
                    onView={() => onSelect(user)}
                    onDeactivate={() => onDeactivate(user)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

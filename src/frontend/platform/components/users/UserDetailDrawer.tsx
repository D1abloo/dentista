import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { Avatar } from '@/frontend/ds/Avatar'
import { Button } from '@/frontend/ds'
import type { SafeUserRow } from '../../api/usersApi'
import { UserStatusBadge } from './UserStatusBadge'

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return iso
  }
}

export const UserDetailDrawer = ({
  user,
  onClose,
  onDeactivate
}: {
  user: SafeUserRow | null
  onClose: () => void
  onDeactivate: (user: SafeUserRow) => void
}) => {
  const panelRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!user) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    panelRef.current?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [user, onClose])

  if (!user) return null

  return (
    <div className="fixed inset-0 z-[var(--pf-z-modal)] flex justify-end" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        aria-label="Cerrar detalle"
        onClick={onClose}
      />
      <aside
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-drawer-title"
        className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
        style={{ animation: 'pfSlideInRight 280ms var(--pf-ease-spring) both' }}
      >
        <div className="flex items-start gap-4 border-b border-slate-200 px-5 py-5">
          <Avatar name={user.full_name} size="lg" />
          <div className="min-w-0 flex-1">
            <h2 id="user-drawer-title" className="font-display text-xl font-semibold text-ink">
              {user.full_name}
            </h2>
            <p className="mt-1 truncate text-sm text-slate-600">{user.email}</p>
            <div className="mt-2">
              <UserStatusBadge status={user.status} />
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Cerrar panel">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rol</dt>
              <dd className="mt-1 text-slate-800">{user.role_label}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Clínica</dt>
              <dd className="mt-1 text-slate-800">{user.clinic_name}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Acceso</dt>
              <dd className="mt-1 text-slate-800">{user.access_label}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Último acceso</dt>
              <dd className="mt-1 text-slate-800">{user.last_access}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sesiones activas</dt>
              <dd className="mt-1 text-slate-800">{user.active_sessions}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Creado</dt>
              <dd className="mt-1 text-slate-800">{formatDate(user.created_at)}</dd>
            </div>
          </dl>
        </div>

        <div className="border-t border-slate-200 p-4">
          {user.status === 'active' ? (
            <Button variant="danger" className="w-full" onClick={() => onDeactivate(user)}>
              Desactivar usuario
            </Button>
          ) : null}
        </div>
      </aside>
    </div>
  )
}

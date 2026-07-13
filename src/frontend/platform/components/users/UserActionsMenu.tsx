import { useEffect, useRef } from 'react'
import { Activity, Eye, MoreHorizontal, Pencil, RefreshCw, ShieldOff, Trash2 } from 'lucide-react'
import { Button } from '@/frontend/ds'
import type { SafeUserRow } from '../../api/usersApi'

export const UserActionsMenu = ({
  user,
  open,
  onClose,
  onView,
  onEdit,
  onDeactivate,
  onResetAccess,
  onViewActivity
}: {
  user: SafeUserRow
  open: boolean
  onClose: () => void
  onView: () => void
  onEdit?: () => void
  onDeactivate?: () => void
  onResetAccess?: () => void
  onViewActivity?: () => void
}) => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open, onClose])

  if (!open) return null

  const items = [
    { label: 'Ver detalles', icon: Eye, onClick: onView },
    { label: 'Editar', icon: Pencil, onClick: onEdit ?? onView },
    { label: 'Restablecer acceso', icon: RefreshCw, onClick: onResetAccess ?? onView },
    { label: 'Ver actividad', icon: Activity, onClick: onViewActivity ?? onView },
    user.status === 'active'
      ? { label: 'Cambiar estado', icon: ShieldOff, onClick: onDeactivate, danger: true }
      : null,
    { label: 'Eliminar', icon: Trash2, onClick: onDeactivate, danger: true }
  ].filter(Boolean) as Array<{
    label: string
    icon: typeof Eye
    onClick?: () => void
    danger?: boolean
  }>

  return (
    <div
      ref={ref}
      role="menu"
      aria-label={`Acciones para ${user.full_name}`}
      className="absolute right-0 top-full z-20 mt-1 min-w-[11rem] rounded-xl border border-slate-200 bg-white p-1 shadow-lg animate-in fade-in duration-150"
    >
      {items.map((item) => {
        const Icon = item.icon
        return (
          <button
            key={item.label}
            type="button"
            role="menuitem"
            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50 ${
              item.danger ? 'text-red-600 hover:bg-red-50' : 'text-slate-700'
            }`}
            onClick={() => {
              item.onClick?.()
              onClose()
            }}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            {item.label}
          </button>
        )
      })}
    </div>
  )
}

export const UserActionsTrigger = ({
  user,
  open,
  onToggle
}: {
  user: SafeUserRow
  open: boolean
  onToggle: () => void
}) => (
  <div className="relative">
    <Button
      variant="ghost"
      size="sm"
      aria-label={`Acciones para ${user.full_name}`}
      aria-expanded={open}
      aria-haspopup="menu"
      onClick={onToggle}
    >
      <MoreHorizontal className="h-4 w-4" />
    </Button>
  </div>
)

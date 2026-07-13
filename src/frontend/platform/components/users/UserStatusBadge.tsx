import { Badge } from '@/frontend/ds'
import type { UserListRow } from '@/lib/platform/usersDemo'

const toneMap: Record<UserListRow['status'], 'success' | 'warning' | 'danger' | 'neutral'> = {
  active: 'success',
  pending: 'warning',
  disabled: 'danger'
}

const labelMap: Record<UserListRow['status'], string> = {
  active: 'Activo',
  pending: 'Pendiente',
  disabled: 'Inactivo'
}

export const UserStatusBadge = ({ status }: { status: UserListRow['status'] }) => (
  <Badge tone={toneMap[status]}>{labelMap[status]}</Badge>
)

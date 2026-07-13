import type { UserListRow } from '@/lib/platform/usersDemo'
import { platformFetch } from './client'

export type SafeUserRow = Omit<UserListRow, 'portal_token_hint' | 'permissions'> & {
  permissions?: UserListRow['permissions']
}

const stripSensitive = (row: UserListRow): SafeUserRow => {
  const { portal_token_hint: _t, permissions, ...rest } = row
  return { ...rest, permissions }
}

export const fetchUsers = async (): Promise<SafeUserRow[]> => {
  const rows = await platformFetch<UserListRow[]>('/api/platform/users')
  return rows.map(stripSensitive)
}

export const createUser = async (body: Record<string, unknown>) =>
  platformFetch<SafeUserRow>('/api/platform/users', {
    method: 'POST',
    body: JSON.stringify(body)
  })

export const patchUser = async (body: Record<string, unknown>) =>
  platformFetch<SafeUserRow>('/api/platform/users', {
    method: 'PATCH',
    body: JSON.stringify(body)
  })

export const exportUsersCsv = async () => {
  const res = await fetch('/api/platform/users-export', { credentials: 'include' })
  if (!res.ok) throw new Error('No se pudo exportar')
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'usuarios.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export type UserKpis = {
  total: number
  active: number
  inactive: number
  activeSessions: number
}

export const computeUserKpis = (users: SafeUserRow[]): UserKpis => ({
  total: users.length,
  active: users.filter((u) => u.status === 'active').length,
  inactive: users.filter((u) => u.status !== 'active').length,
  activeSessions: users.reduce((sum, u) => sum + (u.active_sessions ?? 0), 0)
})

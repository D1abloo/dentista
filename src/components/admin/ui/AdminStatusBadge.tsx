import type { ReactNode } from 'react'

export type AdminBadgeTone =
  | 'neutral'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger'
  | 'pending'
  | 'paid'
  | 'overdue'
  | 'draft'

const toneClass: Record<AdminBadgeTone, string> = {
  neutral: 'adm-badge--neutral',
  info: 'adm-badge--info',
  success: 'adm-badge--success',
  warning: 'adm-badge--warning',
  danger: 'adm-badge--danger',
  pending: 'adm-badge--pending',
  paid: 'adm-badge--paid',
  overdue: 'adm-badge--overdue',
  draft: 'adm-badge--draft'
}

export function AdminStatusBadge({
  children,
  tone = 'neutral',
  dot = false,
  className = ''
}: {
  children: ReactNode
  tone?: AdminBadgeTone
  dot?: boolean
  className?: string
}) {
  return (
    <span className={`adm-badge ${toneClass[tone]}${dot ? ' adm-badge--dot' : ''}${className ? ` ${className}` : ''}`}>
      {children}
    </span>
  )
}

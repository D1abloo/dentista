import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'

export function AdminEmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action
}: {
  title: string
  description?: string
  icon?: LucideIcon
  action?: ReactNode
}) {
  return (
    <div className="adm-empty" role="status">
      <span className="adm-empty__icon" aria-hidden>
        <Icon className="h-6 w-6" />
      </span>
      <p className="adm-empty__title">{title}</p>
      {description ? <p className="adm-empty__text">{description}</p> : null}
      {action ? <div className="adm-empty__action">{action}</div> : null}
    </div>
  )
}

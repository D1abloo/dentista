import type { ReactNode } from 'react'

export function AdminPageHeader({
  title,
  subtitle,
  actions,
  breadcrumb
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
  breadcrumb?: string
}) {
  return (
    <header className="adm-page-header">
      <div className="adm-page-header__main">
        {breadcrumb ? <p className="adm-page-header__crumb">{breadcrumb}</p> : null}
        <h2 className="adm-page-header__title">{title}</h2>
        {subtitle ? <p className="adm-page-header__sub">{subtitle}</p> : null}
      </div>
      {actions ? <div className="adm-page-header__actions">{actions}</div> : null}
    </header>
  )
}

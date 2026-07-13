import type { ReactNode } from 'react'

export function AdminSectionCard({
  title,
  subtitle,
  actions,
  children,
  className = '',
  padded = true
}: {
  title?: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
  padded?: boolean
}) {
  const hasHead = Boolean(title || subtitle || actions)
  return (
    <section className={`adm-section${className ? ` ${className}` : ''}`}>
      {hasHead ? (
        <header className="adm-section__head">
          <div className="adm-section__titles">
            {title ? <h2 className="adm-section__title">{title}</h2> : null}
            {subtitle ? <p className="adm-section__sub">{subtitle}</p> : null}
          </div>
          {actions ? <div className="adm-section__actions">{actions}</div> : null}
        </header>
      ) : null}
      <div className={padded ? 'adm-section__body' : 'adm-section__body adm-section__body--flush'}>{children}</div>
    </section>
  )
}

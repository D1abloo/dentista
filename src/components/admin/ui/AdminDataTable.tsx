import type { ReactNode } from 'react'

export function AdminDataTable({
  children,
  caption,
  sticky = true,
  className = ''
}: {
  children: ReactNode
  caption?: string
  sticky?: boolean
  className?: string
}) {
  return (
    <div className={`adm-table-wrap${sticky ? ' adm-table-wrap--sticky' : ''}${className ? ` ${className}` : ''}`}>
      <table className="adm-table">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        {children}
      </table>
    </div>
  )
}

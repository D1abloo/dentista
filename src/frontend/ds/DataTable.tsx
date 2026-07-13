import type { ReactNode } from 'react'
import { Badge } from './Badge'
import { cn } from '@/frontend/lib/cn'

export type DataColumn<T extends Record<string, unknown>> = {
  key: keyof T & string
  label: string
  format?: 'status' | 'text'
  render?: (row: T) => ReactNode
}

const statusTone = (value: string) => {
  const v = value.toLowerCase()
  if (['active', 'activo', 'operativa', 'operativo', 'ok', 'resolved'].some((s) => v.includes(s))) {
    return 'success' as const
  }
  if (['pending', 'pendiente', 'degradado', 'warning'].some((s) => v.includes(s))) {
    return 'warning' as const
  }
  if (['disabled', 'suspended', 'cancelado', 'caida', 'critical'].some((s) => v.includes(s))) {
    return 'danger' as const
  }
  return 'neutral' as const
}

const formatCell = (value: unknown, format?: 'status' | 'text') => {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Sí' : 'No'
  if (format === 'status' && typeof value === 'string') {
    return <Badge tone={statusTone(value)}>{value}</Badge>
  }
  if (typeof value === 'object') return '—'
  return String(value)
}

export const DataTable = <T extends Record<string, unknown>>({
  rows,
  columns,
  caption,
  emptyLabel = 'Sin registros',
  className
}: {
  rows: T[]
  columns: DataColumn<T>[]
  caption?: string
  emptyLabel?: string
  className?: string
}) => {
  if (!rows.length) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
        {emptyLabel}
      </p>
    )
  }

  return (
    <div className={cn('pf-card overflow-hidden', className)}>
      <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead className="sticky top-0 z-10 bg-slate-50/95 text-xs uppercase tracking-wide text-slate-500 backdrop-blur">
          <tr>
            {columns.map((col) => (
              <th key={col.key} scope="col" className="px-4 py-3 font-semibold">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, index) => (
            <tr key={String(row.id ?? index)} className="pf-table-row">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-slate-700">
                  {col.render ? col.render(row) : formatCell(row[col.key], col.format)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </div>
  )
}

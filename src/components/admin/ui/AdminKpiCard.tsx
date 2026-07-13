import type { LucideIcon } from 'lucide-react'

export type AdminKpiTone = 'teal' | 'blue' | 'green' | 'amber' | 'purple' | 'orange' | 'coral'

export function AdminKpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'teal',
  loading = false
}: {
  label: string
  value: string | number
  hint?: string
  icon?: LucideIcon
  tone?: AdminKpiTone
  loading?: boolean
}) {
  return (
    <article className={`adm-kpi adm-kpi--${tone}${loading ? ' adm-kpi--loading' : ''}`}>
      {Icon ? (
        <span className={`adm-kpi__icon adm-kpi__icon--${tone}`}>
          <Icon className="h-5 w-5" aria-hidden />
        </span>
      ) : null}
      <p className="adm-kpi__label">{label}</p>
      <p className="adm-kpi__value">{value}</p>
      {hint ? <p className="adm-kpi__trend">{hint}</p> : null}
    </article>
  )
}

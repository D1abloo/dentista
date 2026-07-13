export type AdminFilterOption<T extends string = string> = {
  id: T
  label: string
  count?: number
  danger?: boolean
}

export function AdminFilterBar<T extends string>({
  options,
  value,
  onChange,
  ariaLabel = 'Filtrar listado'
}: {
  options: AdminFilterOption<T>[]
  value: T
  onChange: (id: T) => void
  ariaLabel?: string
}) {
  return (
    <div className="adm-filter-bar" role="toolbar" aria-label={ariaLabel}>
      <div className="adm-filter-bar__scroll">
        {options.map((opt) => {
          const active = value === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              className={`adm-filter-chip${active ? ' adm-filter-chip--active' : ''}${opt.danger ? ' adm-filter-chip--danger' : ''}`}
              aria-pressed={active}
              onClick={() => onChange(opt.id)}
            >
              {opt.label}
              {typeof opt.count === 'number' ? (
                <span className="adm-filter-chip__count" aria-label={`${opt.count} elementos`}>
                  {opt.count}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}

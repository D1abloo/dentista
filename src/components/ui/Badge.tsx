const statusClass: Record<string, string> = {
  pendiente: 'status-badge status-badge--pending',
  confirmada: 'status-badge status-badge--confirmada',
  completada: 'status-badge status-badge--completada',
  cancelada: 'status-badge status-badge--cancelada',
  no_asistio: 'status-badge status-badge--no_asistio',
  reprogramada: 'status-badge status-badge--reprogramada',
  pagado: 'status-badge status-badge--pagado'
}

export function Badge({ status, label }: { status: string; label: string }) {
  return (
    <span className={statusClass[status] ?? 'status-badge status-badge--default'}>
      {label}
    </span>
  )
}

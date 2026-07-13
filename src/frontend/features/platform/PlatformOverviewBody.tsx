import type { PlatformDashboardPayload } from '@/lib/platform/dashboardTypes'
import { Badge, Button, Card } from '@/frontend/ds'

export const PlatformOverviewBody = ({ data }: { data: PlatformDashboardPayload }) => {
  const { overview, pendingActions, activity, health } = data

  const kpis = [
    { label: 'Clínicas', value: overview.clinicsTotal, hint: `${overview.clinicsActive} activas` },
    { label: 'Usuarios staff', value: overview.staffUsers, hint: `+${overview.staffNewMonth} este mes` },
    { label: 'Altas pendientes', value: overview.registrationsPending, hint: 'Por revisar' },
    { label: 'Tickets abiertos', value: overview.supportOpen, hint: `${overview.supportUrgent} urgentes` }
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{kpi.label}</p>
            <p className="mt-2 font-display text-3xl font-semibold text-ink">{kpi.value}</p>
            <p className="mt-1 text-sm text-slate-500">{kpi.hint}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-semibold text-ink">Acciones pendientes</h3>
          <ul className="mt-4 space-y-3">
            {pendingActions.map((action) => (
              <li
                key={action.id}
                className="flex flex-col gap-2 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-ink">{action.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{action.description}</p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => { window.location.href = action.href }}>
                  {action.buttonLabel}
                </Button>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold text-ink">Salud del sistema</h3>
          <ul className="mt-4 space-y-2">
            {health.map((item) => (
              <li key={item.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span className="text-sm text-slate-700">{item.label}</span>
                <Badge tone={item.status.includes('degrad') || item.status.includes('caida') ? 'warning' : 'success'}>
                  {item.status}
                </Badge>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="font-semibold text-ink">Actividad reciente</h3>
        <ul className="mt-4 divide-y divide-slate-100">
          {activity.slice(0, 8).map((item) => (
            <li key={item.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-ink">{item.title}</p>
                <p className="text-xs text-slate-500">{item.module}</p>
              </div>
              <span className="text-xs text-slate-500">{item.at}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}

export const isPlatformDashboardPayload = (value: unknown): value is PlatformDashboardPayload => {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return Boolean(v.overview && v.pendingActions && v.activity)
}

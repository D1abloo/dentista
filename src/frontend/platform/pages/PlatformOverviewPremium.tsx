import {
  Activity,
  Building2,
  ClipboardList,
  Headphones,
  Stethoscope,
  Users
} from 'lucide-react'
import type { PlatformDashboardPayload } from '@/lib/platform/dashboardTypes'
import { Badge, Button } from '@/frontend/ds'
import { MetricCard } from '../components/ui/MetricCard'

export const PlatformOverviewPremium = ({ data }: { data: PlatformDashboardPayload }) => {
  const { overview, pendingActions, activity, health } = data

  return (
    <div className="space-y-6 pf-stagger">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Clínicas activas"
          value={overview.clinicsActive}
          hint={`${overview.clinicsTotal} totales`}
          trend="up"
          trendLabel="+4%"
          icon={Building2}
          tone="brand"
          sparkline={[2, 3, 4, 5, 6, 7, overview.clinicsActive]}
        />
        <MetricCard
          label="Usuarios staff"
          value={overview.staffUsers}
          hint={`+${overview.staffNewMonth} este mes`}
          trend="up"
          trendLabel="+8%"
          icon={Users}
          tone="emerald"
        />
        <MetricCard
          label="Altas pendientes"
          value={overview.registrationsPending}
          hint="Por revisar"
          trend="neutral"
          icon={ClipboardList}
          tone="amber"
        />
        <MetricCard
          label="Tickets abiertos"
          value={overview.supportOpen}
          hint={`${overview.supportUrgent} urgentes`}
          trend={overview.supportUrgent > 0 ? 'down' : 'neutral'}
          trendLabel={overview.supportUrgent > 0 ? `${overview.supportUrgent} urgentes` : 'Estable'}
          icon={Headphones}
          tone="sky"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="pf-card pf-animate-in p-5">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-brand-600" aria-hidden />
            <h2 className="font-semibold text-ink">Acciones pendientes</h2>
          </div>
          <ul className="mt-4 space-y-3">
            {pendingActions.map((action) => (
              <li
                key={action.id}
                className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-colors hover:border-brand-200 hover:bg-brand-50/30 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-ink">{action.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{action.description}</p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    window.location.href = action.href
                  }}
                >
                  {action.buttonLabel}
                </Button>
              </li>
            ))}
          </ul>
        </section>

        <section className="pf-card pf-animate-in p-5">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-600" aria-hidden />
            <h2 className="font-semibold text-ink">Estado de servicios</h2>
          </div>
          <ul className="mt-4 space-y-2">
            {health.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3 transition-colors hover:bg-slate-50"
              >
                <span className="text-sm font-medium text-slate-700">{item.label}</span>
                <Badge
                  tone={
                    item.status.includes('degrad') || item.status.includes('caida')
                      ? 'warning'
                      : 'success'
                  }
                >
                  {item.status}
                </Badge>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="pf-card pf-animate-in p-5">
        <h2 className="font-semibold text-ink">Actividad reciente</h2>
        <ul className="mt-4 divide-y divide-slate-100">
          {activity.slice(0, 8).map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-1 py-3 transition-colors hover:bg-slate-50/50 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-medium text-ink">{item.title}</p>
                <p className="text-xs text-slate-500">{item.module}</p>
              </div>
              <time className="text-xs text-slate-500">{item.at}</time>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

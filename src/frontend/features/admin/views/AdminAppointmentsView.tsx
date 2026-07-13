import { useMemo } from 'react'
import { isActiveStatus } from '@/lib/appointments'
import { statusLabel } from '@/lib/format'
import { useDemoStore } from '@/hooks/useDemoStore'
import { useTenant } from '@/hooks/useTenant'
import { CalendarDays, CheckCircle2, Clock3, Users } from 'lucide-react'
import { MetricCard } from '@/frontend/platform/components/ui/MetricCard'
import { Badge, Card, PageState } from '@/frontend/ds'

export const AdminAppointmentsView = () => {
  const { state } = useDemoStore()
  const tenant = useTenant()

  const rows = useMemo(
    () =>
      state.appointments
        .filter((a) => a.clinicId === tenant.id)
        .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`)),
    [state.appointments, tenant.id]
  )

  if (!rows.length) {
    return (
      <PageState
        variant="empty"
        title="Sin citas"
        description="Cuando reserves o recibas citas aparecerán aquí."
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="pf-stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Citas totales"
          value={rows.length}
          hint="en esta clínica"
          trend="neutral"
          icon={CalendarDays}
          tone="brand"
        />
        <MetricCard
          label="Activas"
          value={rows.filter((a) => isActiveStatus(a.status)).length}
          hint="hoy y próximas"
          trend="up"
          trendLabel="+3%"
          icon={Clock3}
          tone="emerald"
        />
        <MetricCard
          label="Confirmadas"
          value={rows.filter((a) => a.status === 'confirmed').length}
          hint="estado actual"
          trend="neutral"
          icon={CheckCircle2}
          tone="sky"
        />
        <MetricCard
          label="Pacientes únicos"
          value={new Set(rows.map((r) => r.patientId)).size}
          hint="con citas"
          trend="neutral"
          icon={Users}
          tone="amber"
        />
      </div>

      <Card padding="none" className="pf-card overflow-hidden">
        <ul className="divide-y divide-slate-100">
          {rows.map((appt) => (
            <li
              key={appt.id}
              className="pf-table-row flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6"
            >
              <div>
                <p className="font-medium text-ink">{appt.patientName}</p>
                <p className="text-sm text-slate-600">
                  {appt.date} · {appt.time} · {appt.treatment}
                </p>
              </div>
              <Badge tone={isActiveStatus(appt.status) ? 'brand' : 'neutral'}>
                {statusLabel(appt.status)}
              </Badge>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}

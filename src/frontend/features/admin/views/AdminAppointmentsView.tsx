import { useMemo } from 'react'
import { isActiveStatus } from '@/lib/appointments'
import { statusLabel } from '@/lib/format'
import { useDemoStore } from '@/hooks/useDemoStore'
import { useTenant } from '@/hooks/useTenant'
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
    <Card padding="none" className="overflow-hidden">
      <ul className="divide-y divide-slate-100">
        {rows.map((appt) => (
          <li key={appt.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
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
  )
}

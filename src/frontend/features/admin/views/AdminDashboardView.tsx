import { Calendar, CheckCircle2, Euro, Users } from 'lucide-react'
import { isActiveStatus } from '@/lib/appointments'
import { money, todayIso } from '@/lib/format'
import { patientsForTenant } from '@/lib/tenant'
import { useDemoStore } from '@/hooks/useDemoStore'
import { useTenant } from '@/hooks/useTenant'
import { Card } from '@/frontend/ds'

const Kpi = ({
  label,
  value,
  icon: Icon
}: {
  label: string
  value: string
  icon: typeof Users
}) => (
  <Card className="flex gap-4">
    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
      <Icon className="h-5 w-5" aria-hidden />
    </span>
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-ink">{value}</p>
    </div>
  </Card>
)

export const AdminDashboardView = () => {
  const { state } = useDemoStore()
  const tenant = useTenant()
  const today = todayIso()

  const appointments = state.appointments.filter(
    (a) => a.clinicId === tenant.id && a.date === today && isActiveStatus(a.status)
  )
  const patients = patientsForTenant(state, tenant.id)
  const revenue = state.invoices
    .filter((inv) => inv.clinicId === tenant.id && inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.totalCents, 0)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Citas hoy" value={String(appointments.length)} icon={Calendar} />
        <Kpi label="Pacientes" value={String(patients.length)} icon={Users} />
        <Kpi label="Confirmadas" value={String(appointments.filter((a) => a.status === 'confirmed').length)} icon={CheckCircle2} />
        <Kpi label="Cobrado" value={money(revenue)} icon={Euro} />
      </div>

      <Card>
        <h2 className="font-semibold text-ink">Próximas citas</h2>
        <ul className="mt-4 divide-y divide-slate-100">
          {appointments.slice(0, 6).map((appt) => (
            <li key={appt.id} className="flex items-center justify-between py-3 text-sm">
              <span className="font-medium text-ink">{appt.patientName}</span>
              <span className="text-slate-500">
                {appt.time} · {appt.treatment}
              </span>
            </li>
          ))}
          {!appointments.length ? (
            <li className="py-6 text-center text-sm text-slate-500">No hay citas activas para hoy.</li>
          ) : null}
        </ul>
      </Card>
    </div>
  )
}

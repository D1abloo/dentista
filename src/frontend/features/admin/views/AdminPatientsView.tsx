import { useMemo, useState } from 'react'
import { patientsForTenant } from '@/lib/tenant'
import { useDemoStore } from '@/hooks/useDemoStore'
import { useTenant } from '@/hooks/useTenant'
import { Users } from 'lucide-react'
import { Avatar } from '@/frontend/ds/Avatar'
import { MetricCard } from '@/frontend/platform/components/ui/MetricCard'
import { Badge, Card, Input, PageState } from '@/frontend/ds'

export const AdminPatientsView = ({ focusId }: { focusId?: string }) => {
  const { state } = useDemoStore()
  const tenant = useTenant()
  const [query, setQuery] = useState('')

  const allPatients = useMemo(() => patientsForTenant(state, tenant.id), [state, tenant.id])

  const patients = useMemo(() => {
    const rows = allPatients
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (p) => p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q)
    )
  }, [allPatients, query])

  if (focusId) {
    const patient = patients.find((p) => p.id === focusId)
    if (!patient) {
      return <PageState variant="error" title="Paciente no encontrado" />
    }
    return (
      <Card className="pf-card pf-animate-in p-5">
        <h2 className="font-display text-xl font-semibold">{patient.name}</h2>
        <p className="mt-1 text-sm text-slate-600">{patient.email}</p>
        <p className="mt-4 text-sm text-slate-600">{patient.phone}</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="pf-stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Pacientes"
          value={allPatients.length}
          hint="en esta clínica"
          trend="neutral"
          icon={Users}
          tone="brand"
        />
        <MetricCard
          label="Resultados"
          value={patients.length}
          hint={query.trim() ? 'con filtros aplicados' : 'sin filtros'}
          trend="neutral"
          icon={Users}
          tone="emerald"
        />
      </div>
      <Input
        id="patients-search"
        label="Buscar paciente"
        placeholder="Nombre o email"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {!patients.length ? (
        <PageState variant="empty" title="Sin pacientes" description="Aún no hay pacientes en esta clínica." />
      ) : (
        <Card padding="none" className="pf-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50/95 text-xs uppercase tracking-wide text-slate-500 backdrop-blur">
                <tr>
                  <th className="px-4 py-3 font-semibold">Paciente</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Teléfono</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patients.map((p) => (
                  <tr key={p.id} className="pf-table-row">
                    <td className="px-4 py-3">
                      <a
                        href={`/admin/pacientes/${p.id}`}
                        className="flex items-center gap-3 font-medium text-ink hover:text-brand-700"
                      >
                        <Avatar name={p.name} size="sm" />
                        <span className="truncate">{p.name}</span>
                      </a>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{p.email}</td>
                    <td className="px-4 py-3 text-slate-600">{p.phone}</td>
                    <td className="px-4 py-3">
                      <Badge tone="success">Activo</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}

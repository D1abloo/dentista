import { useMemo, useState } from 'react'
import { patientsForTenant } from '@/lib/tenant'
import { useDemoStore } from '@/hooks/useDemoStore'
import { useTenant } from '@/hooks/useTenant'
import { Badge, Card, Input, PageState } from '@/frontend/ds'

export const AdminPatientsView = ({ focusId }: { focusId?: string }) => {
  const { state } = useDemoStore()
  const tenant = useTenant()
  const [query, setQuery] = useState('')

  const patients = useMemo(() => {
    const rows = patientsForTenant(state, tenant.id)
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (p) => p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q)
    )
  }, [state, tenant.id, query])

  if (focusId) {
    const patient = patients.find((p) => p.id === focusId)
    if (!patient) {
      return <PageState variant="error" title="Paciente no encontrado" />
    }
    return (
      <Card>
        <h2 className="font-display text-xl font-semibold">{patient.name}</h2>
        <p className="mt-1 text-sm text-slate-600">{patient.email}</p>
        <p className="mt-4 text-sm text-slate-600">{patient.phone}</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
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
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Nombre</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Teléfono</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {patients.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-ink">
                    <a href={`/admin/pacientes/${p.id}`} className="hover:text-brand-700">
                      {p.name}
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
      )}
    </div>
  )
}

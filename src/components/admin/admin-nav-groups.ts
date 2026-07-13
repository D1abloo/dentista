import type { AdminView } from './nav'

export type AdminNavGroupDef = {
  id: string
  label: string
  views: AdminView[]
}

/** Agrupación del menú completo (modo expandido). */
export const adminFullNavGroups: AdminNavGroupDef[] = [
  { id: 'overview', label: 'Resumen', views: ['dashboard'] },
  { id: 'operations', label: 'Operaciones', views: ['operaciones', 'agenda', 'citas', 'pacientes'] },
  { id: 'documentation', label: 'Documentación', views: ['informes', 'consentimientos', 'documentos'] },
  { id: 'team', label: 'Equipo y sedes', views: ['profesionales', 'tratamientos', 'clinicas'] },
  { id: 'finance', label: 'Finanzas', views: ['facturas', 'pagos'] },
  { id: 'insights', label: 'Análisis', views: ['reportes', 'notificaciones'] },
  { id: 'compliance', label: 'Cumplimiento', views: ['normativa', 'acceso-portal', 'auditoria-pdp', 'monitorizacion'] },
  { id: 'system', label: 'Sistema', views: ['configuracion', 'usuarios'] }
]

/** Agrupación del menú compacto (modo habitual del panel). */
export const adminCompactNavGroups: AdminNavGroupDef[] = [
  { id: 'overview', label: 'Resumen', views: ['dashboard'] },
  {
    id: 'clinical',
    label: 'Clínica',
    views: ['operaciones', 'agenda', 'pacientes', 'documentos', 'informes', 'profesionales']
  },
  { id: 'finance', label: 'Finanzas', views: ['facturas', 'pagos'] },
  { id: 'system', label: 'Sistema', views: ['reportes', 'notificaciones', 'configuracion'] }
]

export function groupNavItems<T extends { view: AdminView; href: string }>(
  items: T[],
  groups: AdminNavGroupDef[]
): { group: AdminNavGroupDef; items: T[] }[] {
  const used = new Set<string>()
  const result: { group: AdminNavGroupDef; items: T[] }[] = []

  for (const group of groups) {
    const groupItems: T[] = []
    for (const view of group.views) {
      for (const item of items) {
        if (item.view === view && !used.has(item.href)) {
          used.add(item.href)
          groupItems.push(item)
        }
      }
    }
    if (groupItems.length) result.push({ group, items: groupItems })
  }

  const remaining = items.filter((item) => !used.has(item.href))
  if (remaining.length) {
    result.push({
      group: { id: 'resources', label: 'Recursos', views: [] },
      items: remaining
    })
  }

  return result
}

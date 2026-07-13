import type { AdminView } from '@/components/admin/nav'
import { adminNav } from '@/components/admin/nav'

type GroupDef = { id: string; label: string; views: AdminView[] }

const adminGroupDefs: GroupDef[] = [
  { id: 'main', label: 'Principal', views: ['dashboard', 'operaciones'] },
  { id: 'care', label: 'Atención', views: ['agenda', 'citas', 'pacientes'] },
  { id: 'records', label: 'Expediente', views: ['informes', 'consentimientos', 'documentos'] },
  { id: 'finance', label: 'Finanzas', views: ['facturas', 'pagos'] },
  { id: 'team', label: 'Equipo y sedes', views: ['profesionales', 'tratamientos', 'clinicas', 'usuarios'] },
  {
    id: 'admin',
    label: 'Administración',
    views: [
      'reportes',
      'normativa',
      'notificaciones',
      'configuracion',
      'acceso-portal',
      'auditoria-pdp',
      'monitorizacion'
    ]
  }
]

export const buildAdminNavGroups = (
  visibleItems: typeof adminNav
): { id: string; label: string; items: { href: string; label: string; icon: (typeof adminNav)[0]['icon'] }[] }[] => {
  const byView = new Map(visibleItems.map((item) => [item.view, item]))
  const helpItem = visibleItems.find((i) => i.href.includes('/ayuda'))

  const groups = adminGroupDefs
    .map((def) => ({
      id: def.id,
      label: def.label,
      items: def.views
        .map((view) => byView.get(view))
        .filter((item): item is (typeof adminNav)[0] => Boolean(item))
        .map(({ href, label, icon }) => ({ href, label, icon }))
    }))
    .filter((g) => g.items.length > 0)

  if (helpItem) {
    groups.push({
      id: 'help',
      label: 'Ayuda',
      items: [{ href: helpItem.href, label: helpItem.label, icon: helpItem.icon }]
    })
  }

  return groups
}

export type { AdminView }

import type { PatientView } from '@/frontend/features/patient/PatientApp'
import type { LucideIcon } from 'lucide-react'

type NavItem = { href: string; label: string; icon: LucideIcon; view: PatientView }

const groupDefs: { id: string; label: string; views: PatientView[] }[] = [
  { id: 'home', label: 'Inicio', views: ['dashboard', 'reservar'] },
  { id: 'appointments', label: 'Citas', views: ['citas', 'citas-pasadas', 'citas-completadas', 'historial'] },
  {
    id: 'docs',
    label: 'Documentación',
    views: ['informes', 'documentos', 'facturas', 'pagos', 'consentimientos']
  },
  { id: 'account', label: 'Cuenta', views: ['mensajes', 'perfil', 'ayuda'] },
  { id: 'staff', label: 'Profesional', views: ['gestion-clinica'] }
]

export const buildPatientNavGroups = (items: NavItem[]) => {
  const byView = new Map(items.map((item) => [item.view, item]))
  return groupDefs
    .map((def) => ({
      id: def.id,
      label: def.label,
      items: def.views
        .map((view) => byView.get(view))
        .filter((item): item is NavItem => Boolean(item))
        .map(({ href, label, icon }) => ({ href, label, icon }))
    }))
    .filter((g) => g.items.length > 0)
}

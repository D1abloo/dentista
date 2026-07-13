import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  Building2,
  ClipboardList,
  History,
  LayoutDashboard,
  LifeBuoy,
  Settings,
  Shield,
  ShieldCheck,
  Ticket,
  Users
} from 'lucide-react'
import type { PlatformView } from '@/frontend/features/platform/nav'

export type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  view: PlatformView
}

export type NavGroup = {
  id: string
  label: string
  items: NavItem[]
}

export const platformNavGroups: NavGroup[] = [
  {
    id: 'principal',
    label: 'Principal',
    items: [{ href: '/platform', label: 'Resumen', icon: LayoutDashboard, view: 'overview' }]
  },
  {
    id: 'gestion',
    label: 'Gestión',
    items: [
      { href: '/platform/organizaciones', label: 'Organizaciones', icon: Building2, view: 'organizaciones' },
      { href: '/platform/clinicas', label: 'Clínicas', icon: ClipboardList, view: 'clinicas' },
      { href: '/platform/usuarios', label: 'Usuarios', icon: Users, view: 'usuarios' },
      { href: '/platform/registros', label: 'Altas', icon: ClipboardList, view: 'registros' },
      { href: '/platform/suscripciones', label: 'Suscripciones', icon: ShieldCheck, view: 'suscripciones' }
    ]
  },
  {
    id: 'operaciones',
    label: 'Operaciones',
    items: [
      { href: '/platform/incidencias', label: 'Incidencias', icon: Ticket, view: 'incidencias' },
      { href: '/platform/soporte', label: 'Soporte', icon: LifeBuoy, view: 'soporte' },
      { href: '/platform/aislamiento', label: 'Aislamiento', icon: Shield, view: 'aislamiento' }
    ]
  },
  {
    id: 'analitica',
    label: 'Analítica',
    items: [
      { href: '/platform/metricas', label: 'Métricas', icon: Activity, view: 'metricas' },
      { href: '/platform/monitorizacion', label: 'Monitorización', icon: Activity, view: 'monitorizacion' },
      { href: '/platform/historial', label: 'Historial', icon: History, view: 'historial' }
    ]
  },
  {
    id: 'admin',
    label: 'Administración',
    items: [
      { href: '/platform/configuracion', label: 'Configuración', icon: Settings, view: 'configuracion' },
      { href: '/platform/seguridad', label: 'Seguridad', icon: Shield, view: 'seguridad' },
      { href: '/platform/auditoria', label: 'Auditoría', icon: ShieldCheck, view: 'auditoria' }
    ]
  }
]

export const allNavItems = platformNavGroups.flatMap((g) => g.items)

export const viewFromPath = (path: string): PlatformView => {
  const hit = allNavItems.find((item) => path === item.href || path.startsWith(`${item.href}/`))
  return hit?.view ?? 'overview'
}

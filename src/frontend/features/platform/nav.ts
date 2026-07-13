import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  Building2,
  ClipboardList,
  History,
  LayoutDashboard,
  LifeBuoy,
  Shield,
  Ticket,
  Users
} from 'lucide-react'

export type PlatformView =
  | 'overview'
  | 'organizaciones'
  | 'clinicas'
  | 'usuarios'
  | 'incidencias'
  | 'aislamiento'
  | 'registros'
  | 'historial'
  | 'suscripciones'
  | 'soporte'
  | 'metricas'
  | 'configuracion'
  | 'seguridad'
  | 'auditoria'
  | 'monitorizacion'

export const platformTitles: Record<PlatformView, string> = {
  overview: 'Resumen de plataforma',
  organizaciones: 'Organizaciones',
  clinicas: 'Clínicas',
  usuarios: 'Usuarios',
  incidencias: 'Incidencias',
  aislamiento: 'Aislamiento multi-tenant',
  registros: 'Altas pendientes',
  historial: 'Historial de altas',
  suscripciones: 'Suscripciones',
  soporte: 'Soporte',
  metricas: 'Métricas',
  configuracion: 'Configuración',
  seguridad: 'Seguridad',
  auditoria: 'Auditoría',
  monitorizacion: 'Monitorización'
}

export const platformNav: { href: string; label: string; icon: LucideIcon; view: PlatformView }[] = [
  { href: '/platform', label: 'Resumen', icon: LayoutDashboard, view: 'overview' },
  { href: '/platform/organizaciones', label: 'Organizaciones', icon: Building2, view: 'organizaciones' },
  { href: '/platform/clinicas', label: 'Clínicas', icon: ClipboardList, view: 'clinicas' },
  { href: '/platform/usuarios', label: 'Usuarios', icon: Users, view: 'usuarios' },
  { href: '/platform/incidencias', label: 'Incidencias', icon: Ticket, view: 'incidencias' },
  { href: '/platform/aislamiento', label: 'Aislamiento', icon: Shield, view: 'aislamiento' },
  { href: '/platform/registros', label: 'Altas', icon: ClipboardList, view: 'registros' },
  { href: '/platform/historial', label: 'Historial', icon: History, view: 'historial' },
  { href: '/platform/suscripciones', label: 'Suscripciones', icon: ClipboardList, view: 'suscripciones' },
  { href: '/platform/soporte', label: 'Soporte', icon: LifeBuoy, view: 'soporte' },
  { href: '/platform/metricas', label: 'Métricas', icon: Activity, view: 'metricas' },
  { href: '/platform/configuracion', label: 'Configuración', icon: Shield, view: 'configuracion' },
  { href: '/platform/seguridad', label: 'Seguridad', icon: Shield, view: 'seguridad' },
  { href: '/platform/auditoria', label: 'Auditoría', icon: Shield, view: 'auditoria' },
  { href: '/platform/monitorizacion', label: 'Monitorización', icon: Activity, view: 'monitorizacion' }
]

export const platformApiMap: Record<PlatformView, string> = {
  overview: '/api/platform/overview',
  organizaciones: '/api/platform/organizations',
  clinicas: '/api/platform/clinics',
  usuarios: '/api/platform/users',
  incidencias: '/api/platform/incidents',
  aislamiento: '/api/platform/security',
  registros: '/api/platform/registrations',
  historial: '/api/platform/history',
  suscripciones: '/api/platform/subscriptions',
  soporte: '/api/platform/support',
  metricas: '/api/platform/metrics',
  configuracion: '/api/platform/settings',
  seguridad: '/api/platform/security',
  auditoria: '/api/platform/audit',
  monitorizacion: '/api/platform/monitoring'
}

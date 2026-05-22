import type { PlatformDashboardPayload } from '@/lib/platform/dashboardTypes';

export function platformDashboardDemo(): PlatformDashboardPayload {
  return {
    overview: {
      clinicsTotal: 1,
      clinicsActive: 1,
      clinicsNewMonth: 0,
      staffUsers: 1,
      staffNewMonth: 0,
      registrationsPending: 1,
      supportOpen: 1,
      supportUrgent: 1,
      tenantsLinked: 1,
      tenantsTotal: 1,
      isolationIncidents: 0,
      lastIsolationReview: 'Hoy, 08:45',
      mrr: 0,
      mrrTrendPct: 0,
      activePct: 100
    },
    pendingActions: [
      {
        id: 'reg',
        title: '1 registro de clínica pendiente de aprobación',
        description: 'Revisa y aprueba el registro para habilitar acceso.',
        tone: 'action',
        href: '/platform/registros',
        buttonLabel: 'Revisar'
      },
      {
        id: 'ticket',
        title: '1 ticket de soporte abierto',
        description: 'Asigna o responde el ticket para cumplir el SLA.',
        tone: 'action',
        href: '/platform/soporte',
        buttonLabel: 'Ver ticket'
      },
      {
        id: 'crit',
        title: '0 incidencias críticas',
        description: 'No hay incidencias críticas activas.',
        tone: 'ok',
        href: '/platform/incidencias',
        buttonLabel: 'Todo correcto'
      },
      {
        id: 'tenants',
        title: '0 tenants sin configurar',
        description: 'Todos los tenants están correctamente configurados.',
        tone: 'ok',
        href: '/platform/organizaciones',
        buttonLabel: 'Todo correcto'
      }
    ],
    activity: [
      {
        id: 'a1',
        title: 'Clínica Dental Nova fue aprobada',
        module: 'Clínicas',
        at: 'Hoy, 10:35',
        href: '/platform/clinicas'
      },
      {
        id: 'a2',
        title: 'Usuario staff creado',
        module: 'Usuarios',
        at: 'Hoy, 09:12',
        href: '/platform/usuarios'
      },
      {
        id: 'a3',
        title: 'Tenant vinculado correctamente',
        module: 'Tenants',
        at: 'Ayer, 18:45',
        href: '/platform/organizaciones'
      },
      {
        id: 'a4',
        title: 'Ticket de soporte abierto',
        module: 'Soporte',
        at: 'Ayer, 16:22',
        href: '/platform/soporte'
      },
      {
        id: 'a5',
        title: 'Configuración de aislamiento revisada',
        module: 'Seguridad',
        at: 'Ayer, 11:05',
        href: '/platform/aislamiento'
      }
    ],
    health: [
      { id: 'api', label: 'API', status: 'operativa' },
      { id: 'db', label: 'Base de datos', status: 'operativa' },
      { id: 'storage', label: 'Storage', status: 'operativo' },
      { id: 'email', label: 'Emails', status: 'operativo' },
      { id: 'pdf', label: 'Generación de PDFs', status: 'operativo' },
      { id: 'backup', label: 'Backups', status: 'operativo', detail: 'Hoy, 03:00' }
    ],
    plans: [
      { id: 'pro', label: 'Plan Pro', count: 1, pct: 100 },
      { id: 'basic', label: 'Plan Básico', count: 0, pct: 0 },
      { id: 'trial', label: 'Plan Trial', count: 0, pct: 0 },
      { id: 'free', label: 'Plan Gratuito', count: 0, pct: 0 }
    ],
    subscriptions: { active: 1, canceled: 0 },
    alerts: { warnings: 0, critical: 0, info: 0 },
    sparklines: {
      clinics: [2, 3, 2, 4, 3, 5, 4],
      active: [1, 2, 2, 3, 2, 4, 3],
      staff: [0, 1, 1, 1, 2, 1, 2],
      pending: [2, 1, 3, 2, 1, 0, 1],
      tickets: [0, 1, 0, 2, 1, 1, 2],
      mrr: [0, 0, 0, 0, 0, 0, 0]
    }
  };
}

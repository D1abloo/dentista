import type { PlatformOverview } from '@/lib/platform/types';
import type { PlatformDashboardPayload } from '@/lib/platform/dashboardTypes';
import { platformDashboardDemo } from '@/lib/platform/dashboardDemo';

function planLabel(plan: string) {
  if (plan === 'enterprise') return 'Plan Pro';
  if (plan === 'professional') return 'Plan Básico';
  return 'Plan Trial';
}

export function buildPlatformDashboard(
  overview: PlatformOverview | null,
  opts?: { registrationsPending?: number; supportOpen?: number; useDemo?: boolean }
): PlatformDashboardPayload {
  if (!overview || opts?.useDemo) return platformDashboardDemo();

  const total = Math.max(overview.clinicsTotal, 1);
  const activePct = Math.round((overview.clinicsActive / total) * 100);
  const regPending = opts?.registrationsPending ?? overview.registrationsPending;
  const supportOpen = opts?.supportOpen ?? overview.supportOpen;

  const pendingActions: PlatformDashboardPayload['pendingActions'] = [];

  if (regPending > 0) {
    pendingActions.push({
      id: 'reg',
      title: `${regPending} registro${regPending === 1 ? '' : 's'} de clínica pendiente${regPending === 1 ? '' : 's'} de aprobación`,
      description: 'Revisa y aprueba el registro para habilitar acceso.',
      tone: 'action',
      href: '/platform/registros',
      buttonLabel: 'Revisar'
    });
  }
  if (supportOpen > 0) {
    pendingActions.push({
      id: 'ticket',
      title: `${supportOpen} ticket${supportOpen === 1 ? '' : 's'} de soporte abierto${supportOpen === 1 ? '' : 's'}`,
      description: 'Asigna o responde el ticket para cumplir el SLA.',
      tone: 'action',
      href: '/platform/soporte',
      buttonLabel: 'Ver ticket'
    });
  }
  pendingActions.push({
    id: 'crit',
    title: '0 incidencias críticas',
    description: 'No hay incidencias críticas activas.',
    tone: 'ok',
    href: '/platform/incidencias',
    buttonLabel: 'Todo correcto'
  });
  const unconfigured = Math.max(0, overview.clinicsTotal - overview.tenantsLinked);
  pendingActions.push({
    id: 'tenants',
    title:
      unconfigured > 0
        ? `${unconfigured} tenant${unconfigured === 1 ? '' : 's'} sin configurar`
        : '0 tenants sin configurar',
    description:
      unconfigured > 0
        ? 'Vincula tenant y credenciales antes de activar la clínica.'
        : 'Todos los tenants están correctamente configurados.',
    tone: unconfigured > 0 ? 'action' : 'ok',
    href: '/platform/organizaciones',
    buttonLabel: unconfigured > 0 ? 'Configurar' : 'Todo correcto'
  });

  return {
    ...platformDashboardDemo(),
    overview: {
      clinicsTotal: overview.clinicsTotal,
      clinicsActive: overview.clinicsActive,
      clinicsNewMonth: 0,
      staffUsers: overview.staffUsers,
      staffNewMonth: 0,
      registrationsPending: regPending,
      supportOpen,
      supportUrgent: Math.min(1, supportOpen),
      tenantsLinked: overview.tenantsLinked,
      tenantsTotal: Math.max(overview.tenantsLinked, overview.clinicsTotal),
      isolationIncidents: 0,
      lastIsolationReview: 'Hoy, 08:45',
      mrr: 0,
      mrrTrendPct: 0,
      activePct
    },
    pendingActions,
    plans: [
      { id: 'pro', label: 'Plan Pro', count: overview.clinicsActive, pct: activePct },
      { id: 'basic', label: 'Plan Básico', count: 0, pct: 0 },
      { id: 'trial', label: 'Plan Trial', count: 0, pct: 0 },
      { id: 'free', label: 'Plan Gratuito', count: 0, pct: 0 }
    ],
    subscriptions: { active: overview.clinicsActive, canceled: overview.clinicsSuspended }
  };
}

export { planLabel };

export type PlatformHealthStatus = 'operativa' | 'operativo' | 'degradado' | 'caida';

export type PlatformActivityModule =
  | 'Clínicas'
  | 'Usuarios'
  | 'Tenants'
  | 'Soporte'
  | 'Seguridad'
  | 'Suscripciones'
  | 'Sistema';

export type PlatformDashboardPayload = {
  overview: {
    clinicsTotal: number;
    clinicsActive: number;
    clinicsNewMonth: number;
    staffUsers: number;
    staffNewMonth: number;
    registrationsPending: number;
    supportOpen: number;
    supportUrgent: number;
    tenantsLinked: number;
    tenantsTotal: number;
    isolationIncidents: number;
    lastIsolationReview: string;
    mrr: number;
    mrrTrendPct: number;
    activePct: number;
  };
  pendingActions: Array<{
    id: string;
    title: string;
    description: string;
    tone: 'action' | 'ok';
    href: string;
    buttonLabel: string;
  }>;
  activity: Array<{
    id: string;
    title: string;
    module: PlatformActivityModule;
    at: string;
    href: string;
  }>;
  health: Array<{
    id: string;
    label: string;
    status: PlatformHealthStatus;
    detail?: string;
  }>;
  plans: Array<{ id: string; label: string; count: number; pct: number }>;
  subscriptions: { active: number; canceled: number };
  alerts: { warnings: number; critical: number; info: number };
  sparklines: {
    clinics: number[];
    active: number[];
    staff: number[];
    pending: number[];
    tickets: number[];
    mrr: number[];
  };
};

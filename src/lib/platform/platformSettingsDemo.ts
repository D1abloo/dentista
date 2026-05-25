export type EmailTemplateKey = 'welcome' | 'credentials' | 'rejection' | 'paymentReminder';

export type PlatformSettingsConfig = {
  branding: {
    appName: string;
    supportEmail: string;
    publicUrl: string;
    footerLegal: string;
    primaryColor: string;
    secondaryColor: string;
    logoMain: string | null;
    logoCompact: string | null;
    favicon: string | null;
  };
  registration: {
    autoApprove: boolean;
    requireEmailVerification: boolean;
    requireTaxData: boolean;
    requirePhone: boolean;
    requireTerms: boolean;
    autoTenantOnApprove: boolean;
    sendAdminCredentials: boolean;
    defaultIsolation: boolean;
    manualReviewProMulti: boolean;
    defaultPlan: string;
    initialSeats: number;
  };
  security: {
    require2fa: boolean;
    strongPassword: boolean;
    blockFailedAttempts: boolean;
    auditSensitive: boolean;
    sessionExpiryMinutes: number;
    maxFailedAttempts: number;
  };
  emails: {
    fromEmail: string;
    fromName: string;
    templates: Record<EmailTemplateKey, string>;
  };
  limits: {
    initialSeats: number;
    maxFileSizeMb: number;
    logRetentionDays: number;
    maxOpenTickets: number;
    clinicsPerOrg: number;
    docsPerClinic: number;
  };
  integrations: {
    stripeEnabled: boolean;
    redisCache: boolean;
    webhooksEnabled: boolean;
  };
  advanced: {
    maintenanceMode: boolean;
    debugRequests: boolean;
  };
};

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettingsConfig = {
  branding: {
    appName: 'AgendaClinic',
    supportEmail: 'soporte@dentista.app',
    publicUrl: 'https://dentista.app',
    footerLegal: '© 2026 AgendaClinic. Todos los derechos reservados.',
    primaryColor: '#0EA5A1',
    secondaryColor: '#6366F1',
    logoMain: null,
    logoCompact: null,
    favicon: null
  },
  registration: {
    autoApprove: false,
    requireEmailVerification: true,
    requireTaxData: true,
    requirePhone: true,
    requireTerms: true,
    autoTenantOnApprove: true,
    sendAdminCredentials: true,
    defaultIsolation: true,
    manualReviewProMulti: false,
    defaultPlan: 'Profesional',
    initialSeats: 10
  },
  security: {
    require2fa: true,
    strongPassword: true,
    blockFailedAttempts: true,
    auditSensitive: true,
    sessionExpiryMinutes: 60,
    maxFailedAttempts: 5
  },
  emails: {
    fromEmail: 'soporte@dentista.app',
    fromName: 'AgendaClinic',
    templates: {
      welcome: 'Bienvenida a AgendaClinic — tu clínica ha sido aprobada.',
      credentials: 'Credenciales de acceso al panel de administración.',
      rejection: 'Tu solicitud de alta no ha podido ser aprobada en este momento.',
      paymentReminder: 'Recordatorio de renovación de suscripción.'
    }
  },
  limits: {
    initialSeats: 10,
    maxFileSizeMb: 10,
    logRetentionDays: 180,
    maxOpenTickets: 50,
    clinicsPerOrg: 1,
    docsPerClinic: 10000
  },
  integrations: {
    stripeEnabled: false,
    redisCache: false,
    webhooksEnabled: false
  },
  advanced: {
    maintenanceMode: false,
    debugRequests: false
  }
};

let demoStore: PlatformSettingsConfig = structuredClone(DEFAULT_PLATFORM_SETTINGS);

function cloneConfig(c: PlatformSettingsConfig): PlatformSettingsConfig {
  return structuredClone(c);
}

export function getPlatformSettingsDemo(): PlatformSettingsConfig {
  return cloneConfig(demoStore);
}

export function savePlatformSettingsDemo(config: PlatformSettingsConfig): PlatformSettingsConfig {
  demoStore = cloneConfig(config);
  return getPlatformSettingsDemo();
}

export function resetPlatformSettingsDemo(): PlatformSettingsConfig {
  demoStore = structuredClone(DEFAULT_PLATFORM_SETTINGS);
  return getPlatformSettingsDemo();
}

export type SettingsSummary = {
  app: string;
  support: string;
  registration: string;
  emailVerified: string;
  autoTenant: string;
  defaultPlan: string;
  isolation: string;
  audit: string;
};

export function buildSettingsSummary(c: PlatformSettingsConfig): SettingsSummary {
  return {
    app: c.branding.appName,
    support: c.branding.supportEmail,
    registration: c.registration.autoApprove ? 'Aprobación automática' : 'Revisión manual',
    emailVerified: c.registration.requireEmailVerification ? 'Obligatorio' : 'Opcional',
    autoTenant: c.registration.autoTenantOnApprove ? 'Tras aprobación' : 'Manual',
    defaultPlan: c.registration.defaultPlan,
    isolation: c.registration.defaultIsolation ? 'Activo' : 'Inactivo',
    audit: c.security.auditSensitive ? 'Activa' : 'Inactiva'
  };
}

export function validatePlatformSettings(c: PlatformSettingsConfig): Record<string, string> {
  const err: Record<string, string> = {};
  if (!c.branding.appName.trim()) err.appName = 'El nombre de la app es obligatorio.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.branding.supportEmail)) err.supportEmail = 'Introduce un email de soporte válido.';
  try {
    new URL(c.branding.publicUrl);
  } catch {
    err.publicUrl = 'Introduce una URL válida.';
  }
  if (!c.registration.initialSeats || c.registration.initialSeats < 1) err.initialSeats = 'El límite de asientos debe ser mayor que 0.';
  if (!c.limits.maxFileSizeMb || c.limits.maxFileSizeMb < 1) err.maxFileSizeMb = 'El tamaño máximo de archivo debe ser válido.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.emails.fromEmail)) err.fromEmail = 'Introduce un email de soporte válido.';
  return err;
}

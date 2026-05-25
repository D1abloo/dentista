/** Tipos de consulta del formulario público (/contacto). */
export const CONTACT_CONSULT_TYPES = [
  { value: 'soporte', label: 'Soporte general' },
  { value: 'paciente', label: 'Portal del paciente' },
  { value: 'clinica', label: 'Panel de clínica' },
  { value: 'facturacion', label: 'Facturación y pagos' },
  { value: 'tecnico', label: 'Incidencia técnica' },
  { value: 'portal', label: 'Acceso o contraseña' },
  { value: 'otro', label: 'Otra consulta' }
] as const;

export type ContactConsultType = (typeof CONTACT_CONSULT_TYPES)[number]['value'];

export type ContactPageVariant = {
  id: string;
  badge: string;
  title: string;
  lead: string;
  defaultType: ContactConsultType;
  messagePlaceholder: string;
  showClinicField: boolean;
};

const DEFAULT_VARIANT: ContactPageVariant = {
  id: 'default',
  badge: 'Contacto',
  title: 'Hablemos con tu clínica',
  lead: 'Resolvemos dudas sobre el portal del paciente, el panel de clínica y la plataforma AgendaClinic. Respuesta en menos de 24 horas laborables.',
  defaultType: 'soporte',
  messagePlaceholder:
    'Describe tu consulta con el máximo detalle (clínica, usuario afectado, pantalla o error que ves)…',
  showClinicField: true
};

const VARIANTS: Record<string, ContactPageVariant> = {
  soporte: {
    id: 'soporte',
    badge: 'Soporte',
    title: 'Centro de soporte AgendaClinic',
    lead: 'Ayuda para pacientes, equipos de clínica y administradores de la plataforma. Indica tu caso y te respondemos por email con la mayor brevedad posible.',
    defaultType: 'soporte',
    messagePlaceholder:
      'Ej.: no puedo entrar al portal, error al reservar cita, duda de facturación, solicitud de alta de clínica…',
    showClinicField: true
  },
  paciente: {
    id: 'paciente',
    badge: 'Paciente',
    title: 'Soporte para pacientes',
    lead: 'Problemas con citas, informes, documentos, facturas o acceso al portal del paciente.',
    defaultType: 'paciente',
    messagePlaceholder: 'Indica tu clínica, email de registro y qué necesitas resolver…',
    showClinicField: true
  },
  clinica: {
    id: 'clinica',
    badge: 'Clínica',
    title: 'Soporte para clínicas',
    lead: 'Agenda, pacientes, usuarios del equipo, configuración o funcionamiento del panel administrativo.',
    defaultType: 'clinica',
    messagePlaceholder: 'Nombre de la clínica, rol en el equipo y descripción del caso…',
    showClinicField: true
  },
  facturacion: {
    id: 'facturacion',
    badge: 'Facturación',
    title: 'Facturación y pagos',
    lead: 'Consultas sobre facturas, cobros, suscripción o datos de facturación de tu centro.',
    defaultType: 'facturacion',
    messagePlaceholder: 'Referencia de factura, importe o periodo si lo conoces…',
    showClinicField: true
  }
};

export function resolveContactVariant(tipo: string | null): ContactPageVariant {
  if (tipo && tipo in VARIANTS) return VARIANTS[tipo]!;
  return DEFAULT_VARIANT;
}

export function isContactConsultType(value: string): value is ContactConsultType {
  return CONTACT_CONSULT_TYPES.some((t) => t.value === value);
}

export type PublicContactInfo = {
  brandName: string;
  supportEmail: string;
  phone: string | null;
  phoneDisplay: string | null;
  hours: string;
  responseSla: string;
  whatsappUrl: string | null;
};

/** Datos de contacto visibles en la web (configurables con variables PUBLIC_*). */
export function getPublicContactInfo(): PublicContactInfo {
  const supportEmail =
    (import.meta.env.PUBLIC_CONTACT_EMAIL as string | undefined)?.trim() || 'soporte@dentista.app';
  const phoneRaw = (import.meta.env.PUBLIC_CONTACT_PHONE as string | undefined)?.trim() || '';
  const whatsappUrl = (import.meta.env.PUBLIC_WHATSAPP_URL as string | undefined)?.trim() || '';

  return {
    brandName: (import.meta.env.PUBLIC_APP_NAME as string | undefined)?.trim() || 'AgendaClinic',
    supportEmail,
    phone: phoneRaw || null,
    phoneDisplay: phoneRaw || null,
    hours:
      (import.meta.env.PUBLIC_CONTACT_HOURS as string | undefined)?.trim() ||
      'Lunes a viernes, 9:00–18:00 (hora peninsular)',
    responseSla:
      (import.meta.env.PUBLIC_CONTACT_SLA as string | undefined)?.trim() || 'Respuesta en menos de 24 h laborables',
    whatsappUrl: whatsappUrl || null
  };
}

/** Email mostrado en errores de API (servidor). */
export function getContactNotifyEmail(): string {
  const fromServer = typeof process !== 'undefined' ? process.env.CONTACT_NOTIFY_EMAIL?.trim() : '';
  const fromPublic = (import.meta.env.PUBLIC_CONTACT_EMAIL as string | undefined)?.trim();
  return fromServer || fromPublic || 'soporte@dentista.app';
}

export const CONTACT_QUICK_LINKS = [
  { href: '/ayuda', label: 'Centro de ayuda', desc: 'Guías paso a paso' },
  { href: '/portal-paciente', label: 'Portal del paciente', desc: 'Citas y documentos' },
  { href: '/login/admin', label: 'Acceso clínica', desc: 'Panel administrativo' },
  { href: '/registro-clinica', label: 'Alta de clínica', desc: 'Solicitar incorporación' }
] as const;

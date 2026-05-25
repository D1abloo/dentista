import type { LucideIcon } from 'lucide-react';
import {
  Building2,
  Calendar,
  CalendarClock,
  ClipboardList,
  CreditCard,
  FileText,
  Globe,
  Layers,
  Lock,
  MessageSquare,
  Receipt,
  Shield,
  Stethoscope,
  UserRound,
  Users
} from 'lucide-react';

export type WorkflowMock = 'booking' | 'agenda' | 'report' | 'invoice' | 'portal';

export const landingWorkflowSteps = [
  {
    step: 1,
    title: '1. El paciente reserva',
    text: 'El paciente elige clínica, tratamiento, profesional, fecha y hora disponible desde su portal.',
    icon: Calendar,
    mock: 'booking' as WorkflowMock,
    scrollTo: 'modulos-pacientes'
  },
  {
    step: 2,
    title: '2. La clínica organiza',
    text: 'Recepción gestiona agenda, bloqueos horarios, disponibilidad y estados de cita.',
    icon: CalendarClock,
    mock: 'agenda' as WorkflowMock,
    scrollTo: 'modulos-recepcion'
  },
  {
    step: 3,
    title: '3. El doctor documenta',
    text: 'El profesional crea informes odontológicos, adjunta documentos y firma con sus datos clínicos.',
    icon: FileText,
    mock: 'report' as WorkflowMock,
    scrollTo: 'modulos-doctores'
  },
  {
    step: 4,
    title: '4. Administración factura',
    text: 'La clínica genera facturas PDF, registra pagos y comparte recibos.',
    icon: Receipt,
    mock: 'invoice' as WorkflowMock,
    scrollTo: 'modulos-admin'
  },
  {
    step: 5,
    title: '5. El paciente lo consulta',
    text: 'Informes, documentos, facturas, pagos, mensajes y consentimientos aparecen en el Portal del Paciente.',
    icon: UserRound,
    mock: 'portal' as WorkflowMock,
    scrollTo: 'modulos-pacientes'
  }
] as const;

export type RoleModule = {
  id: string;
  title: string;
  subtitle: string;
  tone: 'teal' | 'sky' | 'violet' | 'mint';
  features: string[];
  cta: string;
  href: string;
  icon: LucideIcon;
  illustration: 'agenda' | 'report' | 'billing' | 'portal';
};

export const landingRoleModules: RoleModule[] = [
  {
    id: 'recepcion',
    title: 'Recepción',
    subtitle: 'Agenda y coordinación diaria',
    tone: 'teal',
    features: [
      'Agenda día, semana y mes',
      'Bloqueos horarios',
      'Pacientes y NHC',
      'Recordatorios',
      'Búsqueda rápida'
    ],
    cta: 'Ver agenda clínica',
    href: '/login/admin',
    icon: CalendarClock,
    illustration: 'agenda'
  },
  {
    id: 'doctores',
    title: 'Doctores',
    subtitle: 'Informes y documentación clínica',
    tone: 'sky',
    features: [
      'Informes odontológicos',
      'Plantillas clínicas',
      'Perfiles Dr/Dra',
      'Firma profesional',
      'Historial de visitas'
    ],
    cta: 'Ver informes clínicos',
    href: '/login/admin',
    icon: Stethoscope,
    illustration: 'report'
  },
  {
    id: 'admin',
    title: 'Administración',
    subtitle: 'Facturación, pagos y reportes',
    tone: 'violet',
    features: ['Facturas PDF', 'Pagos y recibos', 'Reportes', 'Suscripciones', 'Exportaciones'],
    cta: 'Ver facturación',
    href: '/login/admin',
    icon: CreditCard,
    illustration: 'billing'
  },
  {
    id: 'pacientes',
    title: 'Pacientes',
    subtitle: 'Portal privado y autoservicio',
    tone: 'mint',
    features: [
      'Reservar cita',
      'Mis informes',
      'Mis documentos',
      'Mis facturas',
      'Consentimientos',
      'Mensajes'
    ],
    cta: 'Ver portal paciente',
    href: '/portal-paciente',
    icon: UserRound,
    illustration: 'portal'
  }
];

export const landingFeaturePills = [
  { label: 'Reservas online', icon: Globe },
  { label: 'Agenda clínica', icon: Calendar },
  { label: 'Informes clínicos', icon: FileText },
  { label: 'Documentos seguros', icon: Lock },
  { label: 'Facturas PDF', icon: Receipt },
  { label: 'Pagos y recibos', icon: CreditCard },
  { label: 'Consentimientos', icon: ClipboardList },
  { label: 'Seguridad multi-tenant', icon: Layers }
] as const;

export type PricingPlanId = 'esencial' | 'profesional' | 'multi' | 'enterprise';

export const landingPlanSelectorRows = [
  {
    id: 'esencial' as PricingPlanId,
    name: 'Esencial',
    tagline: 'Para empezar',
    price: '0 €/mes'
  },
  {
    id: 'profesional' as PricingPlanId,
    name: 'Profesional',
    tagline: 'Recomendado',
    price: '49 €/mes',
    badge: 'RECOMENDADO'
  },
  {
    id: 'multi' as PricingPlanId,
    name: 'Multi-sede',
    tagline: 'Para varias clínicas',
    price: '129 €/mes'
  },
  {
    id: 'enterprise' as PricingPlanId,
    name: 'Enterprise',
    tagline: 'Para grupos dentales',
    price: 'A medida'
  }
] as const;

export const landingPlanDetails: Record<
  PricingPlanId,
  {
    name: string;
    badge?: string;
    price: string;
    period?: string;
    description: string;
    included: string[];
    ctaPrimary: string;
    ctaSecondary: string;
    demoPlan?: 'pro_clinica' | 'pro_multi';
    hrefPrimary?: string;
  }
> = {
  esencial: {
    name: 'Esencial',
    price: '0 €',
    period: '/mes',
    description: 'Para empezar con agenda básica y portal paciente en tu clínica dental digital.',
    included: ['Agenda básica', 'Portal paciente', 'Pacientes limitados', 'Informes básicos'],
    ctaPrimary: 'Empezar gratis',
    ctaSecondary: 'Solicitar demo',
    hrefPrimary: '/registro-clinica'
  },
  profesional: {
    name: 'Profesional',
    badge: 'RECOMENDADO',
    price: '49 €',
    period: '/mes',
    description:
      'Para clínicas que quieren gestionar agenda, pacientes, informes, documentos, facturas, pagos y portal paciente desde una sola plataforma.',
    included: [
      'Agenda avanzada',
      'Pacientes ilimitados',
      'Informes clínicos',
      'Documentos',
      'Facturación PDF',
      'Pagos',
      'Consentimientos',
      'Mensajes',
      'Reportes'
    ],
    ctaPrimary: 'Probar 14 días gratis',
    ctaSecondary: 'Solicitar demo',
    demoPlan: 'pro_clinica'
  },
  multi: {
    name: 'Multi-sede',
    price: '129 €',
    period: '/mes',
    description: 'Para clínicas con varias sedes que necesitan gestión de clínicas dentales centralizada.',
    included: [
      'Varias clínicas',
      'Multi-sede',
      'Usuarios ilimitados',
      'Métricas',
      'Auditoría',
      'Soporte prioritario'
    ],
    ctaPrimary: 'Solicitar información',
    ctaSecondary: 'Solicitar demo',
    demoPlan: 'pro_multi'
  },
  enterprise: {
    name: 'Enterprise',
    price: 'A medida',
    description: 'Para grupos dentales y redes que requieren software odontológico a medida.',
    included: [
      'Plataforma avanzada',
      'Monitorización',
      'Seguridad avanzada',
      'SLA',
      'Integraciones',
      'Soporte personalizado'
    ],
    ctaPrimary: 'Contactar ventas',
    ctaSecondary: 'Solicitar demo',
    hrefPrimary: '/contacto?tipo=clinica'
  }
};

export const landingPricingSecurity = [
  { icon: UserRound, title: 'Portal paciente privado' },
  { icon: Users, title: 'Acceso por rol' },
  { icon: Building2, title: 'Aislamiento por clínica' },
  { icon: CalendarClock, title: 'Bloqueo de horarios' },
  { icon: Shield, title: 'Auditoría de acciones' },
  { icon: MessageSquare, title: 'Soporte' }
] as const;

export const landingPlanComparisonRows = [
  { feature: 'Agenda clínica', esencial: true, profesional: true, multi: true, enterprise: true },
  { feature: 'Portal paciente', esencial: true, profesional: true, multi: true, enterprise: true },
  { feature: 'Informes clínicos', esencial: 'Básico', profesional: true, multi: true, enterprise: true },
  { feature: 'Facturación PDF', esencial: false, profesional: true, multi: true, enterprise: true },
  { feature: 'Multi-sede', esencial: false, profesional: false, multi: true, enterprise: true },
  { feature: 'Auditoría avanzada', esencial: false, profesional: false, multi: true, enterprise: true }
] as const;

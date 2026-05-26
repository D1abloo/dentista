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

export type WorkflowPreviewImage = 'citas' | 'informes' | 'inicio' | 'doctor' | 'mensajes';

export const landingWorkflowSteps = [
  {
    step: 1,
    title: 'El paciente reserva',
    text: 'El paciente elige clínica, tratamiento, profesional, fecha y hora disponible desde el portal o el asistente de citas.',
    icon: Calendar,
    mock: 'booking' as WorkflowMock,
    scrollTo: 'modulos-recepcion',
    preview: {
      title: 'Reserva online conectada con la agenda',
      text: 'El paciente puede solicitar cita online y AgendaClinic solo muestra huecos reales, respetando horarios de clínica, profesionales disponibles, citas ocupadas y bloqueos.',
      bullets: [
        'Disponibilidad real',
        'Bloqueos respetados',
        'Profesionales activos',
        'Confirmación automática o manual'
      ],
      cta: 'Ver cómo funciona la agenda',
      ctaScrollTo: 'modulos-recepcion',
      image: 'citas' as WorkflowPreviewImage
    }
  },
  {
    step: 2,
    title: 'La clínica organiza',
    text: 'Recepción gestiona agenda, bloqueos horarios, disponibilidad por profesional y estados de cita.',
    icon: CalendarClock,
    mock: 'agenda' as WorkflowMock,
    scrollTo: 'modulos-recepcion',
    preview: {
      title: 'Agenda clínica dental en tiempo real',
      text: 'Recepción visualiza el día, semana o mes, aplica bloqueos por profesional o gabinete y actualiza estados sin solapar citas ni ignorar indisponibilidad.',
      bullets: [
        'Vistas día, semana y mes',
        'Bloqueos multi-profesional',
        'Estados de cita claros',
        'Coordinación con reservas online'
      ],
      cta: 'Ver cómo funciona la agenda',
      ctaScrollTo: 'modulos-recepcion',
      image: 'citas' as WorkflowPreviewImage
    }
  },
  {
    step: 3,
    title: 'El doctor documenta',
    text: 'El profesional crea informes odontológicos, adjunta documentos y firma con sus datos clínicos.',
    icon: FileText,
    mock: 'report' as WorkflowMock,
    scrollTo: 'modulos-doctores',
    preview: {
      title: 'Informes odontológicos con trazabilidad',
      text: 'El equipo clínico redacta informes, adjunta radiografías o documentos y deja constancia de firma profesional vinculada al historial del paciente.',
      bullets: [
        'Plantillas clínicas',
        'Firma profesional',
        'Documentos adjuntos',
        'Visibilidad controlada en portal'
      ],
      cta: 'Ver informes clínicos',
      ctaScrollTo: 'modulos-doctores',
      image: 'informes' as WorkflowPreviewImage
    }
  },
  {
    step: 4,
    title: 'Administración factura',
    text: 'La clínica genera facturas PDF, registra pagos y comparte recibos con el paciente.',
    icon: Receipt,
    mock: 'invoice' as WorkflowMock,
    scrollTo: 'modulos-admin',
    preview: {
      title: 'Facturación dental integrada',
      text: 'Administración emite facturas PDF, registra cobros y deja el estado de pago visible para la clínica y, cuando corresponde, para el paciente en su portal.',
      bullets: [
        'Facturas PDF',
        'Pagos y recibos',
        'Estados pendiente / pagada',
        'Vinculación con citas y paciente'
      ],
      cta: 'Ver facturación',
      ctaScrollTo: 'modulos-admin',
      image: 'doctor' as WorkflowPreviewImage
    }
  },
  {
    step: 5,
    title: 'El paciente lo consulta',
    text: 'Informes, documentos, facturas, pagos, mensajes y consentimientos aparecen en el Portal del Paciente.',
    icon: UserRound,
    mock: 'portal' as WorkflowMock,
    scrollTo: 'modulos-pacientes',
    preview: {
      title: 'Portal paciente dental unificado',
      text: 'El paciente accede a su espacio privado para consultar informes, facturas, mensajes y consentimientos sin llamar a recepción por cada detalle.',
      bullets: [
        'Mis informes y documentos',
        'Facturas y pagos',
        'Mensajes con la clínica',
        'Consentimientos firmados'
      ],
      cta: 'Ver portal paciente',
      ctaScrollTo: 'modulos-pacientes',
      image: 'inicio' as WorkflowPreviewImage
    }
  }
] as const;

export const landingWorkflowBenefits = [
  {
    title: 'Todo conectado',
    text: 'Agenda, pacientes, informes y facturas trabajan juntos.'
  },
  {
    title: 'Menos llamadas',
    text: 'El paciente consulta información desde su portal.'
  },
  {
    title: 'Sin huecos duplicados',
    text: 'Los bloqueos y citas ocupadas se respetan.'
  },
  {
    title: 'Datos seguros',
    text: 'Aislamiento por clínica, paciente y rol.'
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

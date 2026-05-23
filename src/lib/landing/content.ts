import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Building2,
  Calendar,
  CalendarClock,
  ClipboardList,
  CreditCard,
  FileText,
  Globe,
  History,
  Layers,
  Lock,
  MessageSquare,
  Receipt,
  Shield,
  ShieldCheck,
  UserRound,
  Users
} from 'lucide-react';

export type LandingFeature = { icon: LucideIcon; title: string; text: string };
export type LandingPlan = {
  id: string;
  name: string;
  price: string;
  period?: string;
  blurb?: string;
  features: string[];
  cta: string;
  href: string;
  featured?: boolean;
  badge?: string;
  demoPlan?: 'pro_clinica' | 'pro_multi';
};

export const landingHeroBadges = [
  { icon: UserRound, label: 'Portal paciente' },
  { icon: Calendar, label: 'Agenda inteligente' },
  { icon: Receipt, label: 'Facturación PDF' },
  { icon: Shield, label: 'Multi-tenant seguro' },
  { icon: FileText, label: 'Informes clínicos' },
  { icon: ClipboardList, label: 'Consentimientos digitales' }
] as const;

export const landingWhoCards = [
  {
    id: 'patient',
    icon: UserRound,
    tone: 'mint',
    title: 'Soy paciente',
    text: 'Reserva citas, consulta informes, descarga documentos, revisa facturas, pagos y consentimientos desde tu portal privado.',
    cta: 'Entrar al portal paciente',
    href: '/login/paciente'
  },
  {
    id: 'clinic',
    icon: Building2,
    tone: 'sky',
    title: 'Soy clínica',
    text: 'Gestiona agenda, pacientes, informes, documentos, facturación, pagos y comunicación con pacientes.',
    cta: 'Ver panel clínica',
    href: '/login/admin'
  },
  {
    id: 'platform',
    icon: ShieldCheck,
    tone: 'violet',
    title: 'Soy administrador',
    text: 'Controla organizaciones, clínicas, usuarios, suscripciones, seguridad, auditoría y monitorización.',
    cta: 'Ver plataforma',
    href: '/platform/login'
  }
] as const;

export const landingFeatures: LandingFeature[] = [
  { icon: Globe, title: 'Reservas online', text: 'Tus pacientes reservan citas 24/7 desde el portal.' },
  { icon: Calendar, title: 'Agenda clínica', text: 'Organiza citas, bloqueos y disponibilidad de profesionales.' },
  { icon: Users, title: 'Pacientes y NHC', text: 'Gestión completa de pacientes con historial y NHC único.' },
  { icon: FileText, title: 'Informes clínicos', text: 'Crea informes con plantillas odontológicas y firma digital.' },
  { icon: Lock, title: 'Documentos seguros', text: 'Sube y comparte documentos de forma segura y organizada.' },
  { icon: Receipt, title: 'Facturas PDF', text: 'Genera facturas PDF automáticas y envíalas al paciente.' },
  { icon: CreditCard, title: 'Pagos y recibos', text: 'Registra pagos y genera recibos fácilmente.' },
  { icon: ClipboardList, title: 'Consentimientos digitales', text: 'Tus pacientes firman consentimientos desde el portal.' },
  { icon: MessageSquare, title: 'Mensajes clínica-paciente', text: 'Comunicación directa y segura.' },
  { icon: History, title: 'Historial de visitas', text: 'Consulta todo el historial de citas y tratamientos.' },
  { icon: BarChart3, title: 'Reportes', text: 'Métricas y reportes para tomar mejores decisiones.' },
  { icon: Layers, title: 'Seguridad multi-tenant', text: 'Aislamiento de datos por clínica y roles seguros.' }
];

export const landingSecurityCards = [
  {
    icon: Building2,
    title: 'Aislamiento por clínica',
    text: 'Cada clínica opera dentro de su propio contexto de datos.'
  },
  { icon: Users, title: 'Acceso por rol', text: 'Permisos separados para cada tipo de usuario.' },
  {
    icon: UserRound,
    title: 'Portal paciente privado',
    text: 'Cada paciente solo accede a su información.'
  },
  {
    icon: ClipboardList,
    title: 'Auditoría de acciones',
    text: 'Registro de accesos, descargas y acciones sensibles.'
  },
  {
    icon: CalendarClock,
    title: 'Bloqueo de horarios',
    text: 'Horas ocupadas o bloqueadas no disponibles en el portal.'
  },
  {
    icon: Shield,
    title: 'Monitorización de plataforma',
    text: 'Supervisa accesos, errores y eventos de seguridad.'
  }
];

export const landingPlans: LandingPlan[] = [
  {
    id: 'esencial',
    name: 'Esencial',
    price: '0 €',
    period: '/mes',
    blurb: 'Para empezar con agenda básica y portal paciente.',
    features: ['Agenda básica', 'Portal paciente', 'Pacientes limitados', 'Informes básicos'],
    cta: 'Empezar gratis',
    href: '/registro-clinica'
  },
  {
    id: 'profesional',
    name: 'Profesional',
    price: '49 €',
    period: '/mes',
    blurb: 'Para clínicas que necesitan gestión completa.',
    features: [
      'Todo lo de Esencial',
      'Agenda avanzada',
      'Informes clínicos',
      'Documentos',
      'Facturación PDF',
      'Pagos',
      'Consentimientos',
      'Mensajes',
      'Reportes'
    ],
    cta: 'Probar 14 días gratis',
    href: '/#contacto-pro',
    featured: true,
    badge: 'Recomendado',
    demoPlan: 'pro_clinica'
  },
  {
    id: 'multi',
    name: 'Multi-sede',
    price: '129 €',
    period: '/mes',
    blurb: 'Para clínicas con varias sedes.',
    features: [
      'Varias clínicas',
      'Multi-sede',
      'Usuarios ilimitados',
      'Métricas',
      'Auditoría',
      'Soporte prioritario'
    ],
    cta: 'Solicitar información',
    href: '/#contacto-pro',
    demoPlan: 'pro_multi'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'A medida',
    blurb: 'Para grupos dentales y redes de clínicas.',
    features: [
      'Plataforma avanzada',
      'Monitorización',
      'Seguridad avanzada',
      'SLA',
      'Integraciones',
      'Soporte personalizado'
    ],
    cta: 'Contactar ventas',
    href: '/contacto?tipo=clinica'
  }
];

export const landingTrustLogos = [
  { name: 'Clínica Dental Nova', short: 'NOVA' },
  { name: 'Sonrisa Clínica Dental', short: 'SONRISA' },
  { name: 'Dental Horizonte', short: 'HORIZONTE' },
  { name: 'Clínica Mediterráneo', short: 'MEDITERRÁNEO' },
  { name: 'Dental Plus', short: 'DENTAL PLUS' }
] as const;

/** Laptop centro (agenda), tablet atrás-izq (plataforma), móvil delante-dcha (paciente) */
export const landingHeroDevices = [
  {
    label: 'Plataforma',
    variant: 'tablet',
    src: '/images/guides/mobile/admin-dashboard.png',
    alt: 'Panel de plataforma con estadísticas en tablet'
  },
  {
    label: 'Panel clínica',
    variant: 'laptop',
    src: '/images/guides/landing/admin-dashboard-hero.png',
    alt: 'Agenda del panel clínica en portátil'
  },
  {
    label: 'Portal paciente',
    variant: 'phone',
    src: '/images/guides/mobile/pdp-inicio.png',
    alt: 'Portal del paciente en móvil'
  }
] as const;

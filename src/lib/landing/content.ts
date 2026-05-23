import type { LucideIcon } from 'lucide-react';
import {
  Building2,
  Calendar,
  ClipboardList,
  CreditCard,
  FileText,
  Globe,
  Layers,
  Lock,
  MessageSquare,
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
  features: string[];
  cta: string;
  href: string;
  featured?: boolean;
  badge?: string;
};

export const landingHeroBadges = [
  { icon: UserRound, label: 'Portal paciente' },
  { icon: Calendar, label: 'Agenda inteligente' },
  { icon: FileText, label: 'Facturación PDF' },
  { icon: Shield, label: 'Multi-tenant seguro' }
] as const;

export const landingWhoCards = [
  {
    id: 'patient',
    icon: UserRound,
    title: 'Soy paciente',
    text: 'Reserva citas, consulta informes, descarga documentos y revisa facturas.',
    cta: 'Entrar al portal',
    href: '/login/paciente'
  },
  {
    id: 'clinic',
    icon: Building2,
    title: 'Soy clínica',
    text: 'Gestiona agenda, pacientes, informes, documentos, facturación y pagos.',
    cta: 'Ver panel clínica',
    href: '/login/admin'
  },
  {
    id: 'platform',
    icon: ShieldCheck,
    title: 'Soy administrador',
    text: 'Gestiona clínicas, usuarios, suscripciones, soporte, seguridad y auditoría.',
    cta: 'Ver plataforma',
    href: '/platform/login'
  }
] as const;

export const landingFeatures: LandingFeature[] = [
  { icon: Calendar, title: 'Reservas online', text: 'Citas 24/7 con confirmación y recordatorios.' },
  { icon: Calendar, title: 'Agenda clínica', text: 'Vista diaria, semanal y por profesional.' },
  { icon: Users, title: 'Pacientes y NHC', text: 'Historial clínico y datos centralizados.' },
  { icon: FileText, title: 'Informes clínicos', text: 'Publicación segura en el portal paciente.' },
  { icon: Lock, title: 'Documentos seguros', text: 'Almacenamiento y descarga controlada.' },
  { icon: CreditCard, title: 'Facturas y pagos', text: 'Cobros, estados y PDF profesionales.' },
  { icon: ClipboardList, title: 'Consentimientos', text: 'Firma digital y trazabilidad.' },
  { icon: MessageSquare, title: 'Mensajes', text: 'Comunicación clínica-paciente.' },
  { icon: Shield, title: 'Auditoría', text: 'Registro de acciones sensibles.' },
  { icon: Layers, title: 'Multi-sede', text: 'Varias clínicas con aislamiento por tenant.' }
];

export const landingPatientModules = [
  'Inicio',
  'Reservar cita',
  'Mis citas',
  'Informes',
  'Documentos',
  'Facturas',
  'Pagos',
  'Mensajes',
  'Consentimientos',
  'Perfil'
];

export const landingClinicModules = [
  'Resumen',
  'Agenda',
  'Pacientes',
  'Informes',
  'Documentos',
  'Facturación',
  'Pagos',
  'Reportes',
  'Ajustes'
];

export const landingClinicWorkflow = [
  'Crear paciente',
  'Reservar cita',
  'Subir informe o documento',
  'Emitir factura',
  'Registrar pago',
  'Publicar en portal paciente'
];

export const landingPlatformModules = [
  'Resumen',
  'Organizaciones',
  'Clínicas',
  'Usuarios',
  'Registros de clínicas',
  'Suscripciones',
  'Soporte',
  'Métricas',
  'Seguridad',
  'Auditoría',
  'Aislamiento multi-tenant'
];

export const landingSecurityCards = [
  { icon: Building2, title: 'Aislamiento por clínica', text: 'Datos separados por tenant y sede.' },
  { icon: Users, title: 'Acceso por rol', text: 'Permisos para staff, paciente y plataforma.' },
  { icon: ClipboardList, title: 'Auditoría de acciones', text: 'Trazabilidad de operaciones sensibles.' },
  { icon: UserRound, title: 'Portal paciente privado', text: 'Solo ve su información clínica.' },
  { icon: Lock, title: 'Sesiones cifradas', text: 'Autenticación y cookies seguras.' },
  { icon: Shield, title: 'Datos clínicos protegidos', text: 'RGPD y buenas prácticas sanitarias.' }
];

export const landingPlans: LandingPlan[] = [
  {
    id: 'esencial',
    name: 'Esencial',
    price: '0€',
    period: '/mes',
    features: ['Agenda básica', 'Hasta 2 usuarios', 'Portal paciente', 'Soporte email'],
    cta: 'Empezar gratis',
    href: '/registro-clinica'
  },
  {
    id: 'profesional',
    name: 'Profesional',
    price: '49€',
    period: '/mes',
    features: ['Todo Esencial', 'Facturación PDF', 'Informes y documentos', 'Mensajes', 'Soporte prioritario'],
    cta: 'Probar 14 días gratis',
    href: '/#contacto-pro',
    featured: true,
    badge: 'Recomendado'
  },
  {
    id: 'multi',
    name: 'Multi-sede',
    price: '129€',
    period: '/mes',
    features: ['Varias sedes', 'Panel centralizado', 'Métricas agregadas', 'Onboarding dedicado'],
    cta: 'Solicitar información',
    href: '/#contacto-pro'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'A medida',
    features: ['SLA personalizado', 'Integraciones', 'SSO', 'Formación in situ'],
    cta: 'Contactar ventas',
    href: '/contacto?tipo=clinica'
  }
];

export const landingHelpCards = [
  { title: 'Guías para pacientes', href: '/ayuda#portal-paciente', icon: UserRound },
  { title: 'Guías para clínicas', href: '/ayuda#panel-admin', icon: Building2 },
  { title: 'Preguntas frecuentes', href: '/ayuda#help-faq', icon: MessageSquare },
  { title: 'Contactar soporte', href: '/contacto', icon: Globe }
];

export const landingHeroDevices = [
  { label: 'Portal paciente', src: '/images/guides/mobile/pdp-inicio.png', alt: 'Pantalla de inicio del portal paciente' },
  { label: 'Agenda clínica', src: '/images/guides/mobile/admin-agenda.png', alt: 'Agenda del panel clínica' },
  { label: 'Plataforma', src: '/images/guides/landing/admin-dashboard-hero.png', alt: 'Resumen de plataforma Super Admin' }
] as const;

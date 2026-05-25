import type { LucideIcon } from 'lucide-react';
import {
  Bell,
  Building2,
  Calendar,
  CreditCard,
  FileText,
  Receipt,
  Shield,
  UserRound
} from 'lucide-react';

export type LandingAccessCard = {
  id: string;
  tone: 'mint' | 'sky' | 'violet';
  badge: string;
  title: string;
  text: string;
  bullets: string[];
  cta: string;
  href: string;
  icon: LucideIcon;
};

export const landingAccessCards: LandingAccessCard[] = [
  {
    id: 'patient',
    tone: 'mint',
    badge: 'PARA PACIENTES',
    title: 'Portal del paciente',
    text: 'Consulta tus citas, informes, documentos, facturas, pagos y consentimientos desde tu espacio privado.',
    bullets: ['Reservar cita', 'Ver informes', 'Descargar facturas'],
    cta: 'Entrar al portal',
    href: '/portal-paciente',
    icon: UserRound
  },
  {
    id: 'clinic',
    tone: 'sky',
    badge: 'PARA CLÍNICAS',
    title: 'Panel clínica',
    text: 'Gestiona agenda, pacientes, profesionales, informes, documentos, facturación y pagos.',
    bullets: ['Agenda clínica', 'Informes y documentos', 'Facturación y pagos'],
    cta: 'Acceder al panel',
    href: '/login/admin',
    icon: Building2
  },
  {
    id: 'platform',
    tone: 'violet',
    badge: 'PLATAFORMA',
    title: 'Administración',
    text: 'Controla organizaciones, clínicas, usuarios, suscripciones, seguridad, auditoría y monitorización.',
    bullets: ['Multi-sede', 'Usuarios y roles', 'Seguridad y auditoría'],
    cta: 'Acceder a plataforma',
    href: '/platform/login',
    icon: Shield
  }
];

export const landingWorkflowSteps = [
  { icon: Calendar, title: 'Cita creada', subtitle: 'en la agenda' },
  { icon: FileText, title: 'Informe publicado', subtitle: 'para el paciente' },
  { icon: Receipt, title: 'Factura emitida', subtitle: 'y registrada' },
  { icon: Bell, title: 'Paciente informado', subtitle: 'en su portal' }
] as const;

export type LandingProductShowcase = {
  id: string;
  icon: LucideIcon;
  iconTone: 'teal' | 'sand' | 'mint';
  title: string;
  text: string;
  bullets: string[];
  image: string;
  alt: string;
  href: string;
};

export const landingProductShowcases: LandingProductShowcase[] = [
  {
    id: 'agenda',
    icon: Calendar,
    iconTone: 'teal',
    title: 'Agenda clínica',
    text: 'Vista día, semana y mes con profesionales, bloqueos horarios, estados de cita y disponibilidad en tiempo real.',
    bullets: [
      'Disponibilidad por gabinete',
      'Recordatorios automáticos',
      'Agenda por profesional',
      'Bloqueos visibles para el paciente'
    ],
    image: '/images/guides/mobile/admin-agenda.png',
    alt: 'Mockup de agenda clínica Dentista+',
    href: '/#funcionalidades'
  },
  {
    id: 'portal',
    icon: UserRound,
    iconTone: 'sand',
    title: 'Portal del paciente',
    text: 'El paciente consulta informes, documentos, facturas, pagos, consentimientos y mensajes sin llamar a recepción.',
    bullets: [
      'Informes y radiografías',
      'Mensajería segura',
      'Acceso 24/7 desde móvil',
      'Consentimientos digitales'
    ],
    image: '/images/guides/mobile/pdp-inicio.png',
    alt: 'Mockup del portal del paciente Dentista+',
    href: '/portal-paciente'
  },
  {
    id: 'billing',
    icon: CreditCard,
    iconTone: 'teal',
    title: 'Facturación y pagos',
    text: 'Emite facturas PDF, registra cobros, comparte recibos y vincula facturas con citas y pacientes.',
    bullets: [
      'Facturas PDF automáticas',
      'Pagos y recibos',
      'Historial por paciente',
      'Estado visible en el portal'
    ],
    image: '/images/guides/mobile/admin-facturas.png',
    alt: 'Mockup de facturación Dentista+',
    href: '/#funcionalidades'
  }
];

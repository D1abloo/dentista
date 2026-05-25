import type { LucideIcon } from 'lucide-react';
import {
  Building2,
  CalendarDays,
  FileText,
  MessageSquare,
  Receipt,
  Shield,
  Sparkles,
  Stethoscope,
  UserRound
} from 'lucide-react';

export type PublicProductPillar = {
  id: string;
  title: string;
  text: string;
  bullets: string[];
  image: string;
  alt: string;
  tone: 'mint' | 'sand' | 'teal';
  icon: LucideIcon;
};

export type PublicStat = { value: string; label: string; hint?: string };

export type PublicStep = { step: string; title: string; text: string; icon: LucideIcon };

export const publicHeroStats: PublicStat[] = [
  { value: '24/7', label: 'Portal activo', hint: 'Acceso del paciente cuando lo necesite' },
  { value: '−40%', label: 'Llamadas de recepción', hint: 'Según clínicas en demo' },
  { value: '1', label: 'Plataforma unificada', hint: 'Informes, documentos y facturas' }
];

export const publicExplorePaths = [
  {
    id: 'patient',
    eyebrow: 'Para pacientes',
    title: 'Portal del paciente',
    text: 'Consulta informes, descarga documentos, revisa facturas y mensajes desde un espacio privado y seguro.',
    cta: 'Entrar al portal',
    href: '/portal-paciente',
    icon: UserRound,
    tone: 'mint'
  },
  {
    id: 'clinic',
    eyebrow: 'Para clínicas',
    title: 'Gestiono una clínica',
    text: 'Agenda, pacientes, informes, documentos, facturación y mensajería en un panel pensado para odontología.',
    cta: 'Solicitar demo',
    href: '/#contacto-pro',
    icon: Building2,
    tone: 'ink',
    demo: true as const
  }
] as const;

/** Tres pilares del bloque «Agenda, portal paciente y facturación». */
export const publicProductPillars: PublicProductPillar[] = [
  {
    id: 'agenda',
    title: 'Agenda',
    text: 'Vista día, semana y mes con profesionales, bloqueos y estados de cita en tiempo real.',
    bullets: ['Disponibilidad por gabinete', 'Recordatorios automáticos', 'Agenda por profesional'],
    image: '/img/citas.webp',
    alt: 'Agenda de citas dentales en el panel clínico',
    tone: 'mint',
    icon: CalendarDays
  },
  {
    id: 'portal',
    title: 'Portal del paciente',
    text: 'El paciente consulta informes, documentos y mensajes sin llamar a recepción.',
    bullets: ['Informes y radiografías', 'Mensajería segura', 'Acceso 24/7 desde móvil'],
    image: '/img/informes.webp',
    alt: 'Informes clínicos en el portal del paciente',
    tone: 'sand',
    icon: UserRound
  },
  {
    id: 'facturacion',
    title: 'Facturación',
    text: 'Emite facturas PDF, registra cobros y comparte el estado de pago con el paciente.',
    bullets: ['Facturas PDF automáticas', 'Pagos y recibos', 'Historial por paciente'],
    image: '/images/guides/mobile/pdp-facturas.png',
    alt: 'Facturación y pagos en el portal del paciente',
    tone: 'teal',
    icon: Receipt
  }
];

export const publicSteps: PublicStep[] = [
  {
    step: '01',
    title: 'Explora la plataforma',
    text: 'Pacientes acceden al portal; las clínicas gestionan operaciones desde el panel privado.',
    icon: Sparkles
  },
  {
    step: '02',
    title: 'Activa tu espacio seguro',
    text: 'Registro guiado, verificación por correo y portal privado con datos aislados por clínica.',
    icon: Shield
  },
  {
    step: '03',
    title: 'Gestiona sin fricción',
    text: 'Informes, documentos y facturas conectados en un solo flujo odontológico.',
    icon: Stethoscope
  }
];

export const publicValuePillars = [
  {
    icon: FileText,
    title: 'Historia clínica digital',
    text: 'Informes con plantillas odontológicas, firma y entrega al portal.'
  },
  {
    icon: Receipt,
    title: 'Facturación integrada',
    text: 'PDFs, pagos y recibos sin salir de la plataforma.'
  },
  {
    icon: MessageSquare,
    title: 'Comunicación directa',
    text: 'Mensajería segura entre clínica y paciente con notificaciones.'
  },
  {
    icon: Shield,
    title: 'Privacidad por diseño',
    text: 'Cada paciente solo ve su información; datos aislados por clínica.'
  }
] as const;

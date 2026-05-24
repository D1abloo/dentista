import type { LucideIcon } from 'lucide-react';
import {
  Building2,
  CalendarCheck,
  FileText,
  MessageSquare,
  Receipt,
  Shield,
  Sparkles,
  Stethoscope,
  UserRound
} from 'lucide-react';

export type PublicShowcaseTile = {
  id: string;
  title: string;
  text: string;
  image: string;
  alt: string;
  span: 'hero' | 'wide' | 'tall' | 'square';
  tone: 'mint' | 'sand' | 'ink' | 'teal';
};

export type PublicStat = { value: string; label: string; hint?: string };

export type PublicStep = { step: string; title: string; text: string; icon: LucideIcon };

export const publicHeroStats: PublicStat[] = [
  { value: '24/7', label: 'Reservas online', hint: 'Portal paciente siempre abierto' },
  { value: '−40%', label: 'Llamadas de recepción', hint: 'Según clínicas en demo' },
  { value: '1', label: 'Plataforma unificada', hint: 'Citas, informes y facturas' }
];

export const publicExplorePaths = [
  {
    id: 'patient',
    eyebrow: 'Para ti',
    title: 'Soy paciente',
    text: 'Reserva citas, consulta informes, descarga documentos y revisa facturas desde un portal privado y seguro.',
    cta: 'Entrar al portal',
    href: '/login/paciente',
    icon: UserRound,
    tone: 'mint'
  },
  {
    id: 'book',
    eyebrow: 'Sin esperas',
    title: 'Quiero reservar',
    text: 'Elige día y hora disponibles en tu clínica. Regístrate una vez y gestiona todo desde el móvil.',
    cta: 'Reservar cita',
    href: '/reserva',
    icon: CalendarCheck,
    tone: 'teal'
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

export const publicShowcaseTiles: PublicShowcaseTile[] = [
  {
    id: 'agenda',
    title: 'Agenda clínica',
    text: 'Vista día, semana y mes con bloqueos y profesionales.',
    image: '/images/guides/landing/admin-dashboard-hero.png',
    alt: 'Agenda del panel clínica en portátil',
    span: 'hero',
    tone: 'mint'
  },
  {
    id: 'citas',
    title: 'Portal del paciente',
    text: 'Citas, historial y mensajes en el móvil.',
    image: '/images/guides/mobile/pdp-citas.png',
    alt: 'Citas en el portal del paciente',
    span: 'tall',
    tone: 'sand'
  },
  {
    id: 'facturas',
    title: 'Facturación PDF',
    text: 'Emisión y cobro con recibos automáticos.',
    image: '/images/guides/mobile/pdp-facturas.png',
    alt: 'Facturas en el portal del paciente',
    span: 'square',
    tone: 'teal'
  },
  {
    id: 'informes',
    title: 'Informes clínicos',
    text: 'Redacción, firma y publicación al paciente.',
    image: '/images/guides/mobile/pdp-informes.png',
    alt: 'Informes clínicos en móvil',
    span: 'wide',
    tone: 'ink'
  },
  {
    id: 'documentos',
    title: 'Documentación',
    text: 'Radiografías, consentimientos y archivos compartidos.',
    image: '/images/guides/mobile/pdp-documentos.png',
    alt: 'Documentos clínicos en el portal',
    span: 'square',
    tone: 'mint'
  }
];

export const publicSteps: PublicStep[] = [
  {
    step: '01',
    title: 'Explora y elige tu camino',
    text: 'Paciente, reserva o clínica: cada perfil tiene su acceso directo desde la web pública.',
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
    text: 'Citas, informes, documentos y facturas conectados en un solo flujo odontológico.',
    icon: Stethoscope
  }
];

export const publicValuePillars = [
  {
    icon: CalendarCheck,
    title: 'Citas que fluyen',
    text: 'Reservas online, recordatorios y estados visibles para recepción y paciente.'
  },
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
  }
] as const;

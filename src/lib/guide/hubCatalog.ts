import {
  adminGuideSections,
  patientGuideSections,
  platformGuideSections
} from '@/lib/guide/content';
import { helpFaqs, type HelpFaq } from '@/lib/guide/catalog';
import type { GuideSection, HelpAudience } from '@/lib/guide/types';

export type HelpSidebarGroup = {
  label: string;
  links: { id: string; label: string; audience: HelpAudience; href?: string }[];
};

export type HubGuideCard = {
  id: string;
  title: string;
  description: string;
};

export const helpSectionsByAudience: Record<HelpAudience, GuideSection[]> = {
  patient: patientGuideSections,
  admin: adminGuideSections,
  platform: platformGuideSections
};

export const patientHubCards: HubGuideCard[] = [
  {
    id: 'acceso',
    title: 'Acceso al portal',
    description: 'Entra con tu email o token y accede a tu espacio privado.'
  },
  {
    id: 'citas',
    title: 'Reservar cita',
    description: 'Elige clínica, tratamiento, profesional, fecha y hora disponible.'
  },
  {
    id: 'informes',
    title: 'Informes',
    description: 'Consulta informes clínicos visibles y descarga PDFs.'
  },
  {
    id: 'documentos',
    title: 'Documentos',
    description: 'Descarga radiografías, documentos y archivos compartidos por tu clínica.'
  },
  {
    id: 'facturas',
    title: 'Facturas y pagos',
    description: 'Consulta facturas, estados de cobro y recibos.'
  },
  {
    id: 'consentimientos',
    title: 'Consentimientos',
    description: 'Lee y firma consentimientos antes de determinados tratamientos.'
  }
];

export const adminHubCards: HubGuideCard[] = [
  {
    id: 'panel',
    title: 'Panel administrativo',
    description: 'Vista general de la clínica, métricas y accesos rápidos.'
  },
  {
    id: 'agenda-citas',
    title: 'Agenda',
    description: 'Crea citas, bloquea horarios y gestiona la disponibilidad.'
  },
  {
    id: 'pacientes-informes',
    title: 'Pacientes',
    description: 'Fichas, historial y comunicación con cada paciente.'
  },
  {
    id: 'pacientes-informes',
    title: 'Informes y documentos',
    description: 'Publica informes y archivos al portal del paciente.'
  },
  {
    id: 'facturacion',
    title: 'Facturación',
    description: 'Emite facturas, registra pagos y controla cobros.'
  },
  {
    id: 'portal-acceso',
    title: 'Portal paciente auditado',
    description: 'Accede al portal como paciente con trazabilidad.'
  },
  {
    id: 'logo-marca',
    title: 'Marca y logo',
    description: 'Personaliza logo, colores y datos de facturación.'
  }
];

export const platformHubCards: HubGuideCard[] = [
  {
    id: 'plataforma-organizaciones',
    title: 'Organizaciones',
    description: 'Redes multi-sede y contacto administrativo central.'
  },
  {
    id: 'plataforma-clinicas',
    title: 'Clínicas',
    description: 'Alta, estado y configuración de cada centro.'
  },
  {
    id: 'plataforma-clinicas',
    title: 'Usuarios y accesos',
    description: 'Roles, invitaciones y permisos por clínica.'
  },
  {
    id: 'plataforma-suscripciones',
    title: 'Suscripciones',
    description: 'Planes SaaS y facturación de la plataforma.'
  },
  {
    id: 'plataforma-seguridad',
    title: 'Seguridad',
    description: 'Políticas de contraseña, sesiones y protección de datos.'
  },
  {
    id: 'plataforma-auditoria',
    title: 'Auditoría',
    description: 'Historial de accesos e inspección de clínica.'
  },
  {
    id: 'plataforma-monitor',
    title: 'Monitorización',
    description: 'Estado de servicios e incidencias operativas.'
  }
];

export const helpSidebarNav: HelpSidebarGroup[] = [
  {
    label: 'Portal del paciente',
    links: [
      { id: 'acceso', label: 'Acceso al portal', audience: 'patient' },
      { id: 'citas', label: 'Reservar cita', audience: 'patient' },
      { id: 'citas', label: 'Mis citas', audience: 'patient' },
      { id: 'informes', label: 'Informes', audience: 'patient' },
      { id: 'documentos', label: 'Documentos', audience: 'patient' },
      { id: 'facturas', label: 'Facturas y pagos', audience: 'patient' },
      { id: 'consentimientos', label: 'Consentimientos', audience: 'patient' }
    ]
  },
  {
    label: 'Panel clínica',
    links: [
      { id: 'panel', label: 'Panel administrativo', audience: 'admin' },
      { id: 'agenda-citas', label: 'Agenda', audience: 'admin' },
      { id: 'pacientes-informes', label: 'Pacientes', audience: 'admin' },
      { id: 'facturacion', label: 'Facturación', audience: 'admin' }
    ]
  },
  {
    label: 'Plataforma',
    links: [
      { id: 'plataforma-panel', label: 'Plataforma', audience: 'platform' },
      { id: 'plataforma-seguridad', label: 'Seguridad', audience: 'platform' },
      { id: 'plataforma-auditoria', label: 'Auditoría', audience: 'platform' }
    ]
  },
  {
    label: 'Soporte',
    links: [
      { id: 'help-faq', label: 'Preguntas frecuentes', audience: 'patient', href: '#help-faq' },
      { id: 'contacto', label: 'Contactar soporte', audience: 'patient', href: '/contacto?tipo=soporte' }
    ]
  }
];

export const helpPopularLinks: { label: string; guideId: string; audience: HelpAudience }[] = [
  { label: 'Reservar cita', guideId: 'citas', audience: 'patient' },
  { label: 'Subir informe', guideId: 'pacientes-informes', audience: 'admin' },
  { label: 'Emitir factura', guideId: 'facturacion', audience: 'admin' },
  { label: 'Firmar consentimiento', guideId: 'consentimientos', audience: 'patient' },
  { label: 'Configurar logo', guideId: 'logo-marca', audience: 'admin' }
];

export const helpQuickAccessLinks = [
  { label: 'Portal paciente', href: '/portal-paciente' },
  { label: 'Panel clínica', href: '/login/admin' },
  { label: 'Plataforma', href: '/platform/login' }
] as const;

export const profileCardCopy: Record<
  HelpAudience,
  { title: string; text: string; cta: string; featuredTitle: string }
> = {
  patient: {
    title: 'Soy paciente',
    text: 'Guías para acceder al portal, reservar citas, ver informes, documentos, facturas y consentimientos.',
    cta: 'Ver guías de paciente',
    featuredTitle: 'Guías destacadas para pacientes'
  },
  admin: {
    title: 'Soy clínica',
    text: 'Guías para gestionar agenda, pacientes, informes, documentos, facturación y portal paciente.',
    cta: 'Ver guías de clínica',
    featuredTitle: 'Guías destacadas para clínicas'
  },
  platform: {
    title: 'Soy administrador',
    text: 'Guías para configuración avanzada, seguridad, auditoría, usuarios y plataforma.',
    cta: 'Ver guías de administración',
    featuredTitle: 'Guías destacadas para administradores'
  }
};

export function audienceBadgeLabel(audience: HelpAudience): string {
  if (audience === 'patient') return 'Paciente';
  if (audience === 'admin') return 'Clínica';
  return 'Administrador';
}

export function estimateGuideMinutes(section: GuideSection): number {
  const card = [...patientHubCards, ...adminHubCards, ...platformHubCards].find((c) => c.id === section.id);
  if (section.id === 'acceso') return 5;
  if (section.id === 'citas') return 4;
  if (section.id === 'consentimientos') return 3;
  if (['informes', 'documentos', 'facturas'].includes(section.id)) return 4;
  return Math.max(2, Math.min(8, section.steps.length + (card ? 1 : 0)));
}

export function filterGuideSections(sections: GuideSection[], query: string): GuideSection[] {
  const q = query.trim().toLowerCase();
  if (!q) return sections;
  return sections.filter(
    (s) =>
      s.title.toLowerCase().includes(q) ||
      s.summary.toLowerCase().includes(q) ||
      s.goal.toLowerCase().includes(q) ||
      s.steps.some((st) => st.title.toLowerCase().includes(q) || st.detail.toLowerCase().includes(q))
  );
}

export function filterHubCards(cards: HubGuideCard[], query: string): HubGuideCard[] {
  const q = query.trim().toLowerCase();
  if (!q) return cards;
  return cards.filter(
    (c) => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) || c.id.includes(q)
  );
}

export function searchAllGuides(query: string): { audience: HelpAudience; section: GuideSection }[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const out: { audience: HelpAudience; section: GuideSection }[] = [];
  (['patient', 'admin', 'platform'] as HelpAudience[]).forEach((aud) => {
    filterGuideSections(helpSectionsByAudience[aud], q).forEach((section) => out.push({ audience: aud, section }));
  });
  return out;
}

export function searchHelpFaqs(query: string): HelpFaq[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return helpFaqs.filter(
    (f) => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)
  );
}

export function hubCardsForAudience(audience: HelpAudience): HubGuideCard[] {
  if (audience === 'patient') return patientHubCards;
  if (audience === 'admin') return adminHubCards;
  return platformHubCards;
}

export function guideAnchorId(audience: HelpAudience, sectionId: string): string {
  return `help-guide-${audience}-${sectionId}`;
}

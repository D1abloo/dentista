import {
  adminGuideSections,
  patientGuideSections,
  platformGuideSections
} from '@/lib/guide/content';
import type { GuideSection, HelpAudience } from '@/lib/guide/types';

export type HelpSidebarGroup = {
  label: string;
  links: { id: string; label: string; audience: HelpAudience }[];
};

export const helpSectionsByAudience: Record<HelpAudience, GuideSection[]> = {
  patient: patientGuideSections,
  admin: adminGuideSections,
  platform: platformGuideSections
};

/** Tarjetas destacadas en el hub (orden del mockup). */
export const patientHubCards: { id: string; title: string }[] = [
  { id: 'acceso', title: 'Acceso al portal' },
  { id: 'citas', title: 'Reservar cita' },
  { id: 'informes', title: 'Informes' },
  { id: 'documentos', title: 'Documentos' },
  { id: 'facturas', title: 'Facturas y pagos' },
  { id: 'consentimientos', title: 'Consentimientos' }
];

export const adminHubCards: { id: string; title: string }[] = [
  { id: 'panel', title: 'Panel administrativo' },
  { id: 'agenda-citas', title: 'Agenda' },
  { id: 'pacientes-informes', title: 'Pacientes' },
  { id: 'pacientes-informes', title: 'Informes y documentos' },
  { id: 'facturacion', title: 'Facturación' },
  { id: 'portal-acceso', title: 'Portal paciente auditado' },
  { id: 'logo-marca', title: 'Marca y logo' }
];

export const platformHubCards: { id: string; title: string }[] = [
  { id: 'plataforma-panel', title: 'Panel de plataforma' },
  { id: 'plataforma-clinicas', title: 'Clínicas y usuarios' },
  { id: 'plataforma-seguridad', title: 'Seguridad y auditoría' }
];

export const helpSidebarNav: HelpSidebarGroup[] = [
  {
    label: 'Portal del paciente',
    links: [
      { id: 'acceso', label: 'Acceso al portal', audience: 'patient' },
      { id: 'citas', label: 'Mis citas', audience: 'patient' },
      { id: 'informes', label: 'Informes', audience: 'patient' },
      { id: 'documentos', label: 'Documentos', audience: 'patient' },
      { id: 'facturas', label: 'Facturas', audience: 'patient' },
      { id: 'consentimientos', label: 'Consentimientos', audience: 'patient' }
    ]
  },
  {
    label: 'Panel de la clínica',
    links: [
      { id: 'panel', label: 'Panel administrativo', audience: 'admin' },
      { id: 'agenda-citas', label: 'Agenda', audience: 'admin' },
      { id: 'pacientes-informes', label: 'Pacientes', audience: 'admin' },
      { id: 'facturacion', label: 'Facturación', audience: 'admin' },
      { id: 'portal-acceso', label: 'Acceso al portal paciente', audience: 'admin' },
      { id: 'logo-marca', label: 'Logo y marca', audience: 'admin' }
    ]
  }
];

export function estimateGuideMinutes(section: GuideSection): number {
  return Math.max(2, Math.min(8, section.steps.length + 1));
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

export function searchAllGuides(query: string): { audience: HelpAudience; section: GuideSection }[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const out: { audience: HelpAudience; section: GuideSection }[] = [];
  (['patient', 'admin', 'platform'] as HelpAudience[]).forEach((aud) => {
    filterGuideSections(helpSectionsByAudience[aud], q).forEach((section) => out.push({ audience: aud, section }));
  });
  return out;
}

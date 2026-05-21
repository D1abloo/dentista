import {
  Building2,
  Calendar,
  CalendarCheck,
  FileText,
  FolderOpen,
  LayoutDashboard,
  LogIn,
  PenLine,
  Receipt,
  Shield,
  Users,
  type LucideIcon
} from 'lucide-react';
import { helpSectionsByAudience, sectionThumb, type HelpAudience } from '@/lib/guide/catalog';
import type { GuideSection } from '@/lib/guide/types';

const icons: Record<string, LucideIcon> = {
  acceso: LogIn,
  citas: Calendar,
  informes: FileText,
  documentos: FolderOpen,
  facturas: Receipt,
  consentimientos: PenLine,
  panel: LayoutDashboard,
  'agenda-citas': CalendarCheck,
  'pacientes-informes': Users,
  facturacion: Receipt,
  'portal-acceso': Shield,
  'logo-marca': Building2
};

export function HelpTopicGrid({
  audience,
  onSelect
}: {
  audience: HelpAudience;
  onSelect: (sectionId: string) => void;
}) {
  const sections = helpSectionsByAudience[audience];

  return (
    <div className="help-hub__grid">
      {sections.map((section) => (
        <TopicCard key={section.id} section={section} onSelect={() => onSelect(section.id)} />
      ))}
    </div>
  );
}

function TopicCard({ section, onSelect }: { section: GuideSection; onSelect: () => void }) {
  const Icon = icons[section.id] ?? FileText;
  const thumb = sectionThumb(section);

  return (
    <button type="button" className="help-hub__card" onClick={onSelect}>
      <span className="help-hub__card-media">
        <img src={thumb} alt="" loading="lazy" decoding="async" />
        <span className="help-hub__card-icon" aria-hidden>
          <Icon className="h-4 w-4" />
        </span>
      </span>
      <span className="help-hub__card-body">
        <span className="help-hub__card-meta">{section.steps.length} pasos · Captura real</span>
        <span className="help-hub__card-title">{section.title}</span>
        <span className="help-hub__card-desc">{section.summary}</span>
      </span>
    </button>
  );
}

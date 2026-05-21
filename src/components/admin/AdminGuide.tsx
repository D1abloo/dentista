import { adminGuideSections } from '@/lib/guide/content';
import { GuideViewer } from '@/components/shared/GuideViewer';

export function AdminGuide() {
  return (
    <GuideViewer
      intro="Tutorial del panel administrativo: agenda, pacientes, informes ficticios de ejemplo, facturación y acceso al portal del paciente (PdP)."
      sections={adminGuideSections}
    />
  );
}

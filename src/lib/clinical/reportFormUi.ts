import type { ClinicalReportSections } from '@/lib/clinical/reportSections';

/** Campos visibles en el panel admin (el resto se mantiene en plantilla o aviso legal). */
export type ReportComposeTab = 'clinical' | 'diagnosis' | 'care';

export const REPORT_COMPOSE_TABS: { id: ReportComposeTab; label: string }[] = [
  { id: 'clinical', label: 'Clínico' },
  { id: 'diagnosis', label: 'Diagnóstico' },
  { id: 'care', label: 'Indicaciones' }
];

export type CompactReportField = {
  key: keyof ClinicalReportSections;
  label: string;
  rows: number;
  required?: boolean;
  wide?: boolean;
  tab: ReportComposeTab;
};

export const COMPACT_REPORT_FIELDS: CompactReportField[] = [
  { key: 'antecedentes', label: 'Antecedentes', rows: 3, required: true, wide: true, tab: 'clinical' },
  {
    key: 'informeTratamiento',
    label: 'Motivo y contexto de la visita',
    rows: 2,
    required: true,
    tab: 'clinical'
  },
  {
    key: 'anamnesisExploracion',
    label: 'Exploración y actuación realizada',
    rows: 4,
    required: true,
    wide: true,
    tab: 'clinical'
  },
  {
    key: 'diagnosticoPrincipal',
    label: 'Diagnóstico principal',
    rows: 3,
    required: true,
    tab: 'diagnosis'
  },
  {
    key: 'hallazgosSecundarios',
    label: 'Otros hallazgos (opcional)',
    rows: 2,
    tab: 'diagnosis'
  },
  {
    key: 'recomendacionesPaciente',
    label: 'Recomendaciones al paciente',
    rows: 3,
    required: true,
    tab: 'care'
  },
  { key: 'seguimiento', label: 'Seguimiento y próxima revisión', rows: 2, tab: 'care' }
];

export function fieldsForComposeTab(tab: ReportComposeTab) {
  return COMPACT_REPORT_FIELDS.filter((f) => f.tab === tab);
}

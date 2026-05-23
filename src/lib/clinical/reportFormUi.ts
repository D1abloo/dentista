import type { ClinicalReportSections } from '@/lib/clinical/reportSections';

export type ReportFormField = {
  key: keyof ClinicalReportSections;
  label: string;
  rows: number;
  required?: boolean;
  wide?: boolean;
};

export type ReportFormGroup = {
  id: 'clinical' | 'diagnosis' | 'care';
  title: string;
  subtitle: string;
  fields: ReportFormField[];
};

export const REPORT_FORM_GROUPS: ReportFormGroup[] = [
  {
    id: 'clinical',
    title: 'Datos clínicos',
    subtitle: 'Antecedentes, motivo de la visita y exploración',
    fields: [
      { key: 'antecedentes', label: 'Antecedentes', rows: 4, required: true, wide: true },
      { key: 'informeTratamiento', label: 'Motivo y contexto de la visita', rows: 3, required: true, wide: true },
      { key: 'anamnesisExploracion', label: 'Exploración y actuación realizada', rows: 6, required: true, wide: true }
    ]
  },
  {
    id: 'diagnosis',
    title: 'Diagnóstico',
    subtitle: 'Diagnóstico principal y hallazgos complementarios',
    fields: [
      { key: 'diagnosticoPrincipal', label: 'Diagnóstico principal', rows: 4, required: true, wide: true },
      { key: 'hallazgosSecundarios', label: 'Otros hallazgos (opcional)', rows: 3, wide: true },
      { key: 'estadoGeneral', label: 'Estado general (opcional)', rows: 2, wide: true }
    ]
  },
  {
    id: 'care',
    title: 'Indicaciones y seguimiento',
    subtitle: 'Recomendaciones al paciente y plan de control',
    fields: [
      { key: 'recomendacionesPaciente', label: 'Recomendaciones al paciente', rows: 4, required: true, wide: true },
      { key: 'seguimiento', label: 'Seguimiento y próxima revisión', rows: 3, wide: true },
      { key: 'avisoLegal', label: 'Aviso legal', rows: 2, wide: true }
    ]
  }
];

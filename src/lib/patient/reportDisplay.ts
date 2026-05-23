import type { ClinicalReport } from '@/types/demo';
import { parseStoredReportSections } from '@/lib/clinical/reportSections';

export type PatientReportBlock = {
  id: string;
  title: string;
  body: string;
};

export type PatientReportTab = 'clinical' | 'diagnosis' | 'care';

export function buildPatientReportBlocks(report: ClinicalReport): PatientReportBlock[] {
  const s = parseStoredReportSections(
    report.description ?? '',
    report.diagnosis ?? '',
    report.recommendations ?? ''
  );

  const clinical: PatientReportBlock[] = [
    { id: 'ant', title: 'Antecedentes', body: s.antecedentes },
    { id: 'inf', title: 'Informe clínico sobre tratamiento', body: s.informeTratamiento },
    { id: 'fue', title: 'Fuentes del informe', body: s.fuentesInforme },
    { id: 'ana', title: 'Anamnesis y exploración', body: s.anamnesisExploracion },
    { id: 'noe', title: 'Tratamientos no ejecutados', body: s.tratamientosNoEjecutados }
  ].filter((b) => b.body.trim());

  const diagnosis: PatientReportBlock[] = [
    { id: 'd1', title: 'Diagnóstico principal', body: s.diagnosticoPrincipal },
    { id: 'd2', title: 'Hallazgos secundarios', body: s.hallazgosSecundarios },
    { id: 'd3', title: 'Estado general', body: s.estadoGeneral }
  ].filter((b) => b.body.trim());

  const care: PatientReportBlock[] = [
    { id: 'r1', title: 'Recomendaciones', body: s.recomendacionesPaciente },
    { id: 'r2', title: 'Tratamiento recomendado', body: s.tratamientoRecomendado },
    { id: 'r3', title: 'Seguimiento', body: s.seguimiento },
    { id: 'r4', title: 'Próxima revisión', body: s.proximaRevision },
    { id: 'r5', title: 'Indicaciones adicionales', body: s.indicacionesAdicionales }
  ].filter((b) => b.body.trim());

  if (!clinical.length && report.description?.trim()) {
    clinical.push({ id: 'desc', title: 'Descripción clínica', body: report.description.trim() });
  }
  if (!diagnosis.length && report.diagnosis?.trim()) {
    diagnosis.push({ id: 'diag', title: 'Diagnóstico', body: report.diagnosis.trim() });
  }
  if (!care.length && report.recommendations?.trim()) {
    const raw = report.recommendations.trim();
    const legalSplit = raw.split(/\n---\n/);
    care.push({ id: 'rec', title: 'Recomendaciones', body: legalSplit[0]?.trim() ?? raw });
    if (legalSplit[1]?.trim()) {
      care.push({ id: 'legal', title: 'Información legal', body: legalSplit[1].trim() });
    }
  }

  return [...clinical, ...diagnosis, ...care];
}

export function blocksForTab(blocks: PatientReportBlock[], tab: PatientReportTab): PatientReportBlock[] {
  const clinicalIds = new Set(['ant', 'inf', 'fue', 'ana', 'noe', 'desc']);
  const diagnosisIds = new Set(['d1', 'd2', 'd3', 'diag']);
  const careIds = new Set(['r1', 'r2', 'r3', 'r4', 'r5', 'rec', 'legal']);

  if (tab === 'clinical') return blocks.filter((b) => clinicalIds.has(b.id));
  if (tab === 'diagnosis') return blocks.filter((b) => diagnosisIds.has(b.id));
  return blocks.filter((b) => careIds.has(b.id));
}

export function defaultReportTab(blocks: PatientReportBlock[]): PatientReportTab {
  if (blocks.some((b) => ['ant', 'inf', 'fue', 'ana', 'noe', 'desc'].includes(b.id))) return 'clinical';
  if (blocks.some((b) => ['d1', 'd2', 'd3', 'diag'].includes(b.id))) return 'diagnosis';
  return 'care';
}

/** Texto plano legible para vista rápida (1–2 líneas). */
export function reportPreviewLine(report: ClinicalReport, max = 140): string {
  const blocks = buildPatientReportBlocks(report);
  const first = blocks.find((b) => b.body.trim());
  if (!first) return '—';
  const line = first.body.replace(/\s+/g, ' ').trim();
  return line.length > max ? `${line.slice(0, max)}…` : line;
}

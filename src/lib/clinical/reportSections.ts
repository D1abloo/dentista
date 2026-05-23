import { REPORT_COLEGIO_FOOTER } from '@/lib/clinical/reportLegal';

/** Bloques editables del informe (se ensamblan al guardar en description / diagnosis / recommendations). */
export type ClinicalReportSections = {
  antecedentes: string;
  informeTratamiento: string;
  fuentesInforme: string;
  anamnesisExploracion: string;
  tratamientosNoEjecutados: string;
  diagnosticoPrincipal: string;
  hallazgosSecundarios: string;
  estadoGeneral: string;
  recomendacionesPaciente: string;
  tratamientoRecomendado: string;
  seguimiento: string;
  proximaRevision: string;
  indicacionesAdicionales: string;
  avisoLegal: string;
};

export const EMPTY_REPORT_SECTIONS: ClinicalReportSections = {
  antecedentes: '',
  informeTratamiento: '',
  fuentesInforme: '',
  anamnesisExploracion: '',
  tratamientosNoEjecutados: '',
  diagnosticoPrincipal: '',
  hallazgosSecundarios: '',
  estadoGeneral: '',
  recomendacionesPaciente: '',
  tratamientoRecomendado: '',
  seguimiento: '',
  proximaRevision: '',
  indicacionesAdicionales: '',
  avisoLegal: REPORT_COLEGIO_FOOTER
};

export function assembleClinicalDescription(sections: ClinicalReportSections): string {
  const blocks: Array<[string, string]> = [
    ['ANTECEDENTES', sections.antecedentes],
    ['INFORME CLÍNICO SOBRE TRATAMIENTO', sections.informeTratamiento],
    ['FUENTES DEL INFORME', sections.fuentesInforme],
    ['ANÁMNESIS Y EXPLORACIÓN', sections.anamnesisExploracion],
    ['TRATAMIENTOS PRESUPUESTADOS Y NO EJECUTADOS', sections.tratamientosNoEjecutados]
  ];
  return blocks
    .filter(([, body]) => body.trim())
    .map(([title, body]) => `${title}\n${body.trim()}`)
    .join('\n\n');
}

export function assembleDiagnosis(sections: ClinicalReportSections, professionalLine?: string): string {
  const parts = [
    `Diagnóstico principal:\n${sections.diagnosticoPrincipal.trim()}`,
    sections.hallazgosSecundarios.trim()
      ? `Diagnósticos secundarios / hallazgos:\n${sections.hallazgosSecundarios.trim()}`
      : '',
    sections.estadoGeneral.trim() ? `Estado general:\n${sections.estadoGeneral.trim()}` : '',
    professionalLine?.trim() ?? ''
  ].filter(Boolean);
  return parts.join('\n\n');
}

export function assembleRecommendations(sections: ClinicalReportSections): string {
  const parts = [
    sections.recomendacionesPaciente.trim()
      ? `Recomendaciones al paciente:\n${sections.recomendacionesPaciente.trim()}`
      : '',
    sections.tratamientoRecomendado.trim()
      ? `Tratamiento recomendado:\n${sections.tratamientoRecomendado.trim()}`
      : '',
    sections.seguimiento.trim() ? `Seguimiento:\n${sections.seguimiento.trim()}` : '',
    sections.proximaRevision.trim() ? `Próxima revisión sugerida:\n${sections.proximaRevision.trim()}` : '',
    sections.indicacionesAdicionales.trim()
      ? `Indicaciones adicionales:\n${sections.indicacionesAdicionales.trim()}`
      : '',
    sections.avisoLegal.trim() ? `---\n${sections.avisoLegal.trim()}` : ''
  ].filter(Boolean);
  return parts.join('\n\n');
}

export function sectionsAreComplete(sections: ClinicalReportSections): string | null {
  if (!sections.antecedentes.trim()) return 'Completa la sección de antecedentes.';
  if (!sections.informeTratamiento.trim()) return 'Completa el informe clínico sobre el tratamiento.';
  if (!sections.anamnesisExploracion.trim()) return 'Completa la anamnesis y exploración.';
  if (!sections.diagnosticoPrincipal.trim()) return 'Completa el diagnóstico principal.';
  if (!sections.recomendacionesPaciente.trim()) return 'Completa las recomendaciones al paciente.';
  return null;
}

/** Intenta partir un informe ya guardado en bloques editables. */
export function parseStoredReportSections(
  description: string,
  diagnosis: string,
  recommendations: string
): ClinicalReportSections {
  const base = { ...EMPTY_REPORT_SECTIONS };

  const extract = (text: string, header: string, nextHeaders: string[]) => {
    const pattern = new RegExp(
      `${header}\\s*\\n([\\s\\S]*?)(?=\\n(?:${nextHeaders.join('|')})\\s*\\n|$)`,
      'i'
    );
    const m = text.match(pattern);
    return m?.[1]?.trim() ?? '';
  };

  base.antecedentes = extract(description, 'ANTECEDENTES', [
    'INFORME CLÍNICO SOBRE TRATAMIENTO',
    'FUENTES',
    'ANÁMNESIS',
    'TRATAMIENTOS'
  ]);
  base.informeTratamiento = extract(description, 'INFORME CLÍNICO SOBRE TRATAMIENTO', [
    'FUENTES',
    'ANÁMNESIS',
    'TRATAMIENTOS'
  ]);
  base.fuentesInforme = extract(description, 'FUENTES DEL INFORME', ['ANÁMNESIS', 'TRATAMIENTOS']);
  base.anamnesisExploracion = extract(description, 'ANÁMNESIS Y EXPLORACIÓN', ['TRATAMIENTOS']);
  base.tratamientosNoEjecutados = extract(description, 'TRATAMIENTOS PRESUPUESTADOS Y NO EJECUTADOS', []);

  if (!base.antecedentes && description.trim()) {
    base.anamnesisExploracion = description.trim();
  }

  const diagPrincipal = diagnosis.match(/Diagnóstico principal:\s*\n?([\s\S]*?)(?=\n\nDiagnósticos|\n\nEstado|$)/i);
  base.diagnosticoPrincipal = diagPrincipal?.[1]?.trim() ?? diagnosis.trim();

  const hallazgos = diagnosis.match(/Diagnósticos secundarios[^:]*:\s*\n?([\s\S]*?)(?=\n\nEstado|$)/i);
  base.hallazgosSecundarios = hallazgos?.[1]?.trim() ?? '';

  const estado = diagnosis.match(/Estado general:\s*\n?([\s\S]*?)(?=\n\nProfesional|$)/i);
  base.estadoGeneral = estado?.[1]?.trim() ?? '';

  const recPac = recommendations.match(/Recomendaciones al paciente:\s*\n?([\s\S]*?)(?=\n\nTratamiento|$)/i);
  base.recomendacionesPaciente = recPac?.[1]?.trim() ?? '';

  const trRec = recommendations.match(/Tratamiento recomendado:\s*\n?([\s\S]*?)(?=\n\nSeguimiento|$)/i);
  base.tratamientoRecomendado = trRec?.[1]?.trim() ?? '';

  const seg = recommendations.match(/Seguimiento:\s*\n?([\s\S]*?)(?=\n\nPróxima|$)/i);
  base.seguimiento = seg?.[1]?.trim() ?? '';

  const prox = recommendations.match(/Próxima revisión[^:]*:\s*\n?([\s\S]*?)(?=\n\nIndicaciones|$)/i);
  base.proximaRevision = prox?.[1]?.trim() ?? '';

  const ind = recommendations.match(/Indicaciones adicionales:\s*\n?([\s\S]*?)(?=\n---|$)/i);
  base.indicacionesAdicionales = ind?.[1]?.trim() ?? '';

  const legal = recommendations.split('---').pop()?.trim();
  if (legal?.includes('colegio@dentistascadiz.com')) base.avisoLegal = legal;

  return base;
}

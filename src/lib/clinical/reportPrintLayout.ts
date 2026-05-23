import type { ClinicalReport } from '@/types/demo';
import {
  parseStoredReportSections,
  type ClinicalReportSections
} from '@/lib/clinical/reportSections';

export type ReportPrintSection = {
  id: string;
  group: 'clinical' | 'diagnosis' | 'care' | 'legal';
  groupLabel: string;
  step: string;
  title: string;
  body: string;
};

function joinBlocks(parts: string[]): string {
  return parts.map((p) => p.trim()).filter(Boolean).join('\n\n');
}

function hasMeaningfulContent(body: string): boolean {
  const t = body.trim();
  if (!t) return false;
  const lines = t.split('\n').map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return false;
  return lines.some((l) => !/^\[.+\]$/.test(l));
}

function trimBeforeHeader(body: string, headerPattern: string): string {
  const m = body.match(new RegExp(`\\n\\s*${headerPattern}\\s*\\n`, 'i'));
  if (m && m.index != null && m.index > 0) return body.slice(0, m.index).trim();
  return body.trim();
}

/** Secciones ordenadas sin duplicar bloques del parser de paciente. */
export function buildStructuredPrintSections(report: ClinicalReport): ReportPrintSection[] {
  const s = parseStoredReportSections(
    report.description ?? '',
    report.diagnosis ?? '',
    report.recommendations ?? ''
  );

  if (s.fuentesInforme.trim()) {
    s.informeTratamiento = trimBeforeHeader(s.informeTratamiento, 'FUENTES DEL INFORME');
  }
  if (s.anamnesisExploracion.trim()) {
    s.informeTratamiento = trimBeforeHeader(s.informeTratamiento, 'ANÁMNESIS Y EXPLORACIÓN');
    s.fuentesInforme = trimBeforeHeader(s.fuentesInforme, 'ANÁMNESIS Y EXPLORACIÓN');
  }
  if (s.tratamientosNoEjecutados.trim()) {
    s.informeTratamiento = trimBeforeHeader(s.informeTratamiento, 'TRATAMIENTOS PRESUPUESTADOS');
    s.fuentesInforme = trimBeforeHeader(s.fuentesInforme, 'TRATAMIENTOS PRESUPUESTADOS');
    s.anamnesisExploracion = trimBeforeHeader(s.anamnesisExploracion, 'TRATAMIENTOS PRESUPUESTADOS');
  }

  const out: ReportPrintSection[] = [];
  let step = 0;
  const push = (
    id: string,
    group: ReportPrintSection['group'],
    groupLabel: string,
    title: string,
    body: string
  ) => {
    if (!hasMeaningfulContent(body)) return;
    step += 1;
    out.push({
      id,
      group,
      groupLabel,
      step: String(step),
      title,
      body: body.trim()
    });
  };

  push('ant', 'clinical', 'Informe clínico', 'Antecedentes', s.antecedentes);
  push('inf', 'clinical', 'Informe clínico', 'Motivo y contexto de la visita', s.informeTratamiento);
  push('ana', 'clinical', 'Informe clínico', 'Exploración y actuación', s.anamnesisExploracion);
  if (hasMeaningfulContent(s.fuentesInforme)) {
    push('fue', 'clinical', 'Informe clínico', 'Fuentes del informe', s.fuentesInforme);
  }
  if (hasMeaningfulContent(s.tratamientosNoEjecutados)) {
    push('noe', 'clinical', 'Informe clínico', 'Tratamientos no ejecutados', s.tratamientosNoEjecutados);
  }

  push(
    'diag',
    'diagnosis',
    'Diagnóstico',
    'Diagnóstico',
    joinBlocks([s.diagnosticoPrincipal, s.hallazgosSecundarios, s.estadoGeneral])
  );

  push(
    'care',
    'care',
    'Indicaciones',
    'Recomendaciones y seguimiento',
    joinBlocks([
      s.recomendacionesPaciente,
      s.tratamientoRecomendado,
      s.seguimiento,
      s.proximaRevision,
      s.indicacionesAdicionales
    ])
  );

  if (s.avisoLegal.trim()) {
    push('legal', 'legal', 'Aviso legal', 'Aviso legal', s.avisoLegal);
  }

  return out;
}

const PLACEHOLDER_RE = /\[([^\]]+)\]/g;

export function isPlaceholderLine(line: string) {
  const t = line.trim();
  return !t || /\[([^\]]+)\]/.test(t) || /^[-•]\s*\[/.test(t);
}

/** Convierte líneas con [completar] en zonas de escritura visual. */
export function formatPrintBodyHtml(body: string): string {
  if (!body.trim()) {
    return '<div class="write-box write-box--empty" aria-label="Espacio para completar">&nbsp;</div>';
  }

  const lines = body.split('\n');
  const parts: string[] = [];
  let listOpen = false;

  const closeList = () => {
    if (listOpen) {
      parts.push('</ul>');
      listOpen = false;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      closeList();
      continue;
    }

    const isBullet = /^[-•]\s/.test(trimmed);
    const content = isBullet ? trimmed.replace(/^[-•]\s+/, '') : trimmed;

    const htmlLine = content.replace(PLACEHOLDER_RE, (_m, label) => {
      const hint = String(label).replace(/^\s+|\s+$/g, '');
      return `<span class="write-inline" data-hint="${escapeAttr(hint)}"></span>`;
    });

    if (isBullet) {
      if (!listOpen) {
        parts.push('<ul class="write-list">');
        listOpen = true;
      }
      const needsBox = isPlaceholderLine(content) || htmlLine.includes('write-inline');
      parts.push(
        needsBox
          ? `<li class="write-li"><div class="write-box">${htmlLine || '&nbsp;'}</div></li>`
          : `<li>${htmlLine}</li>`
      );
    } else {
      closeList();
      if (isPlaceholderLine(trimmed) || (htmlLine.includes('write-inline') && trimmed.length < 120)) {
        parts.push(`<div class="write-box">${htmlLine}</div>`);
      } else {
        parts.push(`<p class="write-p">${htmlLine}</p>`);
      }
    }
  }

  closeList();
  return parts.join('') || '<div class="write-box write-box--empty">&nbsp;</div>';
}

function escapeAttr(s: string) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

export const REPORT_PRINT_STYLES = `
  @page { size: A4; margin: 14mm 16mm; }
  * { box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    color: #0f2742;
    margin: 0;
    padding: 0;
    font-size: 10.5pt;
    line-height: 1.5;
    background: #f1f5f9;
  }
  .doc {
    max-width: 210mm;
    margin: 0 auto;
    background: #fff;
    border: 1px solid #cbd5e1;
    box-shadow: 0 4px 24px rgba(15, 39, 66, 0.08);
  }
  .doc__inner { padding: 1.35rem 1.6rem 1.5rem; }
  .letterhead {
    display: grid;
    grid-template-columns: 80px 1fr;
    gap: 1rem;
    align-items: start;
    padding-bottom: 1rem;
    margin-bottom: 1rem;
    border-bottom: 3px solid #14b8a6;
  }
  .letterhead__logo {
    width: 72px;
    height: 72px;
    object-fit: contain;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    padding: 4px;
    background: #fff;
  }
  .letterhead__name {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 800;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    color: #0f2742;
  }
  .letterhead__meta { margin: 0.25rem 0 0; font-size: 0.82rem; color: #475569; }
  .doc-title {
    margin: 0 0 0.75rem;
    padding: 0.65rem 0.85rem;
    background: linear-gradient(90deg, #f0fdfa, #fff);
    border: 1px solid #99f6e4;
    border-radius: 0.65rem;
    font-size: 1rem;
    font-weight: 700;
    color: #0f2742;
  }
  .patient-bar {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
    margin-bottom: 1.25rem;
    font-size: 0.8rem;
  }
  .patient-bar__cell {
    padding: 0.45rem 0.65rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.45rem;
    background: #f8fafc;
  }
  .patient-bar__label {
    display: block;
    font-size: 0.62rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #64748b;
    margin-bottom: 0.15rem;
  }
  .group {
    margin-bottom: 1.1rem;
    page-break-inside: avoid;
  }
  .group__label {
    margin: 0 0 0.5rem;
    padding: 0.35rem 0.65rem;
    background: #0f2742;
    color: #fff;
    font-size: 0.68rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    border-radius: 0.4rem;
  }
  .section {
    margin-bottom: 0.75rem;
    border: 1px solid #cbd5e1;
    border-radius: 0.65rem;
    overflow: hidden;
    page-break-inside: avoid;
  }
  .section__head {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.45rem 0.75rem;
    background: linear-gradient(90deg, #ecfeff, #f8fafc);
    border-bottom: 1px solid #e2e8f0;
  }
  .section__step {
    flex-shrink: 0;
    width: 1.65rem;
    height: 1.65rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.35rem;
    background: #14b8a6;
    color: #fff;
    font-size: 0.65rem;
    font-weight: 800;
  }
  .section__title {
    margin: 0;
    font-size: 0.78rem;
    font-weight: 800;
    color: #0f2742;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .section__body {
    padding: 0.75rem 0.85rem;
    min-height: 3.5rem;
  }
  .section--legal .section__head { background: #f8fafc; }
  .section--legal .section__step { background: #64748b; }
  .section--legal .section__body { font-size: 0.72rem; color: #475569; }
  .write-p { margin: 0 0 0.5rem; }
  .write-p:last-child { margin-bottom: 0; }
  .write-list { margin: 0; padding-left: 1.1rem; }
  .write-li { margin-bottom: 0.4rem; }
  .write-box {
    min-height: 2.75rem;
    padding: 0.5rem 0.65rem;
    border: 1px dashed #94a3b8;
    border-radius: 0.45rem;
    background: #fff;
    margin-bottom: 0.45rem;
  }
  .write-box--empty { min-height: 3.25rem; }
  .write-box:last-child { margin-bottom: 0; }
  .write-inline {
    display: inline-block;
    min-width: 12rem;
    min-height: 1.15rem;
    border-bottom: 1px solid #64748b;
    vertical-align: bottom;
    margin: 0 0.15rem;
  }
  .write-inline:empty::after {
    content: attr(data-hint);
    color: #94a3b8;
    font-size: 0.75em;
    font-style: italic;
  }
  .footer-pro {
    margin-top: 1.25rem;
    padding: 0.85rem 1rem;
    border: 2px solid #0f2742;
    border-radius: 0.65rem;
    background: #f8fafc;
  }
  .footer-pro__label {
    margin: 0 0 0.4rem;
    font-size: 0.65rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #64748b;
  }
  .footer-pro__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.35rem 1rem;
    font-size: 0.82rem;
  }
  .footer-pro__name { font-weight: 800; font-size: 0.95rem; grid-column: 1 / -1; }
  .print-hint {
    margin-top: 1rem;
    text-align: center;
    font-size: 0.72rem;
    color: #94a3b8;
  }
  @media print {
    body { background: #fff; }
    .doc { border: none; box-shadow: none; max-width: none; }
    .print-hint { display: none; }
    .write-box { border-style: solid; border-color: #cbd5e1; }
  }
`;

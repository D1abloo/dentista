import { isImageMime, isPdfMime } from '@/lib/demoFiles';
import { patientName } from '@/lib/selectors';
import type { DemoState, DocumentType, PatientDocument } from '@/types/demo';

export type DocFilter =
  | 'todos'
  | 'consentimiento'
  | 'radiografia'
  | 'recibo'
  | 'imagenes'
  | 'visible'
  | 'privado';

export type DocSort = 'fecha' | 'titulo' | 'paciente' | 'tipo';

export function formatNhcDisplay(nhc?: string) {
  if (!nhc) return '—';
  const n = String(nhc).replace(/\D/g, '');
  return `NHC ${n.padStart(4, '0')}`;
}

export function docTypeLabel(type: DocumentType): string {
  const map: Record<DocumentType, string> = {
    consentimiento: 'Consentimiento',
    radiografia: 'Radiografía',
    recibo: 'Recibo',
    informe: 'Informe',
    factura: 'Factura',
    otro: 'Otro'
  };
  return map[type] ?? type;
}

export function docFormatLabel(doc: Pick<PatientDocument, 'mimeType' | 'fileName'>): 'PDF' | 'Imagen' | 'Archivo' {
  if (isPdfMime(doc.mimeType, doc.fileName)) return 'PDF';
  if (isImageMime(doc.mimeType, doc.fileName)) return 'Imagen';
  return 'Archivo';
}

export function isPendingReview(doc: PatientDocument): boolean {
  return doc.visibility === 'admin' && Boolean(doc.fileRef);
}

export function documentMatchesSearch(state: DemoState, doc: PatientDocument, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const patient = state.patients.find((p) => p.id === doc.patientId);
  const nhc = patient?.nhc ? String(patient.nhc).toLowerCase() : '';
  return (
    doc.id.toLowerCase().includes(q) ||
    doc.title.toLowerCase().includes(q) ||
    doc.type.toLowerCase().includes(q) ||
    docTypeLabel(doc.type).toLowerCase().includes(q) ||
    patientName(state, doc.patientId).toLowerCase().includes(q) ||
    (patient?.dni?.toLowerCase().includes(q) ?? false) ||
    nhc.includes(q.replace(/\D/g, '')) ||
    formatNhcDisplay(patient?.nhc).toLowerCase().includes(q)
  );
}

export function filterDocuments(
  docs: PatientDocument[],
  state: DemoState,
  filter: DocFilter,
  search: string
): PatientDocument[] {
  let list = [...docs];
  if (search.trim()) list = list.filter((d) => documentMatchesSearch(state, d, search));

  switch (filter) {
    case 'consentimiento':
      list = list.filter((d) => d.type === 'consentimiento');
      break;
    case 'radiografia':
      list = list.filter((d) => d.type === 'radiografia');
      break;
    case 'recibo':
      list = list.filter((d) => d.type === 'recibo');
      break;
    case 'imagenes':
      list = list.filter((d) => d.type === 'radiografia' || isImageMime(d.mimeType, d.fileName));
      break;
    case 'visible':
      list = list.filter((d) => d.visibility === 'paciente');
      break;
    case 'privado':
      list = list.filter((d) => d.visibility === 'admin');
      break;
    default:
      break;
  }
  return list;
}

export function sortDocuments(docs: PatientDocument[], state: DemoState, sort: DocSort): PatientDocument[] {
  const sorted = [...docs];
  if (sort === 'titulo') sorted.sort((a, b) => a.title.localeCompare(b.title, 'es'));
  else if (sort === 'paciente')
    sorted.sort((a, b) => patientName(state, a.patientId).localeCompare(patientName(state, b.patientId), 'es'));
  else if (sort === 'tipo') sorted.sort((a, b) => a.type.localeCompare(b.type, 'es'));
  else sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return sorted;
}

export function computeDocumentKpis(docs: PatientDocument[]) {
  const total = docs.length;
  const visible = docs.filter((d) => d.visibility === 'paciente').length;
  const pending = docs.filter(isPendingReview).length;
  const latest = docs.reduce<string | null>((acc, d) => {
    if (!acc || d.createdAt > acc) return d.createdAt;
    return acc;
  }, null);
  return { total, visible, pending, latest };
}

export function lastUploadLabel(iso: string | null, today = new Date().toISOString().slice(0, 10)): string {
  if (!iso) return '—';
  if (iso === today) return 'Hoy';
  const y = new Date(today);
  y.setDate(y.getDate() - 1);
  if (iso === y.toISOString().slice(0, 10)) return 'Ayer';
  const [y2, m, d] = iso.split('-');
  return `${d}/${m}/${y2}`;
}

export function formatDocDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-');
  if (!d) return iso;
  return `${d}/${m}/${y}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function patientLine(state: DemoState, patientId: string): string {
  const p = state.patients.find((x) => x.id === patientId);
  const name = patientName(state, patientId);
  return p?.nhc ? `${name} · ${formatNhcDisplay(p.nhc)}` : name;
}

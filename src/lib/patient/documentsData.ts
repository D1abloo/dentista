import type { DemoState, DocumentType, PatientDocument } from '@/types/demo';
import { fmtDate } from '@/lib/format';
import { isImageMime, isPdfMime } from '@/lib/demoFiles';
import { visibleReportsForPatient } from '@/lib/selectors';

const READ_KEY = 'dentista_patient_documents_read';

export type DocumentTypeLabel =
  | 'Consentimiento'
  | 'Radiografía'
  | 'Recibo'
  | 'Informe'
  | 'Factura'
  | 'Imagen'
  | 'Documento';

export type DocFormatLabel = 'PDF' | 'Imagen' | 'Otro';

export type PatientDocumentView = {
  document: PatientDocument;
  clinicId: string;
  clinicName: string;
  typeLabel: DocumentTypeLabel;
  formatLabel: DocFormatLabel;
  publishedLabel: string;
  sizeLabel: string;
  description: string;
  visibilityLabel: string;
  hasFile: boolean;
  read: boolean;
  isNew: boolean;
  previewUrl: string | null;
  relatedReport: { id: string; title: string } | null;
  relatedInvoice: { id: string; label: string } | null;
};

function readSet(patientId: string): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(READ_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
    return new Set(map[patientId] ?? []);
  } catch {
    return new Set();
  }
}

function persistRead(patientId: string, ids: Set<string>) {
  try {
    const raw = localStorage.getItem(READ_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
    map[patientId] = [...ids];
    localStorage.setItem(READ_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function markPatientDocumentRead(patientId: string, documentId: string) {
  const ids = readSet(patientId);
  ids.add(documentId);
  persistRead(patientId, ids);
}

function isRecent(iso: string, days: number) {
  return new Date(iso).getTime() >= Date.now() - days * 86400000;
}

export function typeLabelFor(type: DocumentType, title: string): DocumentTypeLabel {
  const t = title.toLowerCase();
  if (type === 'consentimiento') return 'Consentimiento';
  if (type === 'radiografia') return 'Radiografía';
  if (type === 'recibo' || t.includes('recibo')) return 'Recibo';
  if (type === 'factura') return 'Factura';
  if (type === 'informe') return 'Informe';
  if (t.includes('radiograf') || t.includes('foto') || t.includes('intraoral')) return 'Radiografía';
  if (t.includes('consent')) return 'Consentimiento';
  return 'Documento';
}

export function formatLabelFor(doc: PatientDocument): DocFormatLabel {
  if (isImageMime(doc.mimeType, doc.fileName ?? doc.fileRef)) return 'Imagen';
  if (isPdfMime(doc.mimeType, doc.fileName ?? doc.fileRef)) return 'PDF';
  if (doc.fileRef?.endsWith('.svg')) return 'Imagen';
  return doc.fileRef ? 'Otro' : 'Otro';
}

function estimateSize(doc: PatientDocument): string {
  if (!doc.fileRef) return '—';
  if (isImageMime(doc.mimeType, doc.fileName ?? doc.fileRef)) return '1,2 MB';
  if (doc.fileName?.includes('cbct') || doc.title.toLowerCase().includes('cbct')) return '2,4 MB';
  return '245 KB';
}

function clinicForDocument(state: DemoState, doc: PatientDocument) {
  const appt = doc.appointmentId ? state.appointments.find((a) => a.id === doc.appointmentId) : undefined;
  const clinicId = appt?.clinicId ?? state.clinics.find((c) => c.tenantId === doc.tenantId)?.id ?? '';
  const clinic = state.clinics.find((c) => c.id === clinicId);
  return { clinicId, clinicName: clinic?.name ?? 'Clínica' };
}

function relatedReport(state: DemoState, doc: PatientDocument) {
  const reports = visibleReportsForPatient(state, doc.patientId);
  if (doc.appointmentId) {
    const r = reports.find((x) => x.appointmentId === doc.appointmentId);
    if (r) return { id: r.id, title: r.title };
  }
  if (doc.type === 'informe') {
    const r = reports.find((x) => x.title.toLowerCase().includes(doc.title.split(' ').slice(-1)[0]?.toLowerCase() ?? ''));
    if (r) return { id: r.id, title: r.title };
  }
  return reports[0] ? { id: reports[0].id, title: reports[0].title } : null;
}

function relatedInvoice(state: DemoState, doc: PatientDocument) {
  if (doc.type === 'factura') {
    const inv = state.invoices.find((i) => i.patientId === doc.patientId && doc.title.includes(i.id));
    if (inv) return { id: inv.id, label: inv.concept };
    return state.invoices.find((i) => i.patientId === doc.patientId)
      ? { id: state.invoices.find((i) => i.patientId === doc.patientId)!.id, label: 'Factura vinculada' }
      : null;
  }
  return null;
}

export function enrichPatientDocuments(
  state: DemoState,
  patientId: string,
  documents: PatientDocument[],
  resolveUrl: (fileRef: string) => string | null
): PatientDocumentView[] {
  const read = readSet(patientId);
  return documents.map((document) => {
    const { clinicId, clinicName } = clinicForDocument(state, document);
    const wasRead = read.has(document.id);
    const isNew = !wasRead && isRecent(document.createdAt, 45);
    const previewUrl = document.fileRef ? resolveUrl(document.fileRef) : null;
    return {
      document,
      clinicId,
      clinicName,
      typeLabel: typeLabelFor(document.type, document.title),
      formatLabel: formatLabelFor(document),
      publishedLabel: fmtDate(document.createdAt),
      sizeLabel: estimateSize(document),
      description:
        document.description?.trim() ||
        'Documento compartido por la clínica para su consulta y descarga desde el portal del paciente.',
      visibilityLabel: 'Visible para paciente',
      hasFile: Boolean(document.fileRef),
      read: wasRead,
      isNew,
      previewUrl,
      relatedReport: relatedReport(state, document),
      relatedInvoice: relatedInvoice(state, document)
    };
  });
}

export function buildDocumentKpis(views: PatientDocumentView[]) {
  const sorted = [...views].sort((a, b) => b.document.createdAt.localeCompare(a.document.createdAt));
  return {
    available: views.length,
    newCount: views.filter((v) => v.isNew).length,
    consentCount: views.filter((v) => v.typeLabel === 'Consentimiento').length,
    xrayCount: views.filter((v) => v.typeLabel === 'Radiografía').length,
    receiptCount: views.filter((v) => v.typeLabel === 'Recibo' || v.document.type === 'factura').length,
    lastDate: sorted[0]?.publishedLabel ?? '—'
  };
}

export type DocumentChip =
  | 'all'
  | 'new'
  | 'consentimiento'
  | 'radiografia'
  | 'recibo'
  | 'imagen'
  | 'pdf'
  | '30d';

export type DocumentSort = 'recent' | 'oldest' | 'title';

export function filterAndSortDocuments(
  views: PatientDocumentView[],
  opts: { q: string; chip: DocumentChip; sort: DocumentSort }
): PatientDocumentView[] {
  let list = [...views];
  const s = opts.q.trim().toLowerCase();
  if (s) {
    list = list.filter(
      (v) =>
        v.document.title.toLowerCase().includes(s) ||
        (v.document.description ?? '').toLowerCase().includes(s) ||
        v.clinicName.toLowerCase().includes(s) ||
        v.typeLabel.toLowerCase().includes(s) ||
        v.publishedLabel.includes(s) ||
        v.formatLabel.toLowerCase().includes(s)
    );
  }
  if (opts.chip === 'new') list = list.filter((v) => v.isNew);
  if (opts.chip === 'consentimiento') list = list.filter((v) => v.typeLabel === 'Consentimiento');
  if (opts.chip === 'radiografia') list = list.filter((v) => v.typeLabel === 'Radiografía');
  if (opts.chip === 'recibo') list = list.filter((v) => v.typeLabel === 'Recibo' || v.document.type === 'factura');
  if (opts.chip === 'imagen') list = list.filter((v) => v.formatLabel === 'Imagen');
  if (opts.chip === 'pdf') list = list.filter((v) => v.formatLabel === 'PDF');
  if (opts.chip === '30d') list = list.filter((v) => isRecent(v.document.createdAt, 30));

  if (opts.sort === 'oldest') list.sort((a, b) => a.document.createdAt.localeCompare(b.document.createdAt));
  else if (opts.sort === 'title') list.sort((a, b) => a.document.title.localeCompare(b.document.title, 'es'));
  else list.sort((a, b) => b.document.createdAt.localeCompare(a.document.createdAt));

  return list;
}

export function reportLink(reportId: string) {
  return `/paciente/informes`;
}

export function messagesWithDocumentContext(title: string) {
  return `/paciente/mensajes?contexto=${encodeURIComponent(`Consulta sobre documento: ${title}`)}`;
}

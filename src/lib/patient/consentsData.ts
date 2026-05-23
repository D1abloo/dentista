import type { DemoState, InformedConsent } from '@/types/demo';
import { effectiveConsentStatus } from '@/lib/demoStore';
import { downloadDemoFileRef, resolveDemoFileUrl } from '@/lib/demoFiles';
import { fmtDate, todayIso } from '@/lib/format';

export type ConsentDisplayStatus = 'pendiente' | 'firmado' | 'caducado';

export type PatientConsentView = {
  consent: InformedConsent;
  clinicName: string;
  displayStatus: ConsentDisplayStatus;
  statusLabel: string;
  publishedLabel: string;
  signedLabel: string;
  expiresLabel: string;
  hasPdf: boolean;
  pdfLabel: string;
  summary: string;
  previewUrl: string | null;
  canSign: boolean;
  canDownload: boolean;
};

const STATUS_LABELS: Record<ConsentDisplayStatus, string> = {
  pendiente: 'Pendiente de firma',
  firmado: 'Firmado',
  caducado: 'Caducado'
};

function clinicName(state: DemoState, tenantId: string) {
  return state.clinics.find((c) => c.tenantId === tenantId)?.name ?? 'Clínica';
}

export function visibleConsentsForPatient(state: DemoState, patientId: string): InformedConsent[] {
  return state.informedConsents.filter((c) => c.patientId === patientId);
}

export function enrichPatientConsents(state: DemoState, consents: InformedConsent[]): PatientConsentView[] {
  return consents.map((consent) => {
    const displayStatus = effectiveConsentStatus(consent, todayIso());
    const hasPdf = Boolean(consent.fileRef);
    return {
      consent,
      clinicName: clinicName(state, consent.tenantId),
      displayStatus,
      statusLabel: STATUS_LABELS[displayStatus],
      publishedLabel: fmtDate(consent.createdAt),
      signedLabel: consent.signedAt ? fmtDate(consent.signedAt.slice(0, 10)) : '—',
      expiresLabel: consent.expiresAt ? fmtDate(consent.expiresAt) : '—',
      hasPdf,
      pdfLabel: hasPdf ? 'Disponible' : 'No disponible',
      summary:
        consent.summary ??
        'Documento informativo sobre el procedimiento, beneficios, riesgos y autorización para realizar el tratamiento indicado.',
      previewUrl: consent.fileRef ? resolveDemoFileUrl(consent.fileRef) : null,
      canSign: displayStatus === 'pendiente',
      canDownload: hasPdf || displayStatus === 'firmado'
    };
  });
}

export function buildConsentKpis(state: DemoState, patientId: string, views: PatientConsentView[]) {
  const pending = views.filter((v) => v.displayStatus === 'pendiente').length;
  const signed = views.filter((v) => v.displayStatus === 'firmado').length;
  const expired = views.filter((v) => v.displayStatus === 'caducado').length;
  const dates = views.flatMap((v) => [v.consent.createdAt, v.consent.signedAt?.slice(0, 10)].filter(Boolean) as string[]);
  dates.sort((a, b) => b.localeCompare(a));
  const clinics = new Set(views.map((v) => v.consent.tenantId));
  return {
    pending,
    signed,
    expired,
    lastConsent: dates[0] ? fmtDate(dates[0]) : '—',
    clinics: clinics.size
  };
}

export type ConsentChip = 'all' | 'pendiente' | 'firmado' | 'caducado' | 'pdf' | '30d';
export type PatientConsentSort = 'recent' | 'oldest' | 'expires';

function isRecent(iso: string, days: number) {
  const t = new Date(iso.length > 10 ? iso : `${iso}T12:00:00`).getTime();
  return t >= Date.now() - days * 86400000;
}

export function filterAndSortConsents(
  views: PatientConsentView[],
  opts: { q: string; chip: ConsentChip; sort: PatientConsentSort }
): PatientConsentView[] {
  let list = [...views];
  const s = opts.q.trim().toLowerCase();
  if (s) {
    list = list.filter(
      (v) =>
        v.consent.title.toLowerCase().includes(s) ||
        v.consent.treatmentName.toLowerCase().includes(s) ||
        v.clinicName.toLowerCase().includes(s) ||
        v.statusLabel.toLowerCase().includes(s) ||
        v.publishedLabel.includes(s) ||
        v.signedLabel.includes(s)
    );
  }
  if (opts.chip === 'pendiente') list = list.filter((v) => v.displayStatus === 'pendiente');
  if (opts.chip === 'firmado') list = list.filter((v) => v.displayStatus === 'firmado');
  if (opts.chip === 'caducado') list = list.filter((v) => v.displayStatus === 'caducado');
  if (opts.chip === 'pdf') list = list.filter((v) => v.hasPdf);
  if (opts.chip === '30d') list = list.filter((v) => isRecent(v.consent.createdAt, 30));

  if (opts.sort === 'oldest') {
    list.sort((a, b) => a.consent.createdAt.localeCompare(b.consent.createdAt));
  } else if (opts.sort === 'expires') {
    list.sort((a, b) => (a.consent.expiresAt ?? '9999').localeCompare(b.consent.expiresAt ?? '9999'));
  } else {
    list.sort((a, b) => b.consent.createdAt.localeCompare(a.consent.createdAt));
  }
  return list;
}

export function downloadConsentPdf(v: PatientConsentView): boolean {
  const ref = v.consent.signedCopyRef ?? v.consent.fileRef;
  if (!ref) return false;
  return downloadDemoFileRef(ref, v.consent.fileName ?? `${v.consent.id}.pdf`);
}

export function messagesWithConsentContext(title: string, treatment: string) {
  return `/paciente/mensajes?contexto=${encodeURIComponent(`Consulta sobre consentimiento: ${title} (${treatment})`)}`;
}

export function typedSignatureDataUrl(fullName: string): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = 480;
  canvas.height = 140;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#e2e8f0';
  ctx.strokeRect(0.5, 0.5, canvas.width - 1, canvas.height - 1);
  ctx.font = 'italic 32px Georgia, "Times New Roman", serif';
  ctx.fillStyle = '#0f2742';
  ctx.fillText(fullName.trim(), 24, 82);
  return canvas.toDataURL('image/png');
}

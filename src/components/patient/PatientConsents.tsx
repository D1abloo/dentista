import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Download,
  Eye,
  FileSignature,
  Lock,
  MessageSquare,
  PenLine,
  Search,
  Shield,
  Sparkles,
  X
} from 'lucide-react';
import { useCountUp } from '@/hooks/useCountUp';
import { useDemoStore } from '@/hooks/useDemoStore';
import { useNotice } from '@/hooks/useNotice';
import { usePatient } from '@/hooks/usePatient';
import { logPortalAudit, usePortalAccess } from '@/hooks/usePortalAccess';
import { saveDemoFile } from '@/lib/demoFiles';
import { signInformedConsent } from '@/lib/demoStore';
import { isClientDemoMode } from '@/lib/appMode';
import {
  buildConsentKpis,
  downloadConsentPdf,
  enrichPatientConsents,
  filterAndSortConsents,
  messagesWithConsentContext,
  visibleConsentsForPatient,
  type ConsentChip,
  type ConsentDisplayStatus,
  type PatientConsentSort,
  type PatientConsentView
} from '@/lib/patient/consentsData';
import { PatientConsentSignModal } from './PatientConsentSignModal';

const CHIPS: { id: ConsentChip; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'pendiente', label: 'Pendientes' },
  { id: 'firmado', label: 'Firmados' },
  { id: 'caducado', label: 'Caducados' },
  { id: 'pdf', label: 'Con PDF' },
  { id: '30d', label: 'Últimos 30 días' }
];

const PAGE_SIZE = 10;

function statusClass(s: ConsentDisplayStatus) {
  if (s === 'firmado') return 'pcon-status--signed';
  if (s === 'caducado') return 'pcon-status--expired';
  return 'pcon-status--pending';
}

function KpiStat({
  label,
  value,
  delay,
  numeric
}: {
  label: string;
  value: string | number;
  delay: number;
  numeric?: boolean;
}) {
  const n = numeric && typeof value === 'number' ? useCountUp(value, 650) : value;
  return (
    <article className="pcon-kpi" style={{ animationDelay: `${delay}ms` }}>
      <p className="pcon-kpi__label">{label}</p>
      <p className="pcon-kpi__value">{n}</p>
    </article>
  );
}

export function PatientConsents() {
  const { state, commit, refresh } = useDemoStore();
  const patient = usePatient();
  const { setNotice } = useNotice();
  const portalAccess = usePortalAccess();

  const [q, setQ] = useState('');
  const [chip, setChip] = useState<ConsentChip>('all');
  const [sort, setSort] = useState<PatientConsentSort>('recent');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [signing, setSigning] = useState<PatientConsentView | null>(null);
  const [signSuccess, setSignSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const base = useMemo(() => visibleConsentsForPatient(state, patient.id), [state, patient.id]);
  const views = useMemo(() => enrichPatientConsents(state, base), [state, base]);
  const kpis = useMemo(() => buildConsentKpis(state, patient.id, views), [state, patient.id, views]);
  const filtered = useMemo(() => filterAndSortConsents(views, { q, chip, sort }), [views, q, chip, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const selected = useMemo(
    () =>
      filtered.find((v) => v.consent.id === selectedId) ??
      views.find((v) => v.consent.id === selectedId) ??
      null,
    [filtered, views, selectedId]
  );

  useEffect(() => {
    if (portalAccess.active) {
      void logPortalAudit({
        eventType: 'other',
        pagePath: '/paciente/consentimientos',
        resourceLabel: 'Listado de consentimientos'
      });
    }
  }, [portalAccess.active]);

  useEffect(() => setPage(1), [q, chip, sort]);

  useEffect(() => {
    if (!selectedId && pageRows[0]) setSelectedId(pageRows[0].consent.id);
    if (selectedId && !filtered.some((v) => v.consent.id === selectedId) && pageRows[0]) {
      setSelectedId(pageRows[0].consent.id);
    }
  }, [filtered, pageRows, selectedId]);

  const openDetail = useCallback(
    (v: PatientConsentView) => {
      setSelectedId(v.consent.id);
      if (portalAccess.active) {
        void logPortalAudit({
          eventType: 'other',
          pagePath: '/paciente/consentimientos',
          resourceLabel: v.consent.title,
          resourceId: v.consent.id
        });
      }
    },
    [portalAccess.active]
  );

  function viewDetail(e: React.MouseEvent, v: PatientConsentView) {
    e.stopPropagation();
    openDetail(v);
  }

  function openSign(v: PatientConsentView, e?: React.MouseEvent) {
    e?.stopPropagation();
    if (!v.canSign) return;
    setSignSuccess(false);
    setSigning(v);
    openDetail(v);
  }

  async function handleSign(payload: { dataUrl: string; method: 'draw' | 'typed' }) {
    if (!signing) return;
    setSaving(true);
    try {
      if (!isClientDemoMode()) {
        await fetch('/api/records/consent', {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            clinicId: patient.preferredClinicId,
            consentId: signing.consent.id,
            signatureRef: payload.dataUrl,
            signatureMethod: payload.method
          })
        });
      }
      const sigRef = await saveDemoFile(
        await dataUrlToFile(payload.dataUrl, `firma-${signing.consent.id}.png`)
      );
      commit(
        signInformedConsent(state, signing.consent.id, payload.dataUrl, sigRef, `firma-${signing.consent.id}.png`, {
          signatureMethod: payload.method,
          signedCopyRef: signing.consent.fileRef ?? sigRef
        })
      );
      if (!isClientDemoMode()) await refresh();
      setSignSuccess(true);
      setNotice({ type: 'ok', message: 'Consentimiento firmado correctamente.' });
      if (portalAccess.active) {
        void logPortalAudit({
          eventType: 'other',
          pagePath: '/paciente/consentimientos',
          resourceLabel: `Firma: ${signing.consent.title}`,
          resourceId: signing.consent.id
        });
      }
    } catch {
      setNotice({ type: 'error', message: 'No se pudo firmar el consentimiento.' });
    } finally {
      setSaving(false);
    }
  }

  function closeSignModal() {
    if (saving) return;
    setSigning(null);
    setSignSuccess(false);
  }

  function downloadPdf(v: PatientConsentView, e?: React.MouseEvent) {
    e?.stopPropagation();
    setDownloadingId(v.consent.id);
    try {
      const ok = downloadConsentPdf(v);
      if (!ok) throw new Error('fail');
      setNotice({ type: 'ok', message: 'Documento descargado correctamente.' });
    } catch {
      setNotice({ type: 'error', message: 'No se pudo descargar el documento.' });
    } finally {
      setDownloadingId(null);
    }
  }

  const showEmpty = views.length === 0;
  const showNoResults = !showEmpty && filtered.length === 0;
  const rangeStart = filtered.length ? (page - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(page * PAGE_SIZE, filtered.length);

  return (
    <div className="pcon-page">
      <header className="pcon-header">
        <h2>Consentimientos</h2>
        <p>Revisa y firma consentimientos informados compartidos por tu clínica.</p>
        <div className="pcon-security">
          <div>
            <Shield className="inline h-4 w-4 text-teal-700 mr-1" aria-hidden />
            <strong className="text-[0.78rem] text-teal-900">Firma segura</strong>
            <p className="m-0 text-[0.72rem] text-slate-600">Solo tú puedes firmar los consentimientos vinculados a tu perfil.</p>
          </div>
          <span className="prt-private-badge">
            <Lock className="h-3 w-3" aria-hidden />
            Acceso privado
          </span>
        </div>
      </header>

      {!showEmpty ? (
        <div className="pcon-kpis">
          <KpiStat label="Pendientes de firma" value={kpis.pending} delay={0} numeric />
          <KpiStat label="Firmados" value={kpis.signed} delay={50} numeric />
          <KpiStat label="Caducados" value={kpis.expired} delay={100} numeric />
          <KpiStat label="Último consentimiento" value={kpis.lastConsent} delay={150} />
          <KpiStat label="Clínicas vinculadas" value={kpis.clinics} delay={200} numeric />
        </div>
      ) : null}

      {!showEmpty ? (
        <div className="pcon-toolbar">
          <label className="pcon-search">
            <Search className="h-4 w-4 text-slate-400 shrink-0" aria-hidden />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por título, clínica, tratamiento, fecha o estado…"
              aria-label="Buscar consentimientos"
            />
          </label>
          <div className="pcon-toolbar__row">
            <div className="pcon-chips" role="tablist">
              {CHIPS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="tab"
                  aria-selected={chip === c.id}
                  className={`pcon-chip${chip === c.id ? ' pcon-chip--active' : ''}`}
                  onClick={() => setChip(c.id)}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <div className="pcon-sort">
              <select value={sort} onChange={(e) => setSort(e.target.value as PatientConsentSort)} aria-label="Ordenar">
                <option value="recent">Ordenar por: fecha más reciente</option>
                <option value="oldest">Ordenar por: fecha más antigua</option>
                <option value="expires">Ordenar por: fecha límite</option>
              </select>
            </div>
          </div>
        </div>
      ) : null}

      {showEmpty ? (
        <section className="pcon-empty">
          <div className="pcon-empty__illus">
            <FileSignature className="h-9 w-9 text-teal-700" aria-hidden />
          </div>
          <h3>No tienes consentimientos pendientes</h3>
          <p>Cuando tu clínica necesite que revises o firmes un consentimiento informado, aparecerá aquí.</p>
          <div className="pcon-empty__actions">
<p className="panel-hint text-sm text-slate-500 m-0">Usa el menú lateral del portal para abrir otras secciones.</p>
          </div>
        </section>
      ) : (
        <div className="pcon-layout">
          <div className="pcon-list">
            <h3 className="pcon-list-title">Consentimientos disponibles</h3>
            {showNoResults ? (
              <p className="pcon-no-results">No hay consentimientos que coincidan con tu búsqueda o filtros.</p>
            ) : (
              pageRows.map((v, i) => (
                <article
                  key={v.consent.id}
                  className={`pcon-card${selectedId === v.consent.id ? ' pcon-card--active' : ''}`}
                  style={{ animationDelay: `${i * 45}ms` }}
                  onClick={() => openDetail(v)}
                  onKeyDown={(e) => e.key === 'Enter' && openDetail(v)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="pcon-card__head">
                    <h4>{v.consent.title}</h4>
                    <span className={`pcon-status ${statusClass(v.displayStatus)}`}>{v.statusLabel}</span>
                  </div>
                  <p className="pcon-card__meta">
                    {v.clinicName} · {v.consent.treatmentName}
                  </p>
                  <p className="pcon-card__date">Publicado: {v.publishedLabel}</p>
                  {v.displayStatus === 'firmado' ? (
                    <p className="pcon-card__date">Firmado: {v.signedLabel}</p>
                  ) : null}
                  <div className="pcon-card__actions">
                    {v.canSign ? (
                      <button type="button" className="pcon-btn pcon-btn--primary" onClick={(e) => openSign(v, e)}>
                        <PenLine className="h-3.5 w-3.5" aria-hidden />
                        Leer y firmar
                      </button>
                    ) : (
                      <button type="button" className="pcon-btn pcon-btn--primary" onClick={(e) => viewDetail(e, v)}>
                        <Eye className="h-3.5 w-3.5" aria-hidden />
                        Ver consentimiento
                      </button>
                    )}
                    {v.hasPdf ? (
                      <button
                        type="button"
                        className="pcon-btn pcon-btn--outline"
                        disabled={downloadingId === v.consent.id}
                        onClick={(e) => downloadPdf(v, e)}
                      >
                        <Download className="h-3.5 w-3.5" aria-hidden />
                        Descargar PDF
                      </button>
                    ) : null}
                    {v.canSign ? (
                      <span className="pcon-btn pcon-btn--ghost no-underline" onClick={(e) => e.stopPropagation()}
                      >
                        Enviar duda
                      </span>
                    ) : v.displayStatus === 'caducado' ? (
<p className="panel-hint text-sm text-slate-500 m-0">Usa el menú lateral del portal para abrir otras secciones.</p>
                    ) : null}
                  </div>
                </article>
              ))
            )}
            {filtered.length > 0 ? (
              <p className="pcon-pagination">
                Mostrando {rangeStart} a {rangeEnd} de {filtered.length} resultados
                {totalPages > 1 ? (
                  <span className="pcon-pagination__nav">
                    <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                      ‹
                    </button>
                    <span>
                      {page}/{totalPages}
                    </span>
                    <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                      ›
                    </button>
                  </span>
                ) : null}
              </p>
            ) : null}
          </div>

          {selected ? (
            <>
              <div className="pcon-detail__backdrop" onClick={() => setSelectedId(null)} aria-hidden />
              <aside className="pcon-detail">
                <div className="pcon-detail__top">
                  <h3>Detalle del consentimiento</h3>
                  <button
                    type="button"
                    className="pcon-btn pcon-btn--outline pcon-detail__close"
                    onClick={() => setSelectedId(null)}
                    aria-label="Cerrar"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="pcon-detail__subject">{selected.consent.title}</p>
                <div className="pcon-detail__grid">
                  <dl className="pcon-detail__fields">
                    <div>
                      <dt>Clínica</dt>
                      <dd>{selected.clinicName}</dd>
                    </div>
                    <div>
                      <dt>Tratamiento</dt>
                      <dd>{selected.consent.treatmentName}</dd>
                    </div>
                    <div>
                      <dt>Fecha de publicación</dt>
                      <dd>{selected.publishedLabel}</dd>
                    </div>
                    <div>
                      <dt>Fecha límite</dt>
                      <dd>{selected.expiresLabel}</dd>
                    </div>
                    <div>
                      <dt>Estado</dt>
                      <dd>
                        <span className={`pcon-status ${statusClass(selected.displayStatus)}`}>
                          {selected.statusLabel}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt>Firmado el</dt>
                      <dd>{selected.signedLabel}</dd>
                    </div>
                    <div>
                      <dt>PDF</dt>
                      <dd className={selected.hasPdf ? 'pcon-pdf-ok' : ''}>{selected.pdfLabel}</dd>
                    </div>
                  </dl>
                  {selected.previewUrl ? (
                    <div className="pcon-detail__preview">
                      {selected.previewUrl.endsWith('.pdf') || selected.consent.fileName?.endsWith('.pdf') ? (
                        <iframe title="Vista previa" src={selected.previewUrl} />
                      ) : (
                        <img src={selected.previewUrl} alt="" />
                      )}
                      <span className="pcon-detail__preview-hint">Vista previa del documento</span>
                    </div>
                  ) : null}
                </div>
                <div className="pcon-detail__summary">
                  <h4>Resumen</h4>
                  <p>{selected.summary}</p>
                </div>
                <div className="pcon-detail__actions">
                  {selected.canSign ? (
                    <button type="button" className="pcon-btn pcon-btn--primary w-full" onClick={() => openSign(selected)}>
                      <PenLine className="h-4 w-4" aria-hidden />
                      Leer y firmar
                    </button>
                  ) : (
                    <button type="button" className="pcon-btn pcon-btn--outline w-full" onClick={() => openDetail(selected)}>
                      Ver consentimiento
                    </button>
                  )}
                  {selected.hasPdf ? (
                    <button
                      type="button"
                      className="pcon-btn pcon-btn--outline w-full"
                      disabled={downloadingId === selected.consent.id}
                      onClick={() => downloadPdf(selected)}
                    >
                      <Download className="h-4 w-4" aria-hidden />
                      Descargar PDF
                    </button>
                  ) : null}
                  <span className="pcon-btn pcon-btn--outline w-full no-underline">
                    <MessageSquare className="h-4 w-4" aria-hidden />
                    Enviar mensaje a la clínica
                  </span>
                </div>
              </aside>
            </>
          ) : null}
        </div>
      )}

      <div className="pcon-privacy">
        <h4>Privacidad</h4>
        <p>Los consentimientos solo están disponibles para tu usuario y no pueden ser consultados por otros pacientes.</p>
        <div className="prt-privacy-badges">
          <span>
            <Shield className="h-3 w-3" aria-hidden />
            Datos privados
          </span>
          <span>
            <Lock className="h-3 w-3" aria-hidden />
            Portal seguro
          </span>
          <span>
            <Sparkles className="h-3 w-3" aria-hidden />
            Firma segura
          </span>
        </div>
      </div>

      <PatientConsentSignModal
        open={Boolean(signing)}
        view={signing}
        patient={patient}
        saving={saving}
        success={signSuccess}
        onClose={closeSignModal}
        onSign={(p) => void handleSign(p)}
        onDownloadCopy={() => {
          if (signing) downloadPdf(signing);
        }}
      />
    </div>
  );
}

async function dataUrlToFile(dataUrl: string, name: string): Promise<File> {
  const blob = await (await fetch(dataUrl)).blob();
  return new File([blob], name, { type: 'image/png' });
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  Image as ImageIcon,
  Lock,
  MessageSquare,
  MoreVertical,
  Search,
  Shield,
  Sparkles,
  X
} from 'lucide-react';
import { useCountUp } from '@/hooks/useCountUp';
import { resolveFocusId, usePatientUrlParams } from '@/hooks/usePatientUrlParams';
import { useDemoStore } from '@/hooks/useDemoStore';
import { useNotice } from '@/hooks/useNotice';
import { usePatient } from '@/hooks/usePatient';
import { logPortalAudit, usePortalAccess } from '@/hooks/usePortalAccess';
import {
  downloadDemoFileRef,
  isImageMime,
  openDemoFilePreview,
  resolveDemoFileUrl
} from '@/lib/demoFiles';
import { visibleDocumentsForPatient } from '@/lib/selectors';
import {
  buildDocumentKpis,
  enrichPatientDocuments,
  filterAndSortDocuments,
  markPatientDocumentRead,
  messagesWithDocumentContext,
  reportLink,
  type DocumentChip,
  type DocumentSort,
  type PatientDocumentView
} from '@/lib/patient/documentsData';

const CHIPS: { id: DocumentChip; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'new', label: 'Nuevos' },
  { id: 'consentimiento', label: 'Consentimientos' },
  { id: 'radiografia', label: 'Radiografías' },
  { id: 'recibo', label: 'Recibos' },
  { id: 'imagen', label: 'Imágenes' },
  { id: 'pdf', label: 'PDF' },
  { id: '30d', label: 'Últimos 30 días' }
];

const PAGE_SIZE = 10;

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
    <article className="pdoc-kpi" style={{ animationDelay: `${delay}ms` }}>
      <p className="pdoc-kpi__label">{label}</p>
      <p className="pdoc-kpi__value">{n}</p>
    </article>
  );
}

export function PatientDocuments() {
  const { state } = useDemoStore();
  const patient = usePatient();
  const { setNotice } = useNotice();
  const portalAccess = usePortalAccess();
  const [q, setQ] = useState('');
  const [chip, setChip] = useState<DocumentChip>('all');
  const [sort, setSort] = useState<DocumentSort>('recent');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [readVersion, setReadVersion] = useState(0);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const urlParams = usePatientUrlParams();
  const focusId = resolveFocusId(urlParams, ['documento', 'focus']);
  const urlFilter = useMemo(
    () => ({
      informe: urlParams.get('informe') ?? '',
      cita: urlParams.get('cita') ?? ''
    }),
    [urlParams]
  );

  const baseDocs = useMemo(() => {
    let d = visibleDocumentsForPatient(state, patient.id);
    if (urlFilter.cita) d = d.filter((x) => x.appointmentId === urlFilter.cita);
    if (urlFilter.informe) {
      const rep = state.clinicalReports.find((r) => r.id === urlFilter.informe);
      if (rep?.appointmentId) d = d.filter((x) => x.appointmentId === rep.appointmentId);
    }
    return d;
  }, [state, patient.id, urlFilter]);

  const views = useMemo(
    () => enrichPatientDocuments(state, patient.id, baseDocs, resolveDemoFileUrl),
    [state, patient.id, baseDocs, readVersion]
  );

  const kpis = useMemo(() => buildDocumentKpis(views), [views]);

  const filtered = useMemo(() => filterAndSortDocuments(views, { q, chip, sort }), [views, q, chip, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const selected = useMemo(
    () => filtered.find((v) => v.document.id === selectedId) ?? views.find((v) => v.document.id === selectedId) ?? null,
    [filtered, views, selectedId]
  );

  useEffect(() => {
    if (portalAccess.active) {
      void logPortalAudit({
        eventType: 'view_document',
        pagePath: '/paciente/documentos',
        resourceLabel: 'Listado de documentos'
      });
    }
  }, [portalAccess.active]);

  useEffect(() => {
    setPage(1);
  }, [q, chip, sort]);

  useEffect(() => {
    if (focusId) {
      const match = views.find((v) => v.document.id === focusId);
      if (match) {
        setSelectedId(match.document.id);
        return;
      }
    }
    if (!selectedId && pageRows[0]) setSelectedId(pageRows[0].document.id);
    if (selectedId && !filtered.some((v) => v.document.id === selectedId) && pageRows[0]) {
      setSelectedId(pageRows[0].document.id);
    }
  }, [filtered, pageRows, selectedId, focusId, views]);

  const openDetail = useCallback(
    (v: PatientDocumentView) => {
      setSelectedId(v.document.id);
      if (portalAccess.active) {
        void logPortalAudit({
          eventType: 'view_document',
          pagePath: '/paciente/documentos',
          resourceLabel: v.document.title,
          resourceId: v.document.id
        });
      }
    },
    [portalAccess.active]
  );

  function viewDocument(v: PatientDocumentView, e?: React.MouseEvent) {
    e?.stopPropagation();
    openDetail(v);
    if (!v.document.fileRef) {
      setNotice({ type: 'error', message: 'No se pudo abrir el documento.' });
      return;
    }
    openDemoFilePreview(v.document.fileRef);
  }

  async function downloadDoc(v: PatientDocumentView, e?: React.MouseEvent) {
    e?.stopPropagation();
    if (!v.document.fileRef) {
      setNotice({ type: 'error', message: 'No se pudo descargar el documento.' });
      return;
    }
    setDownloadingId(v.document.id);
    try {
      const ok = downloadDemoFileRef(v.document.fileRef, v.document.fileName ?? `${v.document.id}.pdf`);
      if (!ok) throw new Error('fail');
      if (portalAccess.active) {
        void logPortalAudit({
          eventType: 'view_document',
          pagePath: '/paciente/documentos',
          resourceLabel: `Descarga ${v.document.title}`,
          resourceId: v.document.id
        });
      }
      setNotice({ type: 'ok', message: 'Documento descargado correctamente.' });
    } catch {
      setNotice({ type: 'error', message: 'No se pudo descargar el documento.' });
    } finally {
      setDownloadingId(null);
      setMenuId(null);
    }
  }

  function markRead(v: PatientDocumentView, e?: React.MouseEvent) {
    e?.stopPropagation();
    markPatientDocumentRead(patient.id, v.document.id);
    setReadVersion((n) => n + 1);
    setMenuId(null);
    setNotice({ type: 'ok', message: 'Documento marcado como leído.' });
  }

  const showEmpty = views.length === 0;
  const showNoResults = !showEmpty && filtered.length === 0;

  return (
    <div className="pdoc-page">
      {urlFilter.informe || urlFilter.cita ? (
        <div className="banner-alert flex flex-wrap items-center justify-between gap-2 mb-3">
          <span>Documentos filtrados por informe o cita relacionada.</span>
          <a href="/paciente/informes" className="text-xs font-bold text-teal-800 underline">
            Volver a informes
          </a>
        </div>
      ) : null}

      <header className="pdoc-header">
        <h2>Mis documentos</h2>
        <p>Consulta y descarga consentimientos, radiografías, recibos y archivos compartidos por tu clínica.</p>
        <div className="pdoc-security">
          <div>
            <Shield className="inline h-4 w-4 text-teal-700 mr-1" aria-hidden />
            <strong className="text-[0.78rem] text-teal-900">Documentos protegidos</strong>
            <p className="m-0 text-[0.72rem] text-slate-600">Solo tú puedes acceder a los documentos vinculados a tu perfil.</p>
          </div>
          <span className="prt-private-badge">
            <Lock className="h-3 w-3" aria-hidden />
            Acceso privado
          </span>
        </div>
      </header>

      {!showEmpty ? (
        <div className="pdoc-kpis">
          <KpiStat label="Documentos disponibles" value={kpis.available} delay={0} numeric />
          <KpiStat label="Documentos nuevos" value={kpis.newCount} delay={50} numeric />
          <KpiStat label="Consentimientos" value={kpis.consentCount} delay={100} numeric />
          <KpiStat label="Radiografías" value={kpis.xrayCount} delay={150} numeric />
          <KpiStat label="Recibos" value={kpis.receiptCount} delay={200} numeric />
          <KpiStat label="Último documento" value={kpis.lastDate} delay={250} />
        </div>
      ) : null}

      {!showEmpty ? (
        <div className="pdoc-toolbar">
          <label className="pdoc-search">
            <Search className="h-4 w-4 text-slate-400 shrink-0" aria-hidden />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por título, tipo, clínica, fecha o descripción…"
              aria-label="Buscar documentos"
            />
          </label>
          <div className="pdoc-toolbar__row">
            <div className="pdoc-chips" role="tablist">
              {CHIPS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="tab"
                  aria-selected={chip === c.id}
                  className={`pdoc-chip${chip === c.id ? ' pdoc-chip--active' : ''}`}
                  onClick={() => setChip(c.id)}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <div className="pdoc-sort">
              <select value={sort} onChange={(e) => setSort(e.target.value as DocumentSort)} aria-label="Ordenar">
                <option value="recent">Ordenar por: fecha más reciente</option>
                <option value="oldest">Ordenar por: fecha más antigua</option>
                <option value="title">Ordenar por: título A-Z</option>
              </select>
            </div>
          </div>
        </div>
      ) : null}

      {showEmpty ? (
        <section className="pdoc-empty">
          <div className="prt-empty__icon mx-auto" style={{ width: '4rem', height: '4rem', borderRadius: '1rem', background: 'rgba(20,184,166,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText className="h-8 w-8 text-teal-700" aria-hidden />
          </div>
          <h3 className="text-lg font-extrabold text-[var(--corp-navy)] mt-3 m-0">Aún no tienes documentos disponibles</h3>
          <p className="text-sm text-slate-500 mt-2 mb-4 max-w-md mx-auto">
            Cuando tu clínica comparta consentimientos, radiografías, recibos u otros archivos contigo, aparecerán aquí.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <a href="/paciente/reservar" className="pdoc-btn pdoc-btn--primary no-underline">
              Reservar cita
            </a>
            <a href="/paciente/mensajes" className="pdoc-btn pdoc-btn--outline no-underline">
              Contactar clínica
            </a>
          </div>
        </section>
      ) : showNoResults ? (
        <section className="pdoc-empty">
          <p className="font-bold m-0">No tienes documentos disponibles</p>
          <p className="text-sm text-slate-500 mt-1">Prueba con otros filtros o búsqueda.</p>
        </section>
      ) : (
        <div className="pdoc-layout">
          <div>
            <h3 className="pdoc-list-title">Documentos compartidos</h3>
            {pageRows.map((v, i) => (
              <article
                key={v.document.id}
                className={`pdoc-card${selectedId === v.document.id ? ' pdoc-card--active' : ''}`}
                style={{ animationDelay: `${i * 40}ms` }}
                onClick={() => openDetail(v)}
                onKeyDown={(e) => e.key === 'Enter' && openDetail(v)}
                role="button"
                tabIndex={0}
              >
                <div className="pdoc-card__head">
                  <h4>{v.document.title}</h4>
                  <span className={`pdoc-status ${v.isNew ? 'pdoc-status--new' : 'pdoc-status--read'}`}>
                    {v.isNew ? 'Nuevo' : 'Leído'}
                  </span>
                </div>
                <p className="pdoc-card__meta">
                  {v.clinicName}
                  <br />
                  Publicado: {v.publishedLabel} · Tipo: {v.typeLabel}
                  <br />
                  Formato: {v.formatLabel} · Tamaño: {v.sizeLabel}
                </p>
                <div className="pdoc-card__actions" onClick={(e) => e.stopPropagation()}>
                  <button type="button" className="pdoc-btn pdoc-btn--primary" onClick={(e) => viewDocument(v, e)}>
                    <Eye className="h-3.5 w-3.5" aria-hidden />
                    Ver documento
                  </button>
                  {v.hasFile ? (
                    <button
                      type="button"
                      className="pdoc-btn pdoc-btn--outline"
                      disabled={downloadingId === v.document.id}
                      onClick={(e) => void downloadDoc(v, e)}
                    >
                      <Download className="h-3.5 w-3.5" aria-hidden />
                      {downloadingId === v.document.id ? 'Descargando…' : 'Descargar'}
                    </button>
                  ) : null}
                  {v.isNew ? (
                    <button type="button" className="pdoc-btn pdoc-btn--outline" onClick={(e) => markRead(v, e)}>
                      <Check className="h-3.5 w-3.5" aria-hidden />
                      Marcar como leído
                    </button>
                  ) : null}
                  <div className="pdoc-menu-wrap">
                    <button
                      type="button"
                      className="pdoc-btn pdoc-btn--outline"
                      aria-label="Más acciones"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuId(menuId === v.document.id ? null : v.document.id);
                      }}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {menuId === v.document.id ? (
                      <div className="pdoc-menu">
                        {v.hasFile ? (
                          <button type="button" onClick={(e) => void downloadDoc(v, e)}>
                            Descargar
                          </button>
                        ) : null}
                        {!v.read ? (
                          <button type="button" onClick={(e) => markRead(v, e)}>
                            Marcar leído
                          </button>
                        ) : null}
                        <button type="button" onClick={(e) => viewDocument(v, e)}>
                          Ver documento
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}

            <div className="pdoc-foot">
              <span>
                Mostrando {filtered.length ? (page - 1) * PAGE_SIZE + 1 : 0} a {Math.min(page * PAGE_SIZE, filtered.length)} de{' '}
                {filtered.length} documentos
              </span>
              <div className="flex items-center gap-2">
                <button type="button" className="pdoc-btn pdoc-btn--outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  ‹
                </button>
                <span>
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  className="pdoc-btn pdoc-btn--outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  ›
                </button>
                <span>{PAGE_SIZE} por página</span>
              </div>
            </div>

            <div className="pdoc-privacy">
              <h4 className="text-sm font-extrabold m-0">Privacidad</h4>
              <p className="text-xs text-slate-500 mt-1 mb-2">
                Los documentos solo están disponibles para tu usuario y no pueden ser consultados por otros pacientes.
              </p>
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
                  Acceso personal
                </span>
              </div>
            </div>
          </div>

          {selected ? (
            <>
              <div className="pdoc-detail__backdrop" onClick={() => setSelectedId(null)} aria-hidden />
              <aside className="pdoc-detail">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <h3>Detalle del documento</h3>
                  <button type="button" className="pdoc-btn pdoc-btn--outline lg:hidden" onClick={() => setSelectedId(null)} aria-label="Cerrar">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="font-extrabold text-sm text-[var(--corp-navy)] m-0 mb-3 flex items-center gap-2 flex-wrap">
                  {selected.formatLabel === 'Imagen' ? (
                    <ImageIcon className="h-4 w-4 text-teal-600" aria-hidden />
                  ) : (
                    <FileText className="h-4 w-4 text-teal-600" aria-hidden />
                  )}
                  {selected.document.title}
                  <span className={`pdoc-status ${selected.isNew ? 'pdoc-status--new' : 'pdoc-status--read'}`}>
                    {selected.isNew ? 'Nuevo' : 'Leído'}
                  </span>
                </p>
                <dl>
                  <div>
                    <dt>Clínica</dt>
                    <dd>{selected.clinicName}</dd>
                  </div>
                  <div>
                    <dt>Tipo</dt>
                    <dd>{selected.typeLabel}</dd>
                  </div>
                  <div>
                    <dt>Fecha de publicación</dt>
                    <dd>{selected.publishedLabel}</dd>
                  </div>
                  <div>
                    <dt>Formato</dt>
                    <dd>{selected.formatLabel}</dd>
                  </div>
                  <div>
                    <dt>Tamaño</dt>
                    <dd>{selected.sizeLabel}</dd>
                  </div>
                  <div>
                    <dt>Estado</dt>
                    <dd>{selected.isNew ? 'Nuevo' : 'Leído'}</dd>
                  </div>
                  <div>
                    <dt>Visibilidad</dt>
                    <dd>{selected.visibilityLabel}</dd>
                  </div>
                </dl>
                <p className="text-xs text-slate-600 mt-2 mb-0">{selected.description}</p>
                <div className="pdoc-preview">
                  {selected.previewUrl && isImageMime(selected.document.mimeType, selected.document.fileName ?? selected.document.fileRef) ? (
                    <img src={selected.previewUrl} alt={`Vista previa ${selected.document.title}`} />
                  ) : selected.hasFile ? (
                    <div className="pdoc-preview--pdf">
                      <FileText className="h-8 w-8 mx-auto text-teal-600 mb-1" aria-hidden />
                      Vista previa PDF · pulsa Ver documento para abrir
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500">Sin archivo adjunto</span>
                  )}
                </div>
                <div className="pdoc-related">
                  <p>
                    <strong>Informe relacionado:</strong>{' '}
                    {selected.relatedReport ? (
                      <a href={reportLink(selected.relatedReport.id)}>{selected.relatedReport.title}</a>
                    ) : (
                      '—'
                    )}
                  </p>
                  <p>
                    <strong>Factura relacionada:</strong>{' '}
                    {selected.relatedInvoice ? (
                      <a href="/paciente/facturas">{selected.relatedInvoice.label}</a>
                    ) : (
                      '—'
                    )}
                  </p>
                </div>
                <div className="pdoc-detail__actions">
                  {selected.hasFile ? (
                    <button
                      type="button"
                      className="pdoc-btn pdoc-btn--primary w-full"
                      disabled={downloadingId === selected.document.id}
                      onClick={() => void downloadDoc(selected)}
                    >
                      <Download className="h-4 w-4" aria-hidden />
                      {downloadingId === selected.document.id ? 'Descargando…' : 'Descargar'}
                    </button>
                  ) : null}
                  {selected.relatedReport ? (
                    <a href={reportLink(selected.relatedReport.id)} className="pdoc-btn pdoc-btn--outline w-full no-underline">
                      Ver informe relacionado
                    </a>
                  ) : null}
                  <a
                    href={messagesWithDocumentContext(selected.document.title)}
                    className="pdoc-btn pdoc-btn--outline w-full no-underline"
                  >
                    <MessageSquare className="h-4 w-4" aria-hidden />
                    Enviar mensaje a la clínica
                  </a>
                  {selected.isNew ? (
                    <button type="button" className="pdoc-btn pdoc-btn--outline w-full" onClick={() => markRead(selected)}>
                      <CheckCircle2 className="h-4 w-4" aria-hidden />
                      Marcar como leído
                    </button>
                  ) : null}
                </div>
              </aside>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}

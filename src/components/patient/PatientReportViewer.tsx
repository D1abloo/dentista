import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Download,
  FileText,
  MessageSquare,
  Stethoscope,
  User
} from 'lucide-react';
import { useDemoStore } from '@/hooks/useDemoStore';
import {
  blocksForTab,
  buildPatientReportBlocks,
  defaultReportTab,
  type PatientReportTab
} from '@/lib/patient/reportDisplay';
import type { PatientReportView } from '@/lib/patient/reportsData';
import {
  messagesWithReportContext,
  relatedDocumentsQuery,
  viewPatientReportPdfHtml
} from '@/lib/patient/reportsData';

type PatientReportViewerProps = {
  view: PatientReportView;
  tenantId: string;
  downloading: boolean;
  onClose: () => void;
  onDownload: () => void;
  onMarkRead: () => void;
};

const CONTENT_TABS: { id: PatientReportTab; label: string }[] = [
  { id: 'clinical', label: 'Informe clínico' },
  { id: 'diagnosis', label: 'Diagnóstico' },
  { id: 'care', label: 'Indicaciones' }
];

function formatBlockBody(text: string) {
  const lines = text.split('\n');
  return lines.map((line, i) => (
    <span key={i}>
      {line}
      {i < lines.length - 1 ? <br /> : null}
    </span>
  ));
}

export function PatientReportViewer({
  view,
  tenantId: _tenantId,
  downloading,
  onClose,
  onDownload,
  onMarkRead
}: PatientReportViewerProps) {
  const blocks = useMemo(() => buildPatientReportBlocks(view.report), [view.report]);
  const [tab, setTab] = useState<PatientReportTab | 'pdf'>(() => defaultReportTab(blocks));
  const [mounted, setMounted] = useState(false);
  const tabBlocks = useMemo(() => (tab === 'pdf' ? [] : blocksForTab(blocks, tab)), [blocks, tab]);
  const { state } = useDemoStore();
  const pdfHtml = useMemo(() => viewPatientReportPdfHtml(state, view), [state, view]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    document.documentElement.classList.add('prt-viewer-open');
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      document.documentElement.classList.remove('prt-viewer-open');
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    setTab(defaultReportTab(blocks));
  }, [view.report.id, blocks]);

  if (!mounted) return null;

  const dialog = (
    <div className="prt-viewer" role="dialog" aria-modal="true" aria-labelledby="prt-viewer-title">
      <button type="button" className="prt-viewer__backdrop" onClick={onClose} aria-label="Cerrar informe" />
      <div className="prt-viewer__sheet">
        <header className="prt-viewer__header">
          <button type="button" className="prt-viewer__back" onClick={onClose}>
            <ArrowLeft className="h-5 w-5" aria-hidden />
            <span>Volver</span>
          </button>
          <div className="prt-viewer__brand">
            <img src={view.clinicLogoUrl} alt="" className="prt-viewer__logo" width={40} height={40} />
            <div className="prt-viewer__brand-text">
              <p className="prt-viewer__clinic">{view.clinicName}</p>
              <p className="prt-viewer__date">{view.publishedLabel}</p>
            </div>
          </div>
        </header>

        <div className="prt-viewer__title-row">
          <h2 id="prt-viewer-title" className="prt-viewer__title">
            {view.report.title}
          </h2>
          <span className={`prt-status ${view.isNew ? 'prt-status--new' : 'prt-status--read'}`}>
            {view.isNew ? 'Nuevo' : 'Leído'}
          </span>
        </div>

        <div className="prt-viewer__meta">
          <span>
            <Stethoscope className="h-3.5 w-3.5" aria-hidden />
            {view.professional}
          </span>
          <span>
            <Calendar className="h-3.5 w-3.5" aria-hidden />
            {view.publishedLabel}
          </span>
          <span>
            <User className="h-3.5 w-3.5" aria-hidden />
            {view.typeLabel}
          </span>
        </div>

        <div className="prt-viewer__tabs" role="tablist" aria-label="Secciones del informe">
          {CONTENT_TABS.map((t) => {
            const count = blocksForTab(blocks, t.id).length;
            if (!count) return null;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                className={`prt-viewer__tab${tab === t.id ? ' prt-viewer__tab--active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            );
          })}
          {view.hasPdf ? (
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'pdf'}
              className={`prt-viewer__tab${tab === 'pdf' ? ' prt-viewer__tab--active' : ''}`}
              onClick={() => setTab('pdf')}
            >
              PDF
            </button>
          ) : null}
        </div>

        <div className="prt-viewer__body" role="tabpanel">
          {tab === 'pdf' ? (
            <div className="prt-viewer__pdf-wrap">
              <iframe
                title={`PDF: ${view.report.title}`}
                className="prt-viewer__pdf-frame"
                srcDoc={pdfHtml}
                sandbox="allow-same-origin"
              />
            </div>
          ) : tabBlocks.length ? (
            tabBlocks.map((block) => (
              <article key={block.id} className="prt-viewer__block">
                <h3 className="prt-viewer__block-title">{block.title}</h3>
                <div className="prt-viewer__block-body">{formatBlockBody(block.body)}</div>
              </article>
            ))
          ) : (
            <p className="prt-viewer__empty-tab">No hay contenido en esta sección.</p>
          )}
          {tab !== 'pdf' && view.professionalFooter ? (
            <footer className="prt-viewer__pro-footer">
              <p className="prt-viewer__pro-footer-label">Profesional responsable</p>
              <pre className="prt-viewer__pro-footer-text">{view.professionalFooter}</pre>
            </footer>
          ) : null}
        </div>

        <footer className="prt-viewer__footer">
          {view.hasPdf ? (
            <button
              type="button"
              className="prt-btn prt-btn--primary prt-viewer__footer-btn"
              disabled={downloading}
              onClick={onDownload}
            >
              <Download className="h-4 w-4" aria-hidden />
              {downloading ? 'Descargando…' : 'Descargar PDF'}
            </button>
          ) : null}
          <a
            href={messagesWithReportContext(view.report.title)}
            className="prt-btn prt-btn--outline prt-viewer__footer-btn no-underline"
          >
            <MessageSquare className="h-4 w-4" aria-hidden />
            Consultar clínica
          </a>
          <a
            href={relatedDocumentsQuery(view.report.id, view.report.appointmentId)}
            className="prt-btn prt-btn--outline prt-viewer__footer-btn no-underline"
          >
            <FileText className="h-4 w-4" aria-hidden />
            Documentos
          </a>
          {view.isNew ? (
            <button type="button" className="prt-btn prt-btn--outline prt-viewer__footer-btn" onClick={onMarkRead}>
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              Marcar leído
            </button>
          ) : null}
        </footer>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
}

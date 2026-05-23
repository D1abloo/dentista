import { useEffect, useMemo, useState } from 'react';
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
import { settingsFor } from '@/lib/demoStore';
import {
  blocksForTab,
  buildPatientReportBlocks,
  defaultReportTab,
  type PatientReportTab
} from '@/lib/patient/reportDisplay';
import type { PatientReportView } from '@/lib/patient/reportsData';
import {
  messagesWithReportContext,
  relatedDocumentsQuery
} from '@/lib/patient/reportsData';

type PatientReportViewerProps = {
  view: PatientReportView;
  tenantId: string;
  downloading: boolean;
  onClose: () => void;
  onDownload: () => void;
  onMarkRead: () => void;
};

const TABS: { id: PatientReportTab; label: string }[] = [
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
  tenantId,
  downloading,
  onClose,
  onDownload,
  onMarkRead
}: PatientReportViewerProps) {
  const blocks = useMemo(() => buildPatientReportBlocks(view.report), [view.report]);
  const [tab, setTab] = useState<PatientReportTab>(() => defaultReportTab(blocks));
  const tabBlocks = useMemo(() => blocksForTab(blocks, tab), [blocks, tab]);
  const { state } = useDemoStore();
  const logoUrl = settingsFor(state, tenantId).logoUrl ?? '/brand/clinic-shield.svg';

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
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

  return (
    <div className="prt-viewer" role="dialog" aria-modal="true" aria-labelledby="prt-viewer-title">
      <button type="button" className="prt-viewer__backdrop" onClick={onClose} aria-label="Cerrar informe" />
      <div className="prt-viewer__sheet">
        <header className="prt-viewer__header">
          <button type="button" className="prt-viewer__back" onClick={onClose}>
            <ArrowLeft className="h-5 w-5" aria-hidden />
            <span>Volver</span>
          </button>
          <div className="prt-viewer__brand">
            <img src={logoUrl} alt="" className="prt-viewer__logo" width={40} height={40} />
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
          {TABS.map((t) => {
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
        </div>

        <div className="prt-viewer__body" role="tabpanel">
          {tabBlocks.length ? (
            tabBlocks.map((block) => (
              <article key={block.id} className="prt-viewer__block">
                <h3 className="prt-viewer__block-title">{block.title}</h3>
                <div className="prt-viewer__block-body">{formatBlockBody(block.body)}</div>
              </article>
            ))
          ) : (
            <p className="prt-viewer__empty-tab">No hay contenido en esta sección.</p>
          )}
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
}

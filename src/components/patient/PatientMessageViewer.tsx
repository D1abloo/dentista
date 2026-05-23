import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Archive,
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  Paperclip,
  Receipt,
  Send
} from 'lucide-react';
import { useDemoStore } from '@/hooks/useDemoStore';
import { settingsFor } from '@/lib/demoStore';
import { REPLY_TEMPLATES, appointmentLink, type PatientMessageView } from '@/lib/patient/messagesData';

type MessageViewerTab = 'message' | 'reply';

function typeClass(t: PatientMessageView['displayType']) {
  if (t === 'confirmacion') return 'pmsg-type--confirm';
  if (t === 'recordatorio') return 'pmsg-type--reminder';
  if (t === 'factura') return 'pmsg-type--invoice';
  if (t === 'documento') return 'pmsg-type--doc';
  return 'pmsg-type--clinic';
}

function formatBody(text: string) {
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim());
  if (paragraphs.length <= 1) {
    const lines = text.split('\n');
    return (
      <div className="pmsg-viewer__text">
        {lines.map((line, i) => (
          <span key={i}>
            {line}
            {i < lines.length - 1 ? <br /> : null}
          </span>
        ))}
      </div>
    );
  }
  return (
    <div className="pmsg-viewer__text">
      {paragraphs.map((p, i) => (
        <p key={i} className="pmsg-viewer__paragraph">
          {p.split('\n').map((line, j, arr) => (
            <span key={j}>
              {line}
              {j < arr.length - 1 ? <br /> : null}
            </span>
          ))}
        </p>
      ))}
    </div>
  );
}

export type PatientMessageViewerProps = {
  view: PatientMessageView;
  downloading: boolean;
  reply: string;
  attachName: string | null;
  sending: boolean;
  sendOk: boolean;
  onClose: () => void;
  onDownload: () => void;
  onMarkRead: () => void;
  onArchive: () => void;
  onReplyChange: (value: string) => void;
  onSendReply: () => void;
  onAttachClick: () => void;
  onTemplate: (text: string) => void;
  initialTab?: MessageViewerTab;
};

export function PatientMessageViewer({
  view,
  downloading,
  reply,
  attachName,
  sending,
  sendOk,
  onClose,
  onDownload,
  onMarkRead,
  onArchive,
  onReplyChange,
  onSendReply,
  onAttachClick,
  onTemplate,
  initialTab = 'message'
}: PatientMessageViewerProps) {
  const [tab, setTab] = useState<MessageViewerTab>(initialTab);
  const [mounted, setMounted] = useState(false);
  const replyRef = useRef<HTMLTextAreaElement>(null);
  const { state } = useDemoStore();
  const logoUrl = settingsFor(state, view.message.tenantId).logoUrl ?? '/brand/clinic-shield.svg';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    document.documentElement.classList.add('pmsg-viewer-open');
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      document.documentElement.classList.remove('pmsg-viewer-open');
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
    setTab(initialTab);
  }, [view.message.id, initialTab]);

  useEffect(() => {
    if (tab === 'reply') replyRef.current?.focus();
  }, [tab]);

  if (!mounted) return null;

  const hasQuickLinks =
    !view.message.read ||
    view.canDownloadPdf ||
    Boolean(view.message.appointmentId) ||
    Boolean(view.message.invoiceId) ||
    Boolean(view.relatedHref && view.message.documentId);

  const dialog = (
    <div className="pmsg-viewer" role="dialog" aria-modal="true" aria-labelledby="pmsg-viewer-title">
      <button type="button" className="pmsg-viewer__backdrop" onClick={onClose} aria-label="Cerrar mensaje" />
      <div className="pmsg-viewer__sheet">
        <header className="pmsg-viewer__header">
          <button type="button" className="pmsg-viewer__back" onClick={onClose}>
            <ArrowLeft className="h-5 w-5" aria-hidden />
            <span>Volver</span>
          </button>
          <div className="pmsg-viewer__brand">
            <img src={logoUrl} alt="" className="pmsg-viewer__logo" width={40} height={40} />
            <div className="pmsg-viewer__brand-text">
              <p className="pmsg-viewer__clinic">{view.clinicName}</p>
              <p className="pmsg-viewer__date">{view.dateLabel}</p>
            </div>
          </div>
        </header>

        <div className="pmsg-viewer__title-row">
          <h2 id="pmsg-viewer-title" className="pmsg-viewer__subject">
            {view.message.subject}
          </h2>
          <div className="pmsg-viewer__badges">
            <span className={`pmsg-type ${typeClass(view.displayType)}`}>{view.typeLabel}</span>
            <span className={`pmsg-read ${view.message.read ? 'pmsg-read--read' : 'pmsg-read--new'}`}>
              {view.statusReadLabel}
            </span>
          </div>
        </div>

        <div className="pmsg-viewer__tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'message'}
            className={`pmsg-viewer__tab${tab === 'message' ? ' pmsg-viewer__tab--active' : ''}`}
            onClick={() => setTab('message')}
          >
            Mensaje
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'reply'}
            className={`pmsg-viewer__tab${tab === 'reply' ? ' pmsg-viewer__tab--active' : ''}`}
            onClick={() => setTab('reply')}
          >
            Responder
          </button>
        </div>

        <div className="pmsg-viewer__body" role="tabpanel">
          {tab === 'message' ? (
            <article className="pmsg-viewer__message-card">
              {formatBody(view.message.body)}
              {view.relatedLabel !== '—' && view.relatedHref ? (
                <a href={view.relatedHref} className="pmsg-viewer__related no-underline">
                  <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
                  <span>{view.relatedLabel}</span>
                </a>
              ) : view.relatedLabel !== '—' ? (
                <p className="pmsg-viewer__related-static">{view.relatedLabel}</p>
              ) : null}
              {view.message.attachmentName ? (
                <p className="pmsg-viewer__attach-hint">
                  <Paperclip className="h-3.5 w-3.5 inline" aria-hidden /> Adjunto: {view.message.attachmentName}
                </p>
              ) : null}
              {hasQuickLinks ? (
                <div className="pmsg-viewer__quick-links">
                  {!view.message.read ? (
                    <button type="button" className="pmsg-viewer__quick-link" onClick={onMarkRead}>
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                      Marcar leído
                    </button>
                  ) : null}
                  {view.canDownloadPdf ? (
                    <button
                      type="button"
                      className="pmsg-viewer__quick-link"
                      disabled={downloading}
                      onClick={onDownload}
                    >
                      <Download className="h-3.5 w-3.5" aria-hidden />
                      {downloading ? 'Descargando…' : 'Descargar'}
                    </button>
                  ) : null}
                  {view.message.appointmentId ? (
                    <a href={appointmentLink(view.message.appointmentId)} className="pmsg-viewer__quick-link no-underline">
                      <Calendar className="h-3.5 w-3.5" aria-hidden />
                      Ver cita
                    </a>
                  ) : null}
                  {view.message.invoiceId ? (
                    <a
                      href={`/paciente/facturas?factura=${encodeURIComponent(view.message.invoiceId)}`}
                      className="pmsg-viewer__quick-link no-underline"
                    >
                      <Receipt className="h-3.5 w-3.5" aria-hidden />
                      Ver factura
                    </a>
                  ) : null}
                  {view.relatedHref && view.message.documentId ? (
                    <a href={view.relatedHref} className="pmsg-viewer__quick-link no-underline">
                      <FileText className="h-3.5 w-3.5" aria-hidden />
                      Documento
                    </a>
                  ) : null}
                  <button type="button" className="pmsg-viewer__quick-link pmsg-viewer__quick-link--muted" onClick={onArchive}>
                    <Archive className="h-3.5 w-3.5" aria-hidden />
                    Archivar
                  </button>
                </div>
              ) : (
                <div className="pmsg-viewer__quick-links">
                  <button type="button" className="pmsg-viewer__quick-link pmsg-viewer__quick-link--muted" onClick={onArchive}>
                    <Archive className="h-3.5 w-3.5" aria-hidden />
                    Archivar
                  </button>
                </div>
              )}
            </article>
          ) : (
            <div className="pmsg-viewer__reply-panel">
              <p className="pmsg-viewer__reply-hint">Tu respuesta se enviará de forma segura a la clínica.</p>
              <textarea
                ref={replyRef}
                className="pmsg-viewer__reply-input"
                value={reply}
                onChange={(e) => onReplyChange(e.target.value)}
                placeholder="Escribe tu mensaje…"
                rows={8}
              />
              <div className="pmsg-viewer__templates">
                {REPLY_TEMPLATES.map((t) => (
                  <button key={t} type="button" className="pmsg-template" onClick={() => onTemplate(t)}>
                    {t}
                  </button>
                ))}
              </div>
              {attachName ? <p className="pmsg-attach-name">{attachName}</p> : null}
            </div>
          )}
        </div>

        <footer className={`pmsg-viewer__footer${tab === 'message' ? ' pmsg-viewer__footer--message' : ''}`}>
          {tab === 'message' ? (
            <button type="button" className="pmsg-btn pmsg-btn--primary pmsg-viewer__footer-btn" onClick={() => setTab('reply')}>
              <Send className="h-4 w-4" aria-hidden />
              Responder a la clínica
            </button>
          ) : (
            <>
              <button type="button" className="pmsg-btn pmsg-btn--outline pmsg-viewer__footer-btn" onClick={onAttachClick}>
                <Paperclip className="h-4 w-4" aria-hidden />
                Adjuntar
              </button>
              <button
                type="button"
                className={`pmsg-btn pmsg-btn--primary pmsg-viewer__footer-btn${sendOk ? ' pmsg-btn--success' : ''}`}
                disabled={sending}
                onClick={onSendReply}
              >
                {sendOk ? <Check className="h-4 w-4" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
                {sending ? 'Enviando…' : 'Enviar'}
              </button>
              <button type="button" className="pmsg-btn pmsg-btn--outline pmsg-viewer__footer-btn" onClick={() => setTab('message')}>
                Ver mensaje
              </button>
            </>
          )}
        </footer>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
}

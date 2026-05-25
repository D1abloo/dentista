import { Copy, Eye, Link2, Shield, X } from 'lucide-react';
import type { MonitoringEventRow } from '@/lib/platform/monitoringTypes';

type Props = {
  event: MonitoringEventRow;
  onClose: () => void;
  busy: boolean;
  onReview: () => void;
  onEscalate: () => void;
  onViewResource: () => void;
  onViewRelated: () => void;
  toast: (msg: string, ok?: boolean) => void;
};

export function MonitoringDetail({
  event,
  onClose,
  busy,
  onReview,
  onEscalate,
  onViewResource,
  onViewRelated,
  toast
}: Props) {
  const metaJson = JSON.stringify(event.metadata, null, 2);

  function copy(text: string, label: string) {
    void navigator.clipboard.writeText(text);
    toast(`${label} copiado`, true);
  }

  return (
    <>
      <div className="mon-detail__backdrop" onClick={onClose} aria-hidden />
      <aside className="mon-detail" role="dialog" aria-labelledby="mon-detail-title">
        <div className="mon-detail__head">
          <div>
            <h2 id="mon-detail-title" className="mon-detail__title">
              Detalle del evento
            </h2>
            <span className={`mon-detail__event-badge mon-detail__event-badge--${event.result}`}>{event.event_label}</span>
            <p className="mon-detail__id">ID: {event.event_code}</p>
          </div>
          <button type="button" className="cln-icon-btn" onClick={onClose} aria-label="Cerrar">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mon-detail__body">
          <section className="mon-detail__section">
            <div className="mon-detail__field">
              <span className="mon-detail__label">ID evento</span>
              <span className="mon-detail__value mon-detail__value--mono">{event.event_code}</span>
            </div>
            <div className="mon-detail__field">
              <span className="mon-detail__label">Usuario</span>
              <span className="mon-detail__value mon-detail__value--row">
                {event.user_email}
                <button type="button" className="mon-copy" onClick={() => copy(event.user_email, 'Email')} aria-label="Copiar email">
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </span>
            </div>
            <div className="mon-detail__field">
              <span className="mon-detail__label">Rol</span>
              <span className="mon-detail__value">{event.user_role}</span>
            </div>
            <div className="mon-detail__field">
              <span className="mon-detail__label">Clínica</span>
              <span className="mon-detail__value">{event.clinic_name}</span>
            </div>
            <div className="mon-detail__field">
              <span className="mon-detail__label">Evento</span>
              <span className="mon-detail__value mon-detail__value--strong">{event.event_label}</span>
            </div>
            <div className="mon-detail__field">
              <span className="mon-detail__label">Tipo de evento</span>
              <span className="mon-detail__value mon-detail__value--mono">{event.event_type}</span>
            </div>
            <div className="mon-detail__field">
              <span className="mon-detail__label">Ruta</span>
              <span className="mon-detail__value mon-detail__value--mono">{event.route}</span>
            </div>
            <div className="mon-detail__field">
              <span className="mon-detail__label">IP</span>
              <span className="mon-detail__value mon-detail__value--row">
                <span className="mon-detail__value--mono">{event.ip_address}</span>
                <button type="button" className="mon-copy" onClick={() => copy(event.ip_address, 'IP')} aria-label="Copiar IP">
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </span>
            </div>
            <div className="mon-detail__field">
              <span className="mon-detail__label">Navegador</span>
              <span className="mon-detail__value">
                {event.browser_label}
                <br />
                <span className="text-slate-500 text-xs">{event.os_label}</span>
              </span>
            </div>
            <div className="mon-detail__grid2">
              <div className="mon-detail__field">
                <span className="mon-detail__label">Resultado</span>
                <span className={`mon-pill mon-pill--${event.result}`}>{event.result_label}</span>
              </div>
              <div className="mon-detail__field">
                <span className="mon-detail__label">Severidad</span>
                <span className={`mon-pill mon-pill--sev-${event.severity}`}>{event.severity_label}</span>
              </div>
            </div>
            <div className="mon-detail__field">
              <span className="mon-detail__label">Fecha/Hora</span>
              <span className="mon-detail__value">{event.date_time_label} (CEST)</span>
            </div>
          </section>

          <section className="mon-detail__section">
            <h3 className="mon-detail__section-title">Metadata</h3>
            <pre className="mon-detail__json">{metaJson}</pre>
          </section>

          <div className="mon-detail__actions">
            <button type="button" className="plt-btn plt-btn--secondary plt-btn--sm" disabled={busy || event.reviewed} onClick={onReview}>
              Marcar revisado
            </button>
            <button type="button" className="plt-btn plt-btn--danger plt-btn--sm" disabled={busy} onClick={onEscalate}>
              <Shield className="h-4 w-4" aria-hidden />
              Escalar incidencia
            </button>
            <button type="button" className="plt-btn plt-btn--secondary plt-btn--sm" onClick={onViewRelated}>
              <Link2 className="h-4 w-4" aria-hidden />
              Ver eventos relacionados
            </button>
            <button type="button" className="plt-btn plt-btn--ghost plt-btn--sm" onClick={onViewResource}>
              <Eye className="h-4 w-4" aria-hidden />
              Ver recurso
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

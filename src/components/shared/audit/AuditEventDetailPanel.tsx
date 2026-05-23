import type { ReactNode } from 'react';
import { FileText, X } from 'lucide-react';
import type { AuditEventRow } from '@/lib/platform/auditDemo';

function Field({ label, value, mono }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div className="aud-detail__field">
      <span className="aud-detail__label">{label}</span>
      <span className={`aud-detail__value${mono ? ' aud-detail__value--mono' : ''}`}>{value}</span>
    </div>
  );
}

function Section({ title, children, columns = 1 }: { title: string; children: ReactNode; columns?: 1 | 2 }) {
  const slug = title.replace(/\s/g, '-').toLowerCase();
  return (
    <section className="aud-detail__section" aria-labelledby={`aud-sec-${slug}`}>
      <h3 className="aud-detail__section-title" id={`aud-sec-${slug}`}>
        {title}
      </h3>
      <div className={`aud-detail__grid${columns === 2 ? ' aud-detail__grid--2' : ''}`}>{children}</div>
    </section>
  );
}

function riskClass(risk: AuditEventRow['risk']) {
  if (risk === 'high') return 'aud-detail__pill aud-detail__pill--high';
  if (risk === 'medium') return 'aud-detail__pill aud-detail__pill--medium';
  return 'aud-detail__pill aud-detail__pill--low';
}

function resultClass(result: AuditEventRow['result']) {
  if (result === 'blocked' || result === 'error') return 'aud-detail__pill aud-detail__pill--blocked';
  return 'aud-detail__pill aud-detail__pill--ok';
}

export type AuditDetailActions = {
  onExport?: () => void;
  onOpenResource?: () => void;
  onViewUser?: () => void;
  onViewTenant?: () => void;
  onMarkReviewed?: () => void;
  onEscalate?: () => void;
  busy?: boolean;
};

type Props = {
  event: AuditEventRow;
  onClose: () => void;
  title?: string;
  actions?: AuditDetailActions;
  showPlatformLinks?: boolean;
};

export function AuditEventDetailPanel({
  event,
  onClose,
  title = 'Detalle de auditoría',
  actions,
  showPlatformLinks = false
}: Props) {
  const busy = actions?.busy ?? false;

  return (
    <>
      <div className="cln-detail__backdrop" onClick={onClose} aria-hidden />
      <aside className="cln-detail aud-detail" role="dialog" aria-labelledby="aud-detail-title">
        <div className="cln-detail__head aud-detail__head">
          <div className="aud-detail__head-text">
            <h2 id="aud-detail-title" className="aud-detail__title">
              {title}
            </h2>
            <p className="aud-detail__subtitle">{event.action}</p>
          </div>
          <button type="button" className="cln-icon-btn" onClick={onClose} aria-label="Cerrar detalle">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="cln-detail__body aud-detail__body">
          <div className="aud-detail__badges">
            <span className={resultClass(event.result)}>{event.result_label}</span>
            <span className={riskClass(event.risk)}>Riesgo {event.risk_label}</span>
            <span className="aud-detail__pill aud-detail__pill--neutral">{event.module}</span>
            {event.reviewed ? <span className="aud-detail__pill aud-detail__pill--ok">Revisado</span> : null}
          </div>

          <Section title="Identificación">
            <Field label="ID evento" value={event.event_code} mono />
            <Field label="Fecha y hora" value={event.date_label} />
            {event.related_event ? <Field label="Tipo de evento" value={event.related_event} mono /> : null}
          </Section>

          <Section title="Usuario" columns={2}>
            <Field label="Actor" value={event.actor_name} />
            <Field label="Rol" value={event.actor_role} />
          </Section>

          <Section title="Ámbito" columns={2}>
            <Field label="Clínica" value={event.clinic_name} />
            <Field label="Tenant" value={event.tenant_masked} mono />
          </Section>

          <Section title="Acción">
            <Field label="Módulo" value={event.module} />
            <Field label="Descripción" value={event.action} />
            <Field label="Recurso" value={event.resource_masked} mono />
            <Field label="Motivo" value={event.reason} />
          </Section>

          <Section title="Conexión" columns={2}>
            <Field label="Dirección IP" value={event.ip} mono />
            <Field label="Dispositivo" value={event.device} />
            <Field label="Ruta" value={event.route} mono />
          </Section>

          <div className="aud-detail__note">
            <p className="aud-detail__note-label">
              <FileText className="inline h-3.5 w-3.5 align-text-bottom" aria-hidden /> Registro técnico
            </p>
            <p className="aud-detail__note-text">{event.technical_log}</p>
          </div>

          {event.before_state || event.after_state ? (
            <section className="aud-detail__section">
              <h3 className="aud-detail__section-title">Cambios registrados</h3>
              <div className="aud-before-after">
                <div className="aud-before-after__grid">
                  <div>
                    <span className="text-xs text-slate-500">Antes</span>
                    <p className="m-0 mt-1 text-sm">{event.before_state ?? '—'}</p>
                  </div>
                  <span className="aud-before-after__arrow" aria-hidden>
                    →
                  </span>
                  <div>
                    <span className="text-xs text-slate-500">Después</span>
                    <p className="m-0 mt-1 text-sm">{event.after_state ?? '—'}</p>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {actions ? (
            <section className="aud-detail__section aud-detail__section--actions">
              <h3 className="aud-detail__section-title">Acciones</h3>
              <div className="aud-detail__actions">
                {actions.onExport ? (
                  <button type="button" className="plt-btn plt-btn--secondary plt-btn--sm" disabled={busy} onClick={actions.onExport}>
                    Exportar evento
                  </button>
                ) : null}
                {actions.onOpenResource ? (
                  <button type="button" className="plt-btn plt-btn--secondary plt-btn--sm" disabled={busy} onClick={actions.onOpenResource}>
                    Ver recurso
                  </button>
                ) : null}
                {showPlatformLinks && actions.onViewUser ? (
                  <button type="button" className="plt-btn plt-btn--secondary plt-btn--sm" onClick={actions.onViewUser}>
                    Ver usuario
                  </button>
                ) : null}
                {showPlatformLinks && actions.onViewTenant ? (
                  <button type="button" className="plt-btn plt-btn--secondary plt-btn--sm" onClick={actions.onViewTenant}>
                    Ver tenant
                  </button>
                ) : null}
                {actions.onMarkReviewed ? (
                  <button
                    type="button"
                    className="plt-btn plt-btn--primary plt-btn--sm"
                    disabled={busy || event.reviewed}
                    onClick={actions.onMarkReviewed}
                  >
                    Marcar como revisado
                  </button>
                ) : null}
                {actions.onEscalate ? (
                  <button
                    type="button"
                    className="plt-btn plt-btn--ghost plt-btn--sm text-red-600"
                    disabled={busy}
                    onClick={actions.onEscalate}
                  >
                    Escalar incidencia
                  </button>
                ) : null}
              </div>
            </section>
          ) : null}

          <p className="aud-detail__footer">Los registros de auditoría no pueden modificarse ni eliminarse desde esta pantalla.</p>
        </div>
      </aside>
    </>
  );
}

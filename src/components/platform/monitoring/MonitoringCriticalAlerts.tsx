import { AlertTriangle, ChevronRight } from 'lucide-react';
import type { CriticalAlert } from '@/lib/platform/monitoringTypes';

type Props = {
  alerts: CriticalAlert[];
  onOpenAlert: (alert: CriticalAlert) => void;
};

function severityLabel(tone: CriticalAlert['tone']) {
  return tone === 'red' ? 'Crítico' : 'Alto';
}

export function MonitoringCriticalAlerts({ alerts, onOpenAlert }: Props) {
  const count = alerts.length;

  return (
    <section
      id="mon-critical-alerts"
      className="mon-critical-alerts"
      aria-labelledby="mon-critical-alerts-title"
    >
      <header className="mon-critical-alerts__head">
        <h2 id="mon-critical-alerts-title">Alertas críticas</h2>
        <span className="mon-critical-alerts__badge" aria-label={`${count} alertas críticas`}>
          {count}
        </span>
      </header>

      {count === 0 ? (
        <p className="mon-critical-alerts__empty" role="status">
          No hay alertas críticas activas en este momento.
        </p>
      ) : (
        <ul className="mon-critical-alerts__list">
          {alerts.map((alert, index) => (
            <li
              key={alert.id}
              className="mon-critical-alerts__item"
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <button
                type="button"
                className="mon-critical-alerts__row"
                onClick={() => onOpenAlert(alert)}
                aria-label={`${alert.title}, ${alert.time_label}. Severidad ${severityLabel(alert.tone)}. Ver detalle`}
              >
                <span
                  className={`mon-critical-alerts__icon-wrap mon-critical-alerts__icon-wrap--${alert.tone}`}
                  aria-hidden
                >
                  <AlertTriangle className="h-5 w-5" />
                </span>
                <span className="mon-critical-alerts__copy">
                  <span className="mon-critical-alerts__title-row">
                    <strong>{alert.title}</strong>
                    <span className={`mon-critical-alerts__sev mon-critical-alerts__sev--${alert.tone}`}>
                      {severityLabel(alert.tone)}
                    </span>
                  </span>
                  <small>{alert.time_label}</small>
                </span>
                <ChevronRight className="mon-critical-alerts__chev h-5 w-5 shrink-0" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

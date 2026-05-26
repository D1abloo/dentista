import { Activity, Link2 } from 'lucide-react'
import {
  landingDashActivity,
  landingDashFeatureLines,
  landingDashInsightKpis
} from './landingDashboardData'

type Props = {
  compact?: boolean
}

export function LandingDashboardDemoInsights({ compact = false }: Props) {
  return (
    <div
      className={`pro-dash__insights${compact ? ' pro-dash__insights--compact' : ''}`}
      aria-label="Resumen informativo del panel de clínica"
    >
      <div className="pro-dash__insights-head">
        <h3 className="pro-dash__insights-title">Resumen del panel</h3>
        <p className="pro-dash__insights-lead">
          Datos de ejemplo del entorno demo: la clínica ve métricas, agenda y facturación en un solo lugar.
        </p>
      </div>

      <div className="pro-dash__insight-kpis" aria-label="Indicadores principales">
        {landingDashInsightKpis.map((kpi) => (
          <div
            key={kpi.label}
            className={`pro-dash__insight-kpi${kpi.tone !== 'default' ? ` pro-dash__insight-kpi--${kpi.tone}` : ''}`}
          >
            <span>{kpi.label}</span>
            <strong>{kpi.value}</strong>
            <em>{kpi.hint}</em>
          </div>
        ))}
      </div>

      <div className="pro-dash__insights-grid">
        <ul className="pro-dash__insight-features">
          {landingDashFeatureLines.map((item) => (
            <li key={item.title}>
              <Link2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <div>
                <strong>{item.title}</strong>
                <span>{item.text}</span>
              </div>
            </li>
          ))}
        </ul>

        <div className="pro-dash__insight-activity">
          <p className="pro-dash__insight-activity-label">
            <Activity className="h-3.5 w-3.5" aria-hidden />
            Actividad reciente
          </p>
          <ul>
            {landingDashActivity.map((row) => (
              <li key={row.time}>
                <span>{row.time}</span>
                {row.text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

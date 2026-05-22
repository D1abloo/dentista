import type { CSSProperties } from 'react';
import {
  Calendar,
  CreditCard,
  LayoutDashboard,
  LineChart,
  Users
} from 'lucide-react';

/** Vista previa estática del panel — sin controles interactivos. */
export function LandingDashboardPreview() {
  return (
    <div className="pro-dash-frame">
      <div
        className="pro-dash"
        role="img"
        aria-label="Vista previa del panel Dentista+ con resumen general, KPIs y agenda"
      >
        <aside className="pro-dash__sidebar" aria-hidden>
          <div className="pro-dash__logo">
            Dentista<span>+</span>
          </div>
          <ul>
            <li className="pro-dash__nav--active">
              <LayoutDashboard className="h-4 w-4" />
              Inicio
            </li>
            <li>
              <Calendar className="h-4 w-4" />
              Agenda
            </li>
            <li>
              <Users className="h-4 w-4" />
              Pacientes
            </li>
            <li>
              <CreditCard className="h-4 w-4" />
              Facturación
            </li>
            <li>
              <LineChart className="h-4 w-4" />
              Informes
            </li>
          </ul>
        </aside>
        <div className="pro-dash__main" aria-hidden>
          <p className="pro-dash__title">Resumen general</p>
          <div className="pro-dash__kpis">
            <div className="pro-dash__kpi">
              <span>Citas hoy</span>
              <strong>28</strong>
              <em className="pro-dash__delta pro-dash__delta--up">+12%</em>
            </div>
            <div className="pro-dash__kpi pro-dash__kpi--coral">
              <span>Ingresos del mes</span>
              <strong>28.450 €</strong>
              <em className="pro-dash__delta pro-dash__delta--up">+8%</em>
            </div>
            <div className="pro-dash__kpi">
              <span>Facturas pendientes</span>
              <strong>12</strong>
              <em className="pro-dash__sub">1.850 €</em>
            </div>
            <div className="pro-dash__kpi pro-dash__kpi--teal pro-dash__kpi--donut">
              <span>Ocupación</span>
              <div className="pro-dash__donut-wrap">
                <div className="pro-dash__donut" style={{ '--p': '86%' } as CSSProperties} />
                <strong>86%</strong>
              </div>
            </div>
          </div>
          <div className="pro-dash__widgets">
            <div className="pro-dash__widget pro-dash__widget--chart-wide">
              <h4>Ingresos (últimos 30 días)</h4>
              <div className="pro-dash__chart-line" aria-hidden>
                <svg viewBox="0 0 200 60" preserveAspectRatio="none">
                  <polyline
                    fill="none"
                    stroke="url(#proLine)"
                    strokeWidth="2.5"
                    points="0,45 30,38 60,42 90,28 120,32 150,18 180,22 200,12"
                  />
                  <defs>
                    <linearGradient id="proLine" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#006d77" />
                      <stop offset="100%" stopColor="#2dd4bf" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
            <div className="pro-dash__widget">
              <h4>Agenda de hoy</h4>
              <ul>
                <li>
                  <span>09:00</span> Revisión — Dra. Martínez
                </li>
                <li>
                  <span>10:30</span> Endodoncia — Dr. López
                </li>
                <li>
                  <span>12:00</span> Ortodoncia — Dr. Ruiz
                </li>
              </ul>
            </div>
            <div className="pro-dash__widget">
              <h4>Próximas citas</h4>
              <ul>
                <li>Ana García — 15:00</li>
                <li>Carlos Pérez — 16:30</li>
                <li>María López — 17:15</li>
              </ul>
            </div>
          </div>
          <div className="pro-dash__actions" aria-hidden>
            <span>Nuevo paciente</span>
            <span>Nueva cita</span>
            <span>Emitir factura</span>
          </div>
        </div>
      </div>
    </div>
  );
}

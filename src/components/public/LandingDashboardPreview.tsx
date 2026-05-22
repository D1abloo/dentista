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
    <div
      className="pro-dash"
      role="img"
      aria-label="Vista previa del panel Dentista+ con agenda, pacientes, facturación e indicadores"
    >
      <aside className="pro-dash__sidebar" aria-hidden>
        <div className="pro-dash__logo">Dentista+</div>
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
        <div className="pro-dash__kpis">
          <div className="pro-dash__kpi">
            <span>Citas hoy</span>
            <strong>28</strong>
          </div>
          <div className="pro-dash__kpi pro-dash__kpi--coral">
            <span>Ingresos del mes</span>
            <strong>28.450 €</strong>
          </div>
          <div className="pro-dash__kpi">
            <span>Facturas pendientes</span>
            <strong>12</strong>
          </div>
          <div className="pro-dash__kpi pro-dash__kpi--teal">
            <span>Ocupación</span>
            <strong>86%</strong>
          </div>
        </div>
        <div className="pro-dash__widgets">
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
          <div className="pro-dash__widget pro-dash__widget--chart">
            <h4>Ingresos (30 días)</h4>
            <div className="pro-dash__chart-bars">
              <span style={{ height: '45%' }} />
              <span style={{ height: '62%' }} />
              <span style={{ height: '55%' }} />
              <span style={{ height: '78%' }} />
              <span style={{ height: '70%' }} />
              <span style={{ height: '88%' }} />
              <span style={{ height: '82%' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

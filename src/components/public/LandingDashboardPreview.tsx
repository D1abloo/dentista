import type { CSSProperties } from 'react';
import { Bell, Search } from 'lucide-react';
import {
  landingDashActions,
  landingDashNav,
  landingDashQuickModules
} from './landingDashboardData';

/**
 * Vista previa del panel administrativo real.
 * La barra lateral y los accesos rápidos enlazan a rutas /admin existentes.
 */
export function LandingDashboardPreview() {
  return (
    <div className="pro-dash-frame">
      <div
        className="pro-dash"
        aria-label="Vista previa del panel administrativo Dentista+ con agenda, pacientes, facturación e informes"
      >
        <aside className="pro-dash__sidebar">
          <div className="pro-dash__logo">
            Dentista<span>+</span>
          </div>
          <p className="pro-dash__sidebar-label">Panel clínica</p>
          <nav className="pro-dash__nav" aria-label="Módulos del panel">
            <ul>
              {landingDashNav.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className={`pro-dash__nav-link${item.active ? ' pro-dash__nav-link--active' : ''}`}
                    tabIndex={-1}
                  >
                    <span className="pro-dash__nav-icon">
                      <item.icon strokeWidth={2} aria-hidden />
                    </span>
                    <span className="pro-dash__nav-text">{item.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <div className="pro-dash__main">
          <div className="pro-dash__topbar" aria-hidden>
            <div className="pro-dash__search">
              <Search className="h-3.5 w-3.5" strokeWidth={2.5} />
              <span>Buscar paciente, cita o factura…</span>
            </div>
            <span className="pro-dash__topbar-pill">Clínica Centro</span>
            <button type="button" className="pro-dash__notify" tabIndex={-1} aria-hidden>
              <Bell className="h-3.5 w-3.5" strokeWidth={2.5} />
            </button>
            <span className="pro-dash__avatar">MG</span>
          </div>

          <h2 className="pro-dash__title">Resumen general</h2>

          <div className="pro-dash__kpis" aria-hidden>
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
            <div className="pro-dash__kpi pro-dash__kpi--donut">
              <span>Ocupación</span>
              <div className="pro-dash__donut-wrap">
                <div className="pro-dash__donut" style={{ '--p': '86%' } as CSSProperties} />
                <strong>86%</strong>
              </div>
            </div>
          </div>

          <div className="pro-dash__modules" aria-label="Accesos a módulos">
            {landingDashQuickModules.map((m) => (
              <a key={m.href} href={m.href} className="pro-dash__module" tabIndex={-1}>
                <m.icon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                {m.label}
              </a>
            ))}
          </div>

          <div className="pro-dash__widgets" aria-hidden>
            <div className="pro-dash__widget pro-dash__widget--chart-wide">
              <h4>Ingresos (últimos 30 días)</h4>
              <div className="pro-dash__chart-line">
                <svg viewBox="0 0 240 72" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="proLineFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#006d77" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#006d77" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="proLineStroke" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#004d4d" />
                      <stop offset="100%" stopColor="#2dd4bf" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0,52 L30,44 L60,48 L90,32 L120,36 L150,22 L180,26 L210,14 L240,18 L240,72 L0,72 Z"
                    fill="url(#proLineFill)"
                  />
                  <polyline
                    fill="none"
                    stroke="url(#proLineStroke)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points="0,52 30,44 60,48 90,32 120,36 150,22 180,26 210,14 240,18"
                  />
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

          <div className="pro-dash__actions">
            {landingDashActions.map((a) => (
              <a key={a.href} href={a.href} className="pro-dash__action" tabIndex={-1}>
                {a.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

import { Bell, ChevronDown, Search } from 'lucide-react'
import {
  landingDashActions,
  landingDashNav,
  landingDashQuickModules
} from './landingDashboardData'
import { LandingDashboardDemoInsights } from './LandingDashboardDemoInsights'
import { LandingDashboardMockBody } from './LandingDashboardMockBody'
import {
  brandImageAlts,
  brandImages,
  clinicDashboardFallback,
  heroAgendaImage
} from '@/lib/brand/assets'
import { BRAND_NAME, BRAND_PANEL_CLINIC } from '@/lib/brand/identity'
import { useState } from 'react'

/**
 * Vista previa del panel administrativo: barra lateral + imagen de agenda clínica.
 */
export function LandingDashboardPreview() {
  const [captureSrc, setCaptureSrc] = useState<string>(heroAgendaImage)
  const [useFallback, setUseFallback] = useState(false)

  const handleCaptureError = () => {
    if (captureSrc === heroAgendaImage) {
      setCaptureSrc(clinicDashboardFallback)
      return
    }
    if (captureSrc === clinicDashboardFallback) {
      setCaptureSrc(brandImages.doctor)
      return
    }
    setUseFallback(true)
  }

  return (
    <div className="pro-dash-frame">
      <div
        className="pro-dash"
        aria-label={`Vista previa del panel administrativo ${BRAND_NAME} con agenda, pacientes, facturación e informes`}
      >
        <aside className="pro-dash__sidebar">
          <div className="pro-dash__logo">{BRAND_NAME}</div>
          <p className="pro-dash__sidebar-label">{BRAND_PANEL_CLINIC}</p>
          <nav className="pro-dash__nav" aria-label="Módulos del panel">
            <ul>
              {landingDashNav.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className={`pro-dash__nav-link${item.active ? ' pro-dash__nav-link--active' : ''}`}
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
          <p className="pro-dash__scroll-hint">
            <ChevronDown className="h-3 w-3" aria-hidden />
            Desplaza para ver más
          </p>
        </aside>

        <div className="pro-dash__main">
          <div className="pro-dash__topbar">
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

          {!useFallback ? (
            <figure className="pro-dash__capture-wrap pro-dash__capture-wrap--agenda">
              <figcaption className="pro-dash__capture-label">Agenda clínica · vista real</figcaption>
              <img
                src={captureSrc}
                alt={brandImageAlts.agenda}
                className="pro-dash__capture pro-dash__capture--agenda"
                width={920}
                height={520}
                loading="eager"
                decoding="async"
                onError={handleCaptureError}
              />
              <a href="/admin/agenda" className="pro-dash__capture-link">
                Ver agenda clínica
              </a>
            </figure>
          ) : (
            <LandingDashboardMockBody />
          )}

          {!useFallback ? <LandingDashboardDemoInsights compact /> : null}

          <div className="pro-dash__modules pro-dash__modules--compact" aria-label="Accesos a módulos">
            {landingDashQuickModules.map((m) => (
              <a key={m.href} href={m.href} className="pro-dash__module">
                <m.icon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                {m.label}
              </a>
            ))}
          </div>

          <div className="pro-dash__actions">
            {landingDashActions.map((a) => (
              <a key={a.href} href={a.href} className="pro-dash__action">
                {a.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

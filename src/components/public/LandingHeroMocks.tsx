import { Calendar, FileText, Heart, LayoutDashboard, Receipt, Shield } from 'lucide-react';
import { LandingDashboardPreview } from './LandingDashboardPreview';

/** Mockup portal paciente (móvil). */
function PatientPhoneMock() {
  return (
    <div className="ps-mock-phone" aria-hidden>
      <div className="ps-mock-phone__shell">
        <header className="ps-mock-phone__head">
          <span className="ps-mock-phone__avatar">EV</span>
          <div>
            <small>Portal paciente</small>
            <strong>Hola, Elena</strong>
          </div>
        </header>
        <div className="ps-mock-phone__cards">
          <div className="ps-mock-phone__card ps-mock-phone__card--accent">
            <Calendar className="h-3.5 w-3.5" aria-hidden />
            <span>Próxima cita</span>
            <strong>Mar 18 · 10:30</strong>
          </div>
          <div className="ps-mock-phone__card">
            <FileText className="h-3.5 w-3.5" aria-hidden />
            <span>Informe listo</span>
          </div>
          <div className="ps-mock-phone__card">
            <Receipt className="h-3.5 w-3.5" aria-hidden />
            <span>Factura pendiente</span>
          </div>
        </div>
        <nav className="ps-mock-phone__nav">
          <span className="ps-mock-phone__nav-item ps-mock-phone__nav-item--active">
            <Heart className="h-3 w-3" aria-hidden />
            Inicio
          </span>
          <span className="ps-mock-phone__nav-item">Citas</span>
          <span className="ps-mock-phone__nav-item">Docs</span>
        </nav>
      </div>
    </div>
  );
}

/** Mockup plataforma / analytics (tablet). */
function PlatformTabletMock() {
  return (
    <div className="ps-mock-platform" aria-hidden>
      <div className="ps-mock-platform__shell">
        <header className="ps-mock-platform__head">
          <Shield className="h-4 w-4" aria-hidden />
          <span>Plataforma Dentista+</span>
        </header>
        <div className="ps-mock-platform__kpis">
          <div>
            <small>Clínicas activas</small>
            <strong>24</strong>
          </div>
          <div>
            <small>Citas hoy</small>
            <strong>186</strong>
          </div>
          <div>
            <small>Ingresos</small>
            <strong>€42k</strong>
          </div>
        </div>
        <div className="ps-mock-platform__chart">
          <div className="ps-mock-platform__bar" style={{ height: '45%' }} />
          <div className="ps-mock-platform__bar" style={{ height: '72%' }} />
          <div className="ps-mock-platform__bar" style={{ height: '58%' }} />
          <div className="ps-mock-platform__bar" style={{ height: '88%' }} />
          <div className="ps-mock-platform__bar" style={{ height: '64%' }} />
        </div>
        <p className="ps-mock-platform__foot">
          <LayoutDashboard className="h-3 w-3" aria-hidden />
          Monitorización multi-sede
        </p>
      </div>
    </div>
  );
}

export function LandingHeroMocks() {
  return (
    <div
      className="ps-hero-mocks"
      aria-label="Vistas del panel clínica, portal paciente y plataforma Dentista+"
    >
      <div className="ps-hero-mocks__laptop ps-hero-mocks__anim ps-hero-mocks__anim--3">
        <LandingDashboardPreview />
      </div>
      <div className="ps-hero-mocks__phone ps-hero-mocks__anim ps-hero-mocks__anim--4">
        <PatientPhoneMock />
      </div>
      <div className="ps-hero-mocks__tablet ps-hero-mocks__anim ps-hero-mocks__anim--5">
        <PlatformTabletMock />
      </div>
    </div>
  );
}

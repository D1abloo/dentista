import { Calendar, Menu, X } from 'lucide-react';
import { DentistaWebpLockup } from '@/components/brand/DentistaWebpLogo';
import { EnterPortalDropdown } from './EnterPortalDropdown';

/** Bloques de referencia responsive (header cerrado, menú abierto, dropdown). */
export function LandingMobileShowcase() {

  return (
    <section className="ps-mobile-showcase" aria-labelledby="ps-mobile-showcase-title">
      <div className="ps-shell ps-shell--wide">
        <header className="ps-mobile-showcase__head">
          <h2 id="ps-mobile-showcase-title">Experiencia móvil del sitio público</h2>
          <p>Navegación compacta, menú lateral y accesos de inicio de sesión en pantallas pequeñas.</p>
        </header>
        <div className="ps-mobile-showcase__grid">
          <article className="ps-mobile-showcase__card">
            <h3>Header móvil cerrado</h3>
            <div className="ps-mobile-frame" aria-label="Vista previa: header móvil cerrado">
              <div className="ps-mobile-frame__bar">
                <DentistaWebpLockup placement="header" />
                <div className="ps-mobile-frame__actions">
                  <span className="ps-btn ps-btn--primary ps-btn--sm">Entrar</span>
                  <span className="ps-mobile-frame__burger" aria-hidden>
                    <Menu className="h-4 w-4" />
                  </span>
                </div>
              </div>
              <div className="ps-mobile-frame__hero-mini">
                <p className="ps-mobile-frame__h1">
                  La plataforma dental para digitalizar{' '}
                  <span>citas, pacientes y facturación</span>
                </p>
                <p className="ps-mobile-frame__sub">
                  Agenda, portal paciente, informes y facturación en una sola plataforma.
                </p>
                <span className="ps-btn ps-btn--primary ps-btn--sm ps-mobile-frame__cta">
                  Solicitar demo para clínica
                </span>
              </div>
            </div>
          </article>

          <article className="ps-mobile-showcase__card">
            <h3>Menú móvil abierto</h3>
            <div className="ps-mobile-frame ps-mobile-frame--tall" aria-label="Vista previa: menú móvil abierto">
              <div className="ps-mobile-frame__bar">
                <DentistaWebpLockup placement="header" />
                <span className="ps-mobile-frame__icon-btn" aria-hidden>
                  <X className="h-4 w-4" />
                </span>
              </div>
              <nav className="ps-mobile-frame__menu">
                {['Inicio', 'Funciones', 'Portal paciente', 'Panel clínica', 'Plataforma', 'Planes', 'Ayuda', 'Contacto'].map(
                  (l) => (
                    <span key={l}>{l}</span>
                  )
                )}
              </nav>
              <button type="button" className="ps-btn ps-btn--demo-outline ps-btn--sm ps-mobile-frame__demo">
                <Calendar className="h-3 w-3" aria-hidden />
                Solicitar demo
              </button>
              <div className="ps-mobile-frame__portals">
                <span>Portal paciente</span>
                <span>Panel clínica</span>
                <span>Plataforma</span>
              </div>
            </div>
          </article>

          <article className="ps-mobile-showcase__card">
            <h3>Dropdown Entrar móvil</h3>
            <div className="ps-mobile-frame ps-mobile-frame--dropdown" aria-label="Vista previa: dropdown Entrar en móvil">
              <div className="ps-mobile-frame__bar">
                <DentistaWebpLockup placement="header" />
                <div className="ps-mobile-frame__actions">
                  <EnterPortalDropdown variant="mobile" />
                  <span className="ps-mobile-frame__burger" aria-hidden>
                    <Menu className="h-4 w-4" />
                  </span>
                </div>
              </div>
              <ul className="ps-mobile-frame__dd-list">
                <li>
                  <strong>Portal paciente</strong>
                  <small>Accede a tus citas, informes y facturas.</small>
                </li>
                <li>
                  <strong>Panel clínica</strong>
                  <small>Gestiona agenda, pacientes y facturación.</small>
                </li>
                <li>
                  <strong>Plataforma</strong>
                  <small>Acceso para administradores.</small>
                </li>
              </ul>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

import { ChevronRight, Home, LayoutDashboard, UserRound, X } from 'lucide-react';

const PORTALS = [
  {
    href: '/login/paciente',
    label: 'Portal paciente',
    desc: 'Citas, informes clínicos y pagos',
    icon: UserRound,
    accent: 'patient'
  },
  {
    href: '/platform/login',
    label: 'Plataforma',
    desc: 'Super Admin · gestión SaaS',
    icon: LayoutDashboard,
    accent: 'platform'
  },
  {
    href: '/',
    label: 'Sitio público',
    desc: 'Volver al inicio de Dentista+',
    icon: Home,
    accent: 'public'
  }
] as const;

export function PortalPickerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div
      className="cln-login-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cln-login-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="cln-login-modal__panel">
        <header className="cln-login-modal__head">
          <div>
            <h2 id="cln-login-modal-title">Elegir portal</h2>
            <p>Selecciona el espacio al que quieres acceder.</p>
          </div>
          <button type="button" className="cln-login-modal__close" onClick={onClose} aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </header>
        <ul className="cln-login-modal__list">
          {PORTALS.map(({ href, label, desc, icon: Icon, accent }) => (
            <li key={href}>
              <a href={href} className={`cln-login-modal__item cln-login-modal__item--${accent}`} onClick={onClose}>
                <span className="cln-login-modal__icon" aria-hidden>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="cln-login-modal__text">
                  <strong>{label}</strong>
                  <small>{desc}</small>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

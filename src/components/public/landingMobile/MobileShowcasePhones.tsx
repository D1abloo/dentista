import {
  Building2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  CreditCard,
  Home,
  Layers,
  Mail,
  Menu,
  Shield,
  UserRound,
  X
} from 'lucide-react';

const LOGO_SRC = '/images/logo.webp';
const CLINIC_IMG = '/img/citas.webp';

function MobileBrandBar({ close = false }: { close?: boolean }) {
  return (
    <div className="ps-phone-ui__bar" aria-hidden>
      <div className="ps-phone-ui__brand">
        <img src={LOGO_SRC} alt="" className="ps-phone-ui__logo" width={28} height={28} decoding="async" />
        <div>
          <span className="ps-phone-ui__name">Dentista+</span>
          <span className="ps-phone-ui__tag">TU CLÍNICA DIGITAL</span>
        </div>
      </div>
      {close ? (
        <span className="ps-phone-ui__icon-btn">
          <X className="h-3.5 w-3.5" strokeWidth={2.5} />
        </span>
      ) : (
        <div className="ps-phone-ui__bar-actions">
          <span className="ps-phone-ui__btn-entrar">Entrar</span>
          <span className="ps-phone-ui__icon-btn">
            <Menu className="h-3.5 w-3.5" strokeWidth={2.5} />
          </span>
        </div>
      )}
    </div>
  );
}

/** Card 1: header cerrado + hero mini. */
export function PhoneMockCompactNav() {
  return (
    <>
      <MobileBrandBar />
      <div className="ps-phone-ui__scroll" aria-hidden>
        <p className="ps-phone-ui__hero-title">
          La plataforma dental para digitalizar citas,{' '}
          <span className="ps-phone-ui__hl">pacientes y facturación</span>
        </p>
        <p className="ps-phone-ui__hero-sub">
          Agenda, portal paciente, informes y facturación en una sola plataforma.
        </p>
        <span className="ps-phone-ui__cta-primary">Solicitar demo para clínica</span>
        <div className="ps-phone-ui__clinic-img">
          <img src={CLINIC_IMG} alt="" loading="lazy" decoding="async" width={320} height={180} />
        </div>
      </div>
    </>
  );
}

const MENU_ITEMS = [
  { label: 'Inicio', Icon: Home },
  { label: 'Funciones', Icon: Layers },
  { label: 'Portal paciente', Icon: UserRound },
  { label: 'Panel clínica', Icon: Building2 },
  { label: 'Plataforma', Icon: Shield },
  { label: 'Planes', Icon: CreditCard },
  { label: 'Ayuda', Icon: CircleHelp },
  { label: 'Contacto', Icon: Mail }
] as const;

/** Card 2: menú completo abierto. */
export function PhoneMockFullMenu() {
  return (
    <>
      <MobileBrandBar close />
      <nav className="ps-phone-ui__menu" aria-hidden>
        {MENU_ITEMS.map(({ label, Icon }) => (
          <span key={label} className="ps-phone-ui__menu-row">
            <span className="ps-phone-ui__menu-icon">
              <Icon className="h-3 w-3" strokeWidth={2.25} />
            </span>
            <span>{label}</span>
            <ChevronRight className="ps-phone-ui__menu-chev h-3 w-3" strokeWidth={2.5} />
          </span>
        ))}
      </nav>
      <span className="ps-phone-ui__cta-outline">Solicitar demo</span>
      <div className="ps-phone-ui__shortcuts" aria-hidden>
        <span>Portal paciente</span>
        <span>Panel clínica</span>
        <span>Plataforma</span>
      </div>
    </>
  );
}

const ACCESS_OPTIONS = [
  {
    title: 'Portal paciente',
    text: 'Accede a tus citas, informes y facturas.',
    Icon: UserRound
  },
  {
    title: 'Panel clínica',
    text: 'Gestiona agenda, pacientes y facturación.',
    Icon: Building2
  },
  {
    title: 'Plataforma',
    text: 'Acceso para administradores.',
    Icon: Shield
  }
] as const;

/** Card 3: dropdown Entrar abierto. */
export function PhoneMockProfileAccess() {
  return (
    <>
      <div className="ps-phone-ui__bar" aria-hidden>
        <div className="ps-phone-ui__brand">
          <img src={LOGO_SRC} alt="" className="ps-phone-ui__logo" width={28} height={28} decoding="async" />
          <div>
            <span className="ps-phone-ui__name">Dentista+</span>
            <span className="ps-phone-ui__tag">TU CLÍNICA DIGITAL</span>
          </div>
        </div>
        <div className="ps-phone-ui__bar-actions">
          <span className="ps-phone-ui__btn-entrar ps-phone-ui__btn-entrar--open">
            Entrar
            <ChevronDown className="h-2.5 w-2.5" aria-hidden />
          </span>
          <span className="ps-phone-ui__icon-btn">
            <Menu className="h-3.5 w-3.5" strokeWidth={2.5} />
          </span>
        </div>
      </div>
      <div className="ps-phone-ui__dd-panel" aria-hidden>
        {ACCESS_OPTIONS.map(({ title, text, Icon }) => (
          <span key={title} className="ps-phone-ui__dd-item">
            <span className="ps-phone-ui__dd-icon">
              <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
            </span>
            <span className="ps-phone-ui__dd-copy">
              <strong>{title}</strong>
              <small>{text}</small>
            </span>
            <ChevronRight className="h-3 w-3 ps-phone-ui__dd-chev" strokeWidth={2.5} />
          </span>
        ))}
      </div>
    </>
  );
}

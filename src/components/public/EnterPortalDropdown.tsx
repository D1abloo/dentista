import { useEffect, useId, useRef, useState } from 'react';
import {
  ArrowRight,
  Building2,
  ChevronDown,
  LogIn,
  Shield,
  UserRound
} from 'lucide-react';

const OPTIONS = [
  {
    href: '/portal-paciente',
    icon: UserRound,
    tone: 'mint',
    title: 'Portal paciente',
    text: 'Accede a tus citas, informes y facturas.'
  },
  {
    href: '/login/admin',
    icon: Building2,
    tone: 'sky',
    title: 'Panel clínica',
    text: 'Gestiona agenda, pacientes y facturación.'
  },
  {
    href: '/platform/login',
    icon: Shield,
    tone: 'violet',
    title: 'Plataforma',
    text: 'Acceso para administradores.'
  }
] as const;

type Props = {
  className?: string;
  variant?: 'desktop' | 'mobile';
  onNavigate?: () => void;
};

export function EnterPortalDropdown({ className = '', variant = 'desktop', onNavigate }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  function closeAndNav() {
    setOpen(false);
    onNavigate?.();
  }

  return (
    <div
      className={`ps-enter-dd ps-enter-dd--${variant}${className ? ` ${className}` : ''}`}
      ref={rootRef}
    >
      <button
        type="button"
        className="ps-btn ps-btn--primary ps-btn--sm ps-enter-dd__trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
      >
        <LogIn className="h-3.5 w-3.5" aria-hidden />
        Entrar
        <ChevronDown
          className={`h-3.5 w-3.5 ps-enter-dd__chev${open ? ' ps-enter-dd__chev--open' : ''}`}
          aria-hidden
        />
      </button>
      {open ? (
        <div id={menuId} className="ps-enter-dd__menu" role="menu" aria-label="Accesos Dentista+">
          {OPTIONS.map((opt) => {
            const Icon = opt.icon;
            return (
              <a
                key={opt.href}
                href={opt.href}
                role="menuitem"
                className={`ps-enter-dd__item ps-enter-dd__item--${opt.tone}`}
                onClick={closeAndNav}
              >
                <span className="ps-enter-dd__icon" aria-hidden>
                  <Icon className="h-4 w-4" strokeWidth={2} />
                </span>
                <span className="ps-enter-dd__copy">
                  <strong>{opt.title}</strong>
                  <small>{opt.text}</small>
                </span>
                <ArrowRight className="ps-enter-dd__arrow h-4 w-4" aria-hidden />
              </a>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

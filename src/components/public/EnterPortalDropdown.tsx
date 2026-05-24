import { useEffect, useRef, useState } from 'react';
import { Building2, ChevronDown, LogIn, ShieldCheck, UserRound } from 'lucide-react';

const OPTIONS = [
  {
    href: '/login/paciente',
    icon: UserRound,
    title: 'Portal paciente',
    text: 'Accede a tu portal privado'
  },
  {
    href: '/login/admin',
    icon: Building2,
    title: 'Panel clínica',
    text: 'Accede a tu clínica'
  },
  {
    href: '/platform/login',
    icon: ShieldCheck,
    title: 'Plataforma',
    text: 'Administración global'
  }
] as const;

type Props = {
  className?: string;
  onNavigate?: () => void;
};

export function EnterPortalDropdown({ className = '', onNavigate }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className={`ps-enter-dd${className ? ` ${className}` : ''}`} ref={rootRef}>
      <button
        type="button"
        className="ps-btn ps-btn--primary ps-btn--sm ps-enter-dd__trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        <LogIn className="h-3.5 w-3.5" aria-hidden />
        Entrar
        <ChevronDown className={`h-3.5 w-3.5 ps-enter-dd__chev${open ? ' ps-enter-dd__chev--open' : ''}`} aria-hidden />
      </button>
      {open ? (
        <div className="ps-enter-dd__menu" role="menu">
          {OPTIONS.map((opt) => {
            const Icon = opt.icon;
            return (
              <a
                key={opt.href}
                href={opt.href}
                role="menuitem"
                className="ps-enter-dd__item"
                onClick={() => {
                  setOpen(false);
                  onNavigate?.();
                }}
              >
                <span className="ps-enter-dd__icon" aria-hidden>
                  <Icon className="h-4 w-4" />
                </span>
                <span>
                  <strong>{opt.title}</strong>
                  <small>{opt.text}</small>
                </span>
              </a>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

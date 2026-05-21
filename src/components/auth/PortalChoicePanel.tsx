import { Building2, ChevronRight, LayoutDashboard, UserRound } from 'lucide-react';
import type { PortalChoiceId, PortalChoiceOption } from '@/lib/auth/portalChoices';

const ICONS = {
  admin: Building2,
  patient: UserRound,
  platform: LayoutDashboard
} as const;

export function PortalChoicePanel({
  email,
  options,
  loading,
  onSelect
}: {
  email: string;
  options: PortalChoiceOption[];
  loading: PortalChoiceId | null;
  onSelect: (id: PortalChoiceId) => void;
}) {
  return (
    <div className="login-portal-choice" role="group" aria-labelledby="portal-choice-title">
      <p id="portal-choice-title" className="login-portal-choice__title">
        Elige dónde quieres entrar
      </p>
      <p className="login-portal-choice__lead">
        La cuenta <strong>{email}</strong> tiene acceso a más de un espacio. Selecciona el portal que necesitas ahora.
      </p>
      <ul className="login-portal__options login-portal__options--hub">
        {options.map((option, index) => {
          const Icon = ICONS[option.id];
          const isAdmin = option.id === 'admin';
          const isPatient = option.id === 'patient';
          const busy = loading === option.id;
          return (
            <li key={option.id} className="login-portal__option-wrap" style={{ animationDelay: `${index * 0.06}s` }}>
              <button
                type="button"
                className={[
                  'login-portal__option login-portal__link login-portal-choice__btn',
                  isAdmin ? 'login-portal__option--admin' : '',
                  isPatient ? 'login-portal__option--patient login-portal__option--highlight' : '',
                  option.id === 'platform' ? 'login-portal__option--platform' : ''
                ]
                  .filter(Boolean)
                  .join(' ')}
                disabled={Boolean(loading)}
                onClick={() => onSelect(option.id)}
              >
                <span
                  className={[
                    'login-portal__option-icon',
                    isPatient ? 'login-portal__option-icon--teal' : ''
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-hidden
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="login-portal__option-text">
                  <span className="login-portal__option-row">
                    <span className="login-portal__option-title">{option.label}</span>
                  </span>
                  <span className="login-portal__option-meta">{option.description}</span>
                </span>
                <span className="login-portal__option-cta">
                  {busy ? 'Entrando…' : 'Continuar'}
                  <ChevronRight className="h-4 w-4" />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

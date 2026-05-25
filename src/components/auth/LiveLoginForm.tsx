import { useEffect } from 'react';
import { Heart, Lock, Mail, ShieldCheck } from 'lucide-react';
import { PortalChoicePanel } from './PortalChoicePanel';
import { useExistingSessionRedirect } from './useExistingSessionRedirect';
import { useLoginWithPortalChoice } from './useLoginWithPortalChoice';

type LiveRole = 'admin' | 'patient';

export function LiveLoginForm({
  apiRole,
  variant = 'default'
}: {
  apiRole: LiveRole;
  variant?: 'default' | 'admin' | 'patient';
}) {
  const {
    email,
    setEmail,
    password,
    setPassword,
    error,
    loading,
    portalLoading,
    portalChoice,
    submitForm,
    pickPortal,
    resetChoice
  } = useLoginWithPortalChoice(apiRole);

  useExistingSessionRedirect(apiRole);

  useEffect(() => {
    const prefill = new URLSearchParams(window.location.search).get('email');
    if (prefill) setEmail(prefill);
  }, [setEmail]);

  const isAdmin = variant === 'admin';
  const isPatient = variant === 'patient';

  if (portalChoice) {
    return (
      <div className="login-form login-form--choice">
        <PortalChoicePanel
          email={portalChoice.email}
          options={portalChoice.options}
          loading={portalLoading}
          onSelect={pickPortal}
        />
        {error ? (
          <p className="login-form__error" role="alert">
            {error}
          </p>
        ) : null}
        <p className="login-form__back">
          <button type="button" className="login-form__link-btn" onClick={resetChoice}>
            ← Cambiar email o contraseña
          </button>
        </p>
      </div>
    );
  }

  const formClass = [
    'login-form',
    isAdmin ? 'login-form--admin' : '',
    isPatient ? 'login-form--patient' : ''
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <form onSubmit={submitForm} className={formClass}>
      {isAdmin ? (
        <p className="login-form__badge login-form__badge--admin">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
          Sesión segura · acceso con credenciales
        </p>
      ) : isPatient ? (
        <p className="login-form__badge login-form__badge--patient">
          <Heart className="h-3.5 w-3.5" aria-hidden />
          Acceso privado a tu historial
        </p>
      ) : (
        <p className="login-form__badge login-form__badge--neutral">
          <strong>Acceso seguro</strong> — credenciales de tu organización.
        </p>
      )}

      <div className="login-form__field">
        <label className="login-form__label" htmlFor={`${apiRole}-email`}>
          {isAdmin ? 'Email profesional' : 'Tu email'}
        </label>
        <div className="login-form__input-wrap">
          <Mail className="login-form__icon" aria-hidden />
          <input
            id={`${apiRole}-email`}
            type="email"
            className="login-form__input field-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
            placeholder={isAdmin ? 'tu@clinica.com' : 'tu@email.com'}
          />
        </div>
      </div>

      <div className="login-form__field">
        <label className="login-form__label" htmlFor={`${apiRole}-password`}>
          Contraseña
        </label>
        <div className="login-form__input-wrap">
          <Lock className="login-form__icon" aria-hidden />
          <input
            id={`${apiRole}-password`}
            type="password"
            className="login-form__input field-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="••••••••"
          />
        </div>
      </div>

      {error ? (
        <p className="login-form__error" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        className={`login-form__submit w-full ${isAdmin ? 'btn btn--teal' : 'btn btn--primary'}`}
        disabled={loading}
      >
        {loading ? 'Entrando…' : isAdmin ? 'Entrar al panel clínica' : 'Iniciar sesión'}
      </button>

      {!isAdmin ? (
        <p className="login-form__back">
          <a href="/login">← Volver a elegir portal</a>
        </p>
      ) : null}
    </form>
  );
}

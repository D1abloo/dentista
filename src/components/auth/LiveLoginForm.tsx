import { useEffect, useState } from 'react';
import { Heart, Lock, Mail, ShieldCheck } from 'lucide-react';
import { email as validateEmail } from '@/lib/validation';
import { PortalChoicePanel } from './PortalChoicePanel';
import { useLoginWithPortalChoice } from './useLoginWithPortalChoice';

type LiveRole = 'admin' | 'patient';

export function LiveLoginForm({
  apiRole,
  variant = 'default',
  forgotPasswordHref,
  loginErrorFallback = 'No se pudo iniciar sesión.'
}: {
  apiRole: LiveRole;
  variant?: 'default' | 'admin' | 'patient';
  forgotPasswordHref?: string;
  loginErrorFallback?: string;
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
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  useEffect(() => {
    const prefill = new URLSearchParams(window.location.search).get('email');
    if (prefill) setEmail(prefill);
  }, [setEmail]);

  const isAdmin = variant === 'admin';
  const isPatient = variant === 'patient';
  const displayError =
    fieldErrors.email ?? fieldErrors.password ?? (error === 'No se pudo iniciar sesión. Inténtalo de nuevo.' ? loginErrorFallback : error);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: { email?: string; password?: string } = {};
    const em = validateEmail(email);
    if (em) next.email = 'Introduce un email válido.';
    if (!password) next.password = 'La contraseña es obligatoria.';
    setFieldErrors(next);
    if (Object.keys(next).length) return;
    setFieldErrors({});
    await submitForm(e);
  }

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
    <form onSubmit={handleSubmit} className={formClass} noValidate>
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

      <div className={`login-form__field${fieldErrors.email ? ' login-form__field--error' : ''}`}>
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
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) setFieldErrors((f) => ({ ...f, email: undefined }));
            }}
            autoComplete="username"
            placeholder={isAdmin ? 'tu@clinica.com' : 'tu@email.com'}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? `${apiRole}-email-err` : undefined}
          />
        </div>
        {fieldErrors.email ? (
          <p id={`${apiRole}-email-err`} className="login-form__error" role="alert">
            {fieldErrors.email}
          </p>
        ) : null}
      </div>

      <div className={`login-form__field${fieldErrors.password ? ' login-form__field--error' : ''}`}>
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
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) setFieldErrors((f) => ({ ...f, password: undefined }));
            }}
            autoComplete="current-password"
            placeholder="••••••••"
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={fieldErrors.password ? `${apiRole}-password-err` : undefined}
          />
        </div>
        {fieldErrors.password ? (
          <p id={`${apiRole}-password-err`} className="login-form__error" role="alert">
            {fieldErrors.password}
          </p>
        ) : null}
      </div>

      {displayError ? (
        <p className="login-form__error" role="alert">
          {displayError}
        </p>
      ) : null}

      <button
        type="submit"
        className={`login-form__submit w-full ${isAdmin ? 'btn btn--teal' : 'btn btn--primary'}`}
        disabled={loading}
      >
        {loading ? 'Entrando…' : isAdmin ? 'Entrar al panel clínica' : 'Iniciar sesión'}
      </button>

      {isPatient && forgotPasswordHref ? (
        <p className="login-form__forgot">
          <a href={forgotPasswordHref}>¿Has olvidado tu contraseña?</a>
        </p>
      ) : null}

      {!isAdmin ? (
        <p className="login-form__back">
          <a href="/login">← Volver a elegir portal</a>
        </p>
      ) : null}
    </form>
  );
}

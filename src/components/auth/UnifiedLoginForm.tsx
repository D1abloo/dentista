import { useState } from 'react';
import { Lock, Mail } from 'lucide-react';
import { loginUnified } from '@/lib/session';

export function UnifiedLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await loginUnified(email.trim(), password);
    setLoading(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    if (result.mustChangePassword) return;
  }

  return (
    <form onSubmit={submit} className="login-form login-form--unified">
      <p className="login-form__badge login-form__badge--neutral">
        Introduce tu email y contraseña. Te llevamos al <strong>portal paciente</strong> o al{' '}
        <strong>panel de tu clínica</strong> según tu cuenta.
      </p>

      <div className="login-form__field">
        <label className="login-form__label" htmlFor="login-email">
          Email
        </label>
        <div className="login-form__input-wrap">
          <Mail className="login-form__icon" aria-hidden />
          <input
            id="login-email"
            type="email"
            className="login-form__input field-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
            placeholder="tu@email.com"
          />
        </div>
      </div>

      <div className="login-form__field">
        <label className="login-form__label" htmlFor="login-password">
          Contraseña
        </label>
        <div className="login-form__input-wrap">
          <Lock className="login-form__icon" aria-hidden />
          <input
            id="login-password"
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

      <button type="submit" className="login-form__submit btn btn--primary w-full" disabled={loading}>
        {loading ? 'Comprobando acceso…' : 'Iniciar sesión'}
      </button>

      <p className="login-form__back text-center">
        <a href="/">← Volver al inicio</a>
        {' · '}
        <a href="/platform/login">Equipo plataforma</a>
      </p>
    </form>
  );
}

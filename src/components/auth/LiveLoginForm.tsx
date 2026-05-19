import { useState } from 'react';
import { Lock, Mail, ShieldCheck } from 'lucide-react';
import { loginWithCredentials } from '@/lib/session';

type LiveRole = 'admin' | 'patient';

const hints: Record<LiveRole, { email: string; password: string }> = {
  admin: { email: 'admin@clinic.local', password: 'admin12345' },
  patient: { email: 'maria@example.com', password: 'paciente123' }
};

export function LiveLoginForm({
  apiRole,
  variant = 'default'
}: {
  apiRole: LiveRole;
  variant?: 'default' | 'admin' | 'patient';
}) {
  const [email, setEmail] = useState(hints[apiRole].email);
  const [password, setPassword] = useState(hints[apiRole].password);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isAdmin = variant === 'admin';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await loginWithCredentials(apiRole, email.trim(), password);
    setLoading(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    window.location.href = result.portalRole === 'admin' ? '/admin' : '/paciente';
  }

  return (
    <form onSubmit={submit} className={`login-form ${isAdmin ? 'login-form--admin' : ''}`}>
      {isAdmin ? (
        <p className="login-form__badge">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
          Sesión segura · modo LIVE
        </p>
      ) : (
        <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
          <strong>Modo LIVE</strong> — sin auto-login ni localStorage de demo.
        </p>
      )}

      <div className="login-form__field">
        <label className="login-form__label" htmlFor={`${apiRole}-email`}>
          {isAdmin ? 'Email profesional' : 'Email'}
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
            placeholder="tu@clinica.com"
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

      <button type="submit" className="login-form__submit btn btn--primary w-full" disabled={loading}>
        {loading ? 'Entrando…' : 'Iniciar sesión'}
      </button>
    </form>
  );
}

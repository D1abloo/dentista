import { useState } from 'react';
import { loginWithCredentials } from '@/lib/session';

type LiveRole = 'admin' | 'patient';

const hints: Record<LiveRole, { title: string; subtitle: string; email: string }> = {
  admin: {
    title: 'Acceso administración (LIVE)',
    subtitle: 'Sesión real por cookie. Usa las credenciales de clínica configuradas en el servidor.',
    email: 'admin@clinic.local'
  },
  patient: {
    title: 'Acceso paciente (LIVE)',
    subtitle: 'Sesión real por cookie. Usa las credenciales de paciente del servidor.',
    email: 'maria@example.com'
  }
};

export function LiveLoginForm({ apiRole }: { apiRole: LiveRole }) {
  const [email, setEmail] = useState(hints[apiRole].email);
  const [password, setPassword] = useState(apiRole === 'admin' ? 'admin12345' : 'paciente123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const meta = hints[apiRole];

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
    <form onSubmit={submit} className="mt-6 space-y-4">
      <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
        <strong>Modo LIVE</strong> — sin auto-login ni localStorage de demo.
      </p>
      <label className="block text-sm font-semibold text-slate-700">
        Email
        <input
          type="email"
          className="field-control mt-1 w-full"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="username"
        />
      </label>
      <label className="block text-sm font-semibold text-slate-700">
        Contraseña
        <input
          type="password"
          className="field-control mt-1 w-full"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
      </label>
      {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
      <button type="submit" className="btn btn--primary w-full" disabled={loading}>
        {loading ? 'Entrando…' : 'Iniciar sesión'}
      </button>
    </form>
  );
}

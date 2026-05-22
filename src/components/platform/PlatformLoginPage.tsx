import { useEffect, useState } from 'react';
import { Building2, Lock, Mail, ShieldCheck } from 'lucide-react';
import { LogoMark } from '@/components/brand/Logo';
import { LoginAccessBar, LoginAccessFoot } from '@/components/auth/LoginAccessChrome';

const HERO_IMAGE = '/images/login-dentista-paciente.jpg';

const TRUST = [
  { icon: ShieldCheck, text: 'Acceso restringido' },
  { icon: Building2, text: 'Multi-clínica aislada' },
  { icon: Lock, text: 'Sesión cifrada' }
] as const;

export function PlatformLoginPage() {
  const [emailVal, setEmailVal] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setEntered(true), 40);
    return () => window.clearTimeout(t);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ role: 'super_admin', email: emailVal.trim(), password })
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) {
        setError(json.error?.message ?? 'Acceso denegado');
        return;
      }
      window.location.href = '/platform';
    } catch {
      setError('No se pudo conectar. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={`login-platform ${entered ? 'login-platform--ready' : ''}`}>
      <LoginAccessBar backHref="/" backLabel="Inicio" badge="Plataforma" />

      <aside className="login-platform__hero">
        <img
          src={HERO_IMAGE}
          alt=""
          className="login-platform__hero-img"
          loading="eager"
          decoding="async"
        />
        <div className="login-platform__hero-overlay" />
        <div className="login-platform__hero-content">
          <p className="login-platform__hero-eyebrow">Dentista+ Platform</p>
          <h2 className="login-platform__hero-title">Control de tu red de clínicas</h2>
          <p className="login-platform__hero-lead">Altas, suscripciones y soporte en un solo panel.</p>
          <ul className="login-platform__hero-trust">
            {TRUST.map(({ icon: Icon, text }) => (
              <li key={text}>
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                {text}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <section className="login-platform__panel">
        <div className="login-platform__card">
          <div className="login-platform__card-glow" aria-hidden />
          <header className="login-platform__head">
            <LogoMark size={48} />
            <div>
              <p className="login-platform__eyebrow">Super Admin</p>
              <h1 className="login-platform__title">Acceso plataforma</h1>
              <p className="login-platform__lead">Solo personal autorizado.</p>
            </div>
          </header>

          <form onSubmit={submit} className="login-form login-form--platform">
            <p className="login-form__badge login-form__badge--platform">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
              Credenciales de equipo interno
            </p>

            <div className="login-form__field">
              <label className="login-form__label" htmlFor="platform-email">
                Email corporativo
              </label>
              <div className="login-form__input-wrap">
                <Mail className="login-form__icon" aria-hidden />
                <input
                  id="platform-email"
                  type="email"
                  className="login-form__input field-control"
                  value={emailVal}
                  onChange={(e) => setEmailVal(e.target.value)}
                  required
                  autoComplete="username"
                  placeholder="admin@dentista.app"
                />
              </div>
            </div>

            <div className="login-form__field">
              <label className="login-form__label" htmlFor="platform-password">
                Contraseña
              </label>
              <div className="login-form__input-wrap">
                <Lock className="login-form__icon" aria-hidden />
                <input
                  id="platform-password"
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

            <button type="submit" className="login-form__submit btn btn--teal w-full" disabled={loading}>
              {loading ? 'Verificando…' : 'Entrar al panel'}
            </button>
          </form>

          <footer className="login-platform__foot">
            <LoginAccessFoot
              links={[
                { href: '/login/admin', label: 'Panel clínica' },
                { href: '/login/paciente', label: 'Portal paciente' },
                { href: '/login', label: 'Portales' }
              ]}
            />
          </footer>
        </div>
      </section>
    </main>
  );
}

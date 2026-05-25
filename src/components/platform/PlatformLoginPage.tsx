import { useEffect, useState } from 'react';
import { ChevronRight, Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react';
import { DentistaWebpLockup } from '@/components/brand/DentistaWebpLogo';
import { LogoMark } from '@/components/brand/Logo';
import { brandImages } from '@/lib/brand/assets';
import { BRAND_ACCESS_PLATFORM, BRAND_NAME, BRAND_TAGLINE_PLATFORM } from '@/lib/brand/identity';

const HERO_IMAGE = brandImages.citas;
const REMEMBER_KEY = 'df_platform_remember';
const REMEMBER_EMAIL_KEY = 'df_platform_remember_email';

const TRUST_BADGES = [
  { label: 'Acceso restringido' },
  { label: 'Multi-clínica aislada' },
  { label: 'Sesión cifrada' },
  { label: 'Auditoría activa' }
] as const;

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function PlatformLoginPage() {
  const [emailVal, setEmailVal] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setEntered(true), 40);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    try {
      const savedRemember = localStorage.getItem(REMEMBER_KEY) === '1';
      const savedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY) ?? '';
      if (savedRemember) {
        setRemember(true);
        if (savedEmail) setEmailVal(savedEmail);
      }
    } catch {
      /* ignore */
    }
  }, []);

  function validate(): boolean {
    const next: { email?: string; password?: string } = {};
    const email = emailVal.trim();
    if (!email) next.email = 'Introduce tu email.';
    else if (!isValidEmail(email)) next.email = 'Introduce un email válido.';
    if (!password) next.password = 'Introduce tu contraseña.';
    setFieldErrors(next);
    setError('');
    return Object.keys(next).length === 0;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setError('');
    setLoading(true);
    const email = emailVal.trim().toLowerCase();

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          role: 'super_admin',
          email,
          password,
          remember
        })
      });
      const json = (await res.json()) as { error?: { message?: string } };

      if (!res.ok) {
        setError(json.error?.message ?? 'Credenciales incorrectas.');
        return;
      }

      try {
        if (remember) {
          localStorage.setItem(REMEMBER_KEY, '1');
          localStorage.setItem(REMEMBER_EMAIL_KEY, email);
        } else {
          localStorage.removeItem(REMEMBER_KEY);
          localStorage.removeItem(REMEMBER_EMAIL_KEY);
        }
      } catch {
        /* ignore */
      }

      window.location.href = '/platform';
    } catch {
      setError('No se pudo iniciar sesión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  const formError = error || fieldErrors.email || fieldErrors.password;

  return (
    <main className={`plt-login ${entered ? 'plt-login--ready' : ''}`}>
      <aside className="plt-login__hero" aria-hidden={false}>
        <img src={HERO_IMAGE} alt="" className="plt-login__hero-img" loading="eager" decoding="async" />
        <div className="plt-login__hero-overlay" aria-hidden />
        <div className="plt-login__hero-inner">
          <a href="/" className="plt-login__brand">
            <DentistaWebpLockup placement="header" context="platform" />
          </a>

          <div className="plt-login__hero-copy">
            <p className="plt-login__hero-label">
              {BRAND_NAME} · {BRAND_TAGLINE_PLATFORM}
            </p>
            <h1 className="plt-login__hero-title">
              Gestiona tu plataforma dental <span>desde un solo lugar</span>
            </h1>
            <p className="plt-login__hero-lead">
              Controla clínicas, tenants, usuarios, suscripciones, soporte y seguridad con acceso exclusivo para
              administradores autorizados.
            </p>

            <ul className="plt-login__badges">
              {TRUST_BADGES.map(({ label }, i) => (
                <li key={label} className="plt-login__badge" style={{ animationDelay: `${0.08 * i}s` }}>
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>

      <section className="plt-login__panel">
        <div className="plt-login__panel-center">
          <div className={`plt-login__card plt-login__card--compact${formError ? ' plt-login__card--error' : ''}`}>
            <header className="plt-login__card-head plt-login__card-head--compact">
              <LogoMark size={44} />
              <div>
                <span className="plt-login__super-badge">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                  Super Admin
                </span>
                <h2 className="plt-login__card-title">{BRAND_ACCESS_PLATFORM}</h2>
                <p className="plt-login__card-brand">{BRAND_NAME}</p>
              </div>
            </header>

            <form onSubmit={submit} className="plt-login__form" noValidate>
              <div className="plt-login__field">
                <label htmlFor="platform-email">Email</label>
                <div className={`plt-login__input${fieldErrors.email ? ' plt-login__input--invalid' : ''}`}>
                  <Mail className="h-4 w-4 shrink-0" aria-hidden />
                  <input
                    id="platform-email"
                    type="email"
                    autoComplete="username"
                    placeholder="Introduce tu email"
                    value={emailVal}
                    onChange={(e) => {
                      setEmailVal(e.target.value);
                      if (fieldErrors.email) setFieldErrors((f) => ({ ...f, email: undefined }));
                    }}
                    aria-invalid={Boolean(fieldErrors.email)}
                  />
                </div>
                {fieldErrors.email ? (
                  <p className="plt-login__field-error" role="alert">
                    {fieldErrors.email}
                  </p>
                ) : null}
              </div>

              <div className="plt-login__field">
                <label htmlFor="platform-password">Contraseña</label>
                <div className={`plt-login__input${fieldErrors.password ? ' plt-login__input--invalid' : ''}`}>
                  <Lock className="h-4 w-4 shrink-0" aria-hidden />
                  <input
                    id="platform-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Introduce tu contraseña"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) setFieldErrors((f) => ({ ...f, password: undefined }));
                    }}
                    aria-invalid={Boolean(fieldErrors.password)}
                  />
                  <button
                    type="button"
                    className="plt-login__toggle-pw"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {fieldErrors.password ? (
                  <p className="plt-login__field-error" role="alert">
                    {fieldErrors.password}
                  </p>
                ) : null}
              </div>

              <label className="plt-login__remember plt-login__remember--solo">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                Recordar sesión
              </label>

              {error ? (
                <p className="plt-login__alert" role="alert">
                  {error}
                </p>
              ) : null}

              <button type="submit" className="plt-login__submit" disabled={loading}>
                <Lock className="h-4 w-4 shrink-0" aria-hidden />
                {loading ? 'Entrando…' : 'Entrar al panel'}
                <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
              </button>
            </form>
          </div>

          <footer className="plt-login__legal plt-login__legal--compact">
            <span>© {new Date().getFullYear()} {BRAND_NAME}</span>
            <span className="plt-login__legal-links">
              <a href="/terminos">Términos</a>
              <a href="/privacidad">Privacidad</a>
            </span>
          </footer>
        </div>
      </section>
    </main>
  );
}

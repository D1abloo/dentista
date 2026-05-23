import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Building2,
  Check,
  ClipboardList,
  Eye,
  EyeOff,
  Globe,
  Headphones,
  Lock,
  Mail,
  Shield,
  ShieldCheck,
  Users
} from 'lucide-react';
import { DentistaWebpLockup } from '@/components/brand/DentistaWebpLogo';

const HERO_IMAGE = '/images/login-dentista-paciente.jpg';
const REMEMBER_KEY = 'df_platform_remember';
const REMEMBER_EMAIL_KEY = 'df_platform_remember_email';

const TRUST_BADGES = [
  { icon: Shield, label: 'Acceso restringido' },
  { icon: Building2, label: 'Multi-clínica aislada' },
  { icon: Lock, label: 'Sesión cifrada' },
  { icon: ClipboardList, label: 'Auditoría activa' }
] as const;

const METRICS = [
  { icon: Building2, value: '128', label: 'Clínicas gestionadas' },
  { icon: Users, value: '256', label: 'Tenants aislados' },
  { icon: Headphones, value: '24/7', label: 'Soporte centralizado' }
] as const;

const ACCESS_LINKS = [
  { href: '/login/admin', label: 'Panel clínica', desc: 'Acceso para clínicas', icon: Building2 },
  { href: '/login/paciente', label: 'Portal paciente', desc: 'Acceso para pacientes', icon: Users },
  { href: '/', label: 'Sitio público', desc: 'Ir al sitio oficial', icon: Globe }
] as const;

const SECURITY_ITEMS = ['Sesión cifrada', 'Registro de accesos', 'Control por rol', 'Aislamiento multi-tenant'] as const;

const FORGOT_HREF =
  '/contacto?tipo=tecnico&mensaje=Necesito%20recuperar%20acceso%20al%20panel%20Super%20Admin%20de%20plataforma.';

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
    if (!email) next.email = 'Introduce tu email corporativo.';
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
        <div className="plt-login__hero-overlay" />
        <div className="plt-login__hero-inner">
          <a href="/" className="plt-login__brand">
            <DentistaWebpLockup placement="header" />
          </a>

          <div className="plt-login__hero-copy">
            <p className="plt-login__hero-label">Dentista+ · Plataforma</p>
            <h1 className="plt-login__hero-title">
              Gestiona tu plataforma dental <span>desde un solo lugar</span>
            </h1>
            <p className="plt-login__hero-lead">
              Controla clínicas, tenants, usuarios, suscripciones, soporte y seguridad con acceso exclusivo para
              administradores autorizados.
            </p>

            <ul className="plt-login__badges">
              {TRUST_BADGES.map(({ icon: Icon, label }, i) => (
                <li
                  key={label}
                  className="plt-login__badge"
                  style={{ animationDelay: `${0.08 * i}s` }}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  {label}
                </li>
              ))}
            </ul>

            <div className="plt-login__metrics">
              {METRICS.map(({ icon: Icon, value, label }) => (
                <div key={label} className="plt-login__metric">
                  <Icon className="h-5 w-5 shrink-0" aria-hidden />
                  <div>
                    <strong>{value}</strong>
                    <span>{label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="plt-login__hero-foot">
            <Shield className="h-4 w-4 shrink-0" aria-hidden />
            Plataforma segura y auditada. Todos los accesos quedan registrados.
          </p>
        </div>
      </aside>

      <section className="plt-login__panel">
        <div className="plt-login__panel-scroll">
          <div className={`plt-login__card${formError ? ' plt-login__card--error' : ''}`}>
            <header className="plt-login__card-head">
              <span className="plt-login__super-badge">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                Super Admin
              </span>
              <h2 className="plt-login__card-title">Acceso plataforma</h2>
              <p className="plt-login__card-sub">Solo personal autorizado</p>
            </header>

            <p className="plt-login__mode">
              <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
              Estás entrando como Super Admin
            </p>

            <form onSubmit={submit} className="plt-login__form" noValidate>
              <div className="plt-login__field">
                <label htmlFor="platform-email">Email corporativo</label>
                <div className={`plt-login__input${fieldErrors.email ? ' plt-login__input--invalid' : ''}`}>
                  <Mail className="h-4 w-4 shrink-0" aria-hidden />
                  <input
                    id="platform-email"
                    type="email"
                    autoComplete="username"
                    placeholder="admin@dentista.app"
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

              <div className="plt-login__row">
                <label className="plt-login__remember">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  Recordar sesión
                </label>
                <a href={FORGOT_HREF} className="plt-login__forgot">
                  Olvidé mi contraseña
                </a>
              </div>

              {error ? (
                <p className="plt-login__alert" role="alert">
                  {error}
                </p>
              ) : null}

              <button type="submit" className="plt-login__submit" disabled={loading}>
                <Lock className="h-4 w-4 shrink-0" aria-hidden />
                {loading ? 'Entrando…' : 'Entrar al panel'}
              </button>

              <p className="plt-login__secure-note">
                <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Acceso protegido con auditoría y control de sesiones.
              </p>
            </form>
          </div>

          <nav className="plt-login__access" aria-label="Otros accesos">
            {ACCESS_LINKS.map(({ href, label, desc, icon: Icon }) => (
              <a key={href} href={href} className="plt-login__access-card">
                <span className="plt-login__access-icon" aria-hidden>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="plt-login__access-text">
                  <strong>{label}</strong>
                  <small>{desc}</small>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 plt-login__access-arrow" aria-hidden />
              </a>
            ))}
          </nav>

          <div className="plt-login__bottom">
            <div className="plt-login__support plt-login__support--fade">
              <Headphones className="h-6 w-6 shrink-0 text-teal-700" aria-hidden />
              <div>
                <h3>¿Problemas para acceder?</h3>
                <p>
                  Contacta con soporte si no recuerdas tus credenciales o tu cuenta está bloqueada.
                </p>
                <a href="/contacto?tipo=tecnico" className="plt-login__support-btn">
                  Contactar soporte
                </a>
              </div>
            </div>

            <div className="plt-login__security-card">
              <h3>
                <Shield className="h-5 w-5 shrink-0" aria-hidden />
                Seguridad activa
              </h3>
              <ul>
                {SECURITY_ITEMS.map((item) => (
                  <li key={item}>
                    <Check className="h-4 w-4 shrink-0" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <footer className="plt-login__legal">
            <span>© {new Date().getFullYear()} Dentista+. Todos los derechos reservados.</span>
            <span className="plt-login__legal-links">
              <a href="/terminos">Términos y condiciones</a>
              <a href="/privacidad">Política de privacidad</a>
            </span>
          </footer>
        </div>
      </section>
    </main>
  );
}

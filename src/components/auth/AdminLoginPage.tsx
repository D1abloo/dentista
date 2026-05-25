import { Building2, ChevronRight, Eye, EyeOff, Lock, Mail, Shield, UserRound, CalendarDays, FileText, CreditCard } from 'lucide-react';
import { useEffect, useState } from 'react';
import { LogoMark } from '@/components/brand/Logo';
import { DentistaWebpLockup } from '@/components/brand/DentistaWebpLogo';
import { PortalChoicePanel } from '@/components/auth/PortalChoicePanel';
import { PortalPickerModal } from '@/components/auth/PortalPickerModal';
import { ensureAdminAccessBeforeRedirect } from '@/lib/clinicCenters';
import { loginUnified, loginWithPortalChoice } from '@/lib/session';
import type { SessionUser } from '@/lib/auth';
import type { PortalChoiceId, PortalChoiceOption } from '@/lib/auth/portalChoices';
import {
  canAccessClinicPanel,
  inferSessionPortal,
  postLoginPathForUser,
  type SessionPortal
} from '@/lib/auth/sessionPortal';

const HERO_IMAGE = '/images/login-dentista-paciente.jpg';
const REMEMBER_KEY = 'df_clinic_remember';
const REMEMBER_EMAIL_KEY = 'df_clinic_remember_email';

const FEATURES = [
  { icon: CalendarDays, label: 'Agenda inteligente' },
  { icon: UserRound, label: 'Portal paciente' },
  { icon: CreditCard, label: 'Facturación' },
  { icon: FileText, label: 'Documentos seguros' }
] as const;

const SECURITY_ITEMS = ['Sesión cifrada', 'Control de acceso por rol', 'Acceso por clínica', 'Auditoría de actividad'] as const;

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function AdminLoginPage() {
  const [emailVal, setEmailVal] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [entered, setEntered] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [portalChoice, setPortalChoice] = useState<{
    email: string;
    options: PortalChoiceOption[];
  } | null>(null);
  const [portalLoading, setPortalLoading] = useState<PortalChoiceId | null>(null);
  const [platformSession, setPlatformSession] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setEntered(true), 40);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    try {
      const prefill = new URLSearchParams(window.location.search).get('email');
      if (prefill) setEmailVal(prefill);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const r = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' });
        if (!r.ok) return;
        const j = (await r.json()) as {
          data?: {
            role?: string;
            clinicId?: string;
            staffRole?: string;
            sessionPortal?: SessionPortal;
            platformInspect?: boolean;
          };
        };
        const data = j.data;
        if (!data?.role) return;

        const portal = inferSessionPortal({
          role: data.role,
          clinicId: data.clinicId,
          platformInspect: data.platformInspect,
          sessionPortal: data.sessionPortal
        });

        if (portal === 'platform' && !data.platformInspect) {
          setPlatformSession(true);
          window.location.replace('/platform');
          return;
        }

        if (portal === 'patient') {
          window.location.replace('/paciente');
          return;
        }

        if (!canAccessClinicPanel({
          role: data.role as SessionUser['role'],
          clinicId: data.clinicId,
          staffRole: data.staffRole,
          platformInspect: data.platformInspect,
          sessionPortal: data.sessionPortal
        })) {
          return;
        }

        const params = new URLSearchParams(window.location.search);
        const next = params.get('next');
        const dest =
          next && next.startsWith('/admin')
            ? next
            : postLoginPathForUser(
                {
                  role: data.role as 'admin' | 'super_admin' | 'patient',
                  clinicId: data.clinicId,
                  sessionPortal: data.sessionPortal,
                  platformInspect: data.platformInspect
                },
                { preferAdmin: true }
              );
        await ensureAdminAccessBeforeRedirect(dest);
        window.location.replace(dest);
      } catch {
        /* sin sesión previa */
      }
    })();
  }, []);

  useEffect(() => {
    try {
      if (localStorage.getItem(REMEMBER_KEY) === '1') {
        setRemember(true);
        const saved = localStorage.getItem(REMEMBER_EMAIL_KEY);
        if (saved) setEmailVal(saved);
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

  function persistRemember(email: string) {
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
  }

  async function redirectAfterSuccess(dest: string) {
    setSuccess(true);
    setError('');
    await ensureAdminAccessBeforeRedirect(dest);
    try {
      const me = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' });
      if (!me.ok) {
        setSuccess(false);
        setError(
          'La sesión no se guardó en el navegador. Comprueba que las cookies estén permitidas e inténtalo de nuevo.'
        );
        return;
      }
    } catch {
      setSuccess(false);
      setError('No se pudo verificar la sesión. Comprueba tu conexión e inténtalo de nuevo.');
      return;
    }
    window.location.replace(dest);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setError('');
    setLoading(true);
    const email = emailVal.trim().toLowerCase();

    try {
      const result = await loginUnified(email, password, 'admin', {
        remember,
        deferRedirect: true
      });

      if (!result.ok) {
        setError(result.message);
        return;
      }

      if ('choosePortal' in result && result.choosePortal) {
        setPortalChoice({ email: result.email, options: result.options });
        return;
      }

      if ('redirectTo' in result) {
        persistRemember(email);
        redirectAfterSuccess(result.redirectTo);
      }
    } catch {
      setError('No se pudo iniciar sesión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  async function pickPortal(portal: PortalChoiceId) {
    if (!emailVal || !password) return;
    setPortalLoading(portal);
    setError('');
    const email = emailVal.trim().toLowerCase();
    const result = await loginWithPortalChoice(email, password, portal, 'admin', {
      remember,
      deferRedirect: true
    });
    setPortalLoading(null);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    if ('redirectTo' in result) {
      persistRemember(email);
      redirectAfterSuccess(result.redirectTo);
    }
  }

  const formError = error || fieldErrors.email || fieldErrors.password;

  return (
    <main className={`cln-login ${entered ? 'cln-login--ready' : ''}`}>
      <div className="cln-login__bg" aria-hidden>
        <img src={HERO_IMAGE} alt="" className="cln-login__bg-img" loading="eager" decoding="async" />
        <div className="cln-login__bg-overlay" />
      </div>

      <header className="cln-login__topbar">
        <a href="/" className="cln-login__brand">
          <DentistaWebpLockup placement="header" />
        </a>
        <span className="cln-login__top-badge">Panel clínica</span>
        <button type="button" className="cln-login__top-btn" onClick={() => setPickerOpen(true)}>
          <Building2 className="h-4 w-4 shrink-0" aria-hidden />
          Elegir portal
        </button>
      </header>

      <div className="cln-login__stage">
        <section className="cln-login__hero">
          <h1>
            Gestiona tu clínica dental <span>en un solo panel</span>
          </h1>
          <p>
            Organiza citas, pacientes, documentos, informes, facturas y comunicaciones con tus pacientes desde
            Dentista+.
          </p>
          <ul className="cln-login__features">
            {FEATURES.map(({ icon: Icon, label }, i) => (
              <li key={label} style={{ animationDelay: `${0.07 * i}s` }}>
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                {label}
              </li>
            ))}
          </ul>
          <aside className="cln-login__security-mini">
            <Shield className="h-5 w-5 shrink-0 text-teal-300" aria-hidden />
            <div>
              <strong>Seguridad activa</strong>
              <ul>
                {SECURITY_ITEMS.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </aside>
        </section>

        <section className="cln-login__panel">
          <article className={`cln-login__card${formError ? ' cln-login__card--error' : ''}${success ? ' cln-login__card--success' : ''}`}>
            <header className="cln-login__card-head cln-login__card-head--compact">
              <LogoMark size={44} />
              <div>
                <p className="cln-login__eyebrow">Dentista+ · Administración</p>
                <h2>Acceso a tu clínica</h2>
              </div>
            </header>

            {platformSession && !portalChoice ? (
              <p className="cln-login__hint" role="status">
                Tienes sesión de plataforma activa. Introduce tu contraseña para abrir el panel clínica.
              </p>
            ) : null}

            {portalChoice ? (
              <div className="cln-login__choice">
                <PortalChoicePanel
                  email={portalChoice.email}
                  options={portalChoice.options}
                  loading={portalLoading}
                  onSelect={pickPortal}
                />
                {error ? (
                  <p className="cln-login__alert cln-login__alert--shake" role="alert">
                    {error}
                  </p>
                ) : null}
                <button
                  type="button"
                  className="cln-login__back-link"
                  onClick={() => {
                    setPortalChoice(null);
                    setError('');
                  }}
                >
                  ← Cambiar email o contraseña
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="cln-login__form" noValidate>
                  <div className="cln-login__field">
                    <label htmlFor="clinic-email">Email</label>
                    <div className={`cln-login__input${fieldErrors.email ? ' cln-login__input--invalid' : ''}`}>
                      <Mail className="h-4 w-4 shrink-0" aria-hidden />
                      <input
                        id="clinic-email"
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
                      <p className="cln-login__field-error" role="alert">
                        {fieldErrors.email}
                      </p>
                    ) : null}
                  </div>

                  <div className="cln-login__field">
                    <label htmlFor="clinic-password">Contraseña</label>
                    <div className={`cln-login__input${fieldErrors.password ? ' cln-login__input--invalid' : ''}`}>
                      <Lock className="h-4 w-4 shrink-0" aria-hidden />
                      <input
                        id="clinic-password"
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
                        className="cln-login__toggle-pw"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {fieldErrors.password ? (
                      <p className="cln-login__field-error" role="alert">
                        {fieldErrors.password}
                      </p>
                    ) : null}
                  </div>

                  <label className="cln-login__remember cln-login__remember--solo">
                    <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                    Recordar sesión
                  </label>

                  {error ? (
                    <p className="cln-login__alert cln-login__alert--shake" role="alert">
                      {error}
                    </p>
                  ) : null}

                  <button type="submit" className="cln-login__submit" disabled={loading || success}>
                    {success ? (
                      <>
                        <span className="cln-login__check" aria-hidden />
                        Acceso correcto
                      </>
                    ) : (
                      <>
                        {loading ? 'Entrando…' : 'Entrar al panel clínica'}
                        <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
                      </>
                    )}
                  </button>
                </form>
            )}
          </article>
        </section>
      </div>

      <PortalPickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} />
    </main>
  );
}

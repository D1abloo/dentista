import { useEffect, useRef, useState } from 'react';
import { Building2, Lock, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { LogoMark } from '@/components/brand/Logo';

const HERO_IMAGE = '/images/login-dentista-paciente.jpg';

const TRUST = [
  { icon: ShieldCheck, text: 'Acceso restringido al equipo de plataforma' },
  { icon: Building2, text: 'Gestión multi-clínica sin mezclar datos' },
  { icon: Lock, text: 'Sesión cifrada y trazabilidad' }
] as const;

export function PlatformLoginPage() {
  const shellRef = useRef<HTMLElement | null>(null);
  const [emailVal, setEmailVal] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [entered, setEntered] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const t = window.setTimeout(() => setEntered(true), 40);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    const el = shellRef.current;
    if (!el) return;
    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      setTilt({ x: px * 8, y: py * 6 });
    };
    const onLeave = () => setTilt({ x: 0, y: 0 });
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
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

  const imgTransform = `translate(${tilt.x * -0.4}px, ${tilt.y * -0.4}px) scale(1.05)`;

  return (
    <main
      ref={shellRef}
      className={`login-platform ${entered ? 'login-platform--ready' : ''}`}
    >
      <aside className="login-platform__hero" aria-hidden={false}>
        <img
          src={HERO_IMAGE}
          alt="Profesional dental con paciente en consulta"
          className="login-platform__hero-img"
          style={{ transform: imgTransform }}
          loading="eager"
          decoding="async"
        />
        <div className="login-platform__hero-overlay" />
        <div className="login-platform__hero-content">
          <p className="login-platform__hero-eyebrow">
            <Sparkles className="h-4 w-4" aria-hidden />
            Dentista+ Platform
          </p>
          <h2 className="login-platform__hero-title">Centro de control para tu red de clínicas</h2>
          <p className="login-platform__hero-lead">
            Supervisa altas, suscripciones y soporte con la misma calidad visual que ofreces a cada
            centro y a cada paciente.
          </p>
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
        <div
          className="login-platform__card"
          style={{
            transform: `perspective(900px) rotateX(${tilt.y * -0.15}deg) rotateY(${tilt.x * 0.2}deg)`
          }}
        >
          <div className="login-platform__card-glow" aria-hidden />
          <header className="login-platform__head">
            <LogoMark size={52} />
            <div>
              <p className="login-platform__eyebrow">Acceso restringido</p>
              <h1 className="login-platform__title">Super Admin</h1>
              <p className="login-platform__lead">Solo personal autorizado de plataforma.</p>
            </div>
          </header>

          <form onSubmit={submit} className="login-form login-form--platform">
            <p className="login-form__badge login-form__badge--platform">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
              Panel global · credenciales de equipo
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

            <button type="submit" className="login-form__submit btn btn--primary w-full" disabled={loading}>
              {loading ? 'Verificando…' : 'Entrar al panel de plataforma'}
            </button>
          </form>

          <footer className="login-platform__foot">
            <a href="/">← Inicio público</a>
            <span>·</span>
            <a href="/login">Portales clínica y paciente</a>
          </footer>
        </div>
      </section>
    </main>
  );
}

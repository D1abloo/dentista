import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Calendar,
  ClipboardCheck,
  Download,
  Eye,
  FileStack,
  FileText,
  KeyRound,
  Lock,
  MessageSquare,
  Receipt,
  Shield,
  ShieldCheck,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { LiveLoginForm } from '@/components/auth/LiveLoginForm';
import { DentistaWebpLockup } from '@/components/brand/DentistaWebpLogo';
import type { SessionUser } from '@/lib/session';
import { PatientPortalPhoneMockup } from './PatientPortalPhoneMockup';
import { PatientPortalRegisterForm } from './PatientPortalRegisterForm';
import { PublicSiteShell } from './PublicSiteShell';

type AuthTab = 'login' | 'register';

const HERO_TRUST = [
  'Acceso seguro',
  'Datos protegidos',
  'Solo tú ves tu información',
  'Conectado con tu clínica'
] as const;

const BENEFITS = [
  {
    icon: FileText,
    title: 'Informes clínicos',
    text: 'Consulta informes publicados por tu clínica con lectura clara y descarga segura.'
  },
  {
    icon: FileStack,
    title: 'Documentos',
    text: 'Accede a radiografías, consentimientos y archivos compartidos contigo.'
  },
  {
    icon: Receipt,
    title: 'Facturas y pagos',
    text: 'Revisa facturas emitidas, estados de pago y recibos desde un mismo lugar.'
  },
  {
    icon: Calendar,
    title: 'Mis citas',
    text: 'Consulta próximas citas, estados, horarios y detalles de tus visitas.'
  },
  {
    icon: MessageSquare,
    title: 'Mensajes',
    text: 'Comunícate con tu clínica de forma privada y trazable.'
  },
  {
    icon: ClipboardCheck,
    title: 'Consentimientos',
    text: 'Lee y firma documentos obligatorios antes de determinados tratamientos.'
  },
  {
    icon: ShieldCheck,
    title: 'Privacidad garantizada',
    text: 'Solo tú ves tu información. Datos aislados por clínica y acceso autenticado.'
  },
  {
    icon: Lock,
    title: 'Acceso seguro',
    text: 'Inicio de sesión protegido, activación por correo y contraseña personal.'
  }
] as const;

const STEPS = [
  {
    title: 'La clínica crea tu acceso',
    text: 'Tu clínica registra tu ficha y habilita el acceso al portal.'
  },
  {
    title: 'Recibes invitación',
    text: 'Recibirás un email, token o instrucciones para activar tu cuenta.'
  },
  {
    title: 'Inicias sesión',
    text: 'Entras con tu email y contraseña personal.'
  },
  {
    title: 'Consultas tu información',
    text: 'Verás solo tus citas, informes, documentos, facturas y mensajes.'
  }
] as const;

const SECURITY_ITEMS = [
  { icon: KeyRound, label: 'Acceso autenticado' },
  { icon: Eye, label: 'Datos privados' },
  { icon: UserCheck, label: 'Sin cruce entre pacientes' },
  { icon: Download, label: 'Descargas seguras' },
  { icon: Shield, label: 'Acciones trazables' },
  { icon: Sparkles, label: 'Conectado con tu clínica' }
] as const;

const FORGOT_HREF =
  '/contacto?tipo=soporte&mensaje=Necesito+recuperar+el+acceso+al+portal+del+paciente';

function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) el.classList.add('ppp-v2--visible');
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

export function PatientPortalPublicPage() {
  const [tab, setTab] = useState<AuthTab>('login');
  const [session, setSession] = useState<SessionUser | null>(null);
  const [checking, setChecking] = useState(true);
  const stepsRef = useReveal<HTMLElement>();

  useEffect(() => {
    void fetch('/api/auth/me', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((json: { data?: SessionUser } | null) => {
        const user = json?.data;
        if (user?.role === 'patient') setSession(user);
      })
      .catch(() => undefined)
      .finally(() => setChecking(false));
  }, []);

  return (
    <PublicSiteShell>
      <main className="ppp-v2">
        <section className="ppp-v2-hero" aria-labelledby="ppp-hero-title">
          <div className="ppp-v2-hero__bg" aria-hidden>
            <span className="ppp-v2-hero__glow" />
            <span className="ppp-v2-hero__dots" />
          </div>

          <div className="ppp-v2-hero__inner ps-shell ps-shell--wide">
            <aside className="ppp-v2-auth ppp-v2-auth--enter" aria-label="Acceso al portal del paciente">
              <div className="ppp-v2-auth__card">
                <span className="ppp-v2-auth__eyebrow">
                  <DentistaWebpLockup placement="header" context="patient" showWordmark={false} />
                  Portal del paciente
                </span>

                {checking ? (
                  <p className="ppp-v2-auth__hint">Comprobando sesión…</p>
                ) : session ? (
                  <div className="ppp-v2-auth__session">
                    <h2 className="ppp-v2-auth__title">Hola, {session.name.split(' ')[0]}</h2>
                    <p className="ppp-v2-auth__lead">
                      Tu sesión está activa. Entra a tu panel para consultar citas, informes, documentos y mensajes.
                    </p>
                    <a href="/paciente" className="ps-btn ps-btn--primary ps-btn--block">
                      Acceder a mi panel
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </a>
                    <p className="ppp-v2-auth__foot">
                      <button
                        type="button"
                        className="ppp-v2-auth__link"
                        onClick={() => {
                          void fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).then(() => {
                            window.location.href = '/portal-paciente';
                          });
                        }}
                      >
                        Cerrar sesión
                      </button>
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="ppp-v2-auth__tabs" role="tablist" aria-label="Acceso o registro">
                      <button
                        type="button"
                        role="tab"
                        aria-selected={tab === 'login'}
                        className={`ppp-v2-auth__tab${tab === 'login' ? ' ppp-v2-auth__tab--active' : ''}`}
                        onClick={() => setTab('login')}
                      >
                        Iniciar sesión
                      </button>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={tab === 'register'}
                        className={`ppp-v2-auth__tab${tab === 'register' ? ' ppp-v2-auth__tab--active' : ''}`}
                        onClick={() => setTab('register')}
                      >
                        Crear cuenta
                      </button>
                    </div>

                    {tab === 'login' ? (
                      <div className="ppp-v2-auth__panel" role="tabpanel">
                        <h2 className="ppp-v2-auth__title">Tu espacio de salud dental</h2>
                        <p className="ppp-v2-auth__lead">
                          Accede con el email y la contraseña que te proporcionó tu clínica o crea una cuenta si te
                          han invitado.
                        </p>
                        <LiveLoginForm
                          apiRole="patient"
                          variant="patient"
                          forgotPasswordHref={FORGOT_HREF}
                          loginErrorFallback="No se pudo iniciar sesión."
                        />
                      </div>
                    ) : (
                      <div className="ppp-v2-auth__panel" role="tabpanel">
                        <h2 className="ppp-v2-auth__title">Tu espacio de salud dental</h2>
                        <p className="ppp-v2-auth__lead">
                          Completa el formulario con el código o invitación que te envió tu clínica para activar tu
                          cuenta.
                        </p>
                        <PatientPortalRegisterForm />
                        <p className="ppp-v2-auth__foot">
                          ¿Ya tienes cuenta?{' '}
                          <button type="button" className="ppp-v2-auth__link" onClick={() => setTab('login')}>
                            Inicia sesión
                          </button>
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </aside>

            <div className="ppp-v2-hero__content">
              <p className="ppp-v2-hero__label ppp-v2-hero__label--enter">Portal del paciente</p>
              <h1 id="ppp-hero-title" className="ppp-v2-hero__title ppp-v2-hero__title--enter">
                Todo lo que tu clínica comparte contigo, en un solo lugar
              </h1>
              <p className="ppp-v2-hero__subtitle ppp-v2-hero__subtitle--enter">
                Accede de forma segura a tus citas, informes, documentos, facturas, pagos, mensajes y consentimientos
                desde tu espacio privado.
              </p>

              <ul className="ppp-v2-hero__trust ppp-v2-hero__trust--enter">
                {HERO_TRUST.map((label) => (
                  <li key={label}>
                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                    {label}
                  </li>
                ))}
              </ul>

              <div className="ppp-v2-hero__mockup-wrap">
                <PatientPortalPhoneMockup />
              </div>

              <div className="ppp-v2-hero__highlights">
                {BENEFITS.slice(0, 4).map((b, i) => {
                  const Icon = b.icon;
                  return (
                    <article
                      key={b.title}
                      className="ppp-v2-hero__highlight"
                      style={{ animationDelay: `${0.08 * i}s` }}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                      <strong>{b.title}</strong>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="ppp-v2-benefits ps-shell ps-shell--wide" aria-labelledby="ppp-benefits-title">
          <header className="ppp-v2-section-head">
            <h2 id="ppp-benefits-title">Qué puedes hacer desde tu portal</h2>
            <p>
              Tu clínica publica la información importante y tú la consultas cuando la necesites.
            </p>
          </header>

          <div className="ppp-v2-benefits__grid">
            {BENEFITS.map((b, i) => {
              const Icon = b.icon;
              return (
                <article
                  key={b.title}
                  className="ppp-v2-benefit"
                  style={{ animationDelay: `${0.05 * (i % 8)}s` }}
                >
                  <span className="ppp-v2-benefit__icon" aria-hidden>
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3>{b.title}</h3>
                  <p>{b.text}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section
          ref={stepsRef}
          className="ppp-v2-steps ps-shell ps-shell--wide ppp-v2-reveal"
          aria-labelledby="ppp-steps-title"
        >
          <header className="ppp-v2-section-head">
            <h2 id="ppp-steps-title">¿Primera vez aquí?</h2>
            <p>Tu clínica debe invitarte o darte acceso para poder entrar al portal.</p>
          </header>

          <ol className="ppp-v2-steps__list">
            {STEPS.map((step, i) => (
              <li key={step.title} className="ppp-v2-steps__item" style={{ transitionDelay: `${0.08 * i}s` }}>
                <span className="ppp-v2-steps__num">{i + 1}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="ppp-v2-steps__actions">
            <a href="/ayuda#portal-paciente" className="ps-btn ps-btn--primary">
              Guía del portal del paciente
            </a>
            <a href="/contacto?tipo=soporte&mensaje=Quiero+activar+mi+acceso+al+portal+del+paciente" className="ps-btn ps-btn--outline">
              Contactar con mi clínica
            </a>
          </div>
        </section>

        <section className="ppp-v2-security ps-shell ps-shell--wide" aria-labelledby="ppp-security-title">
          <header className="ppp-v2-security__head">
            <h2 id="ppp-security-title">Tu información, siempre protegida</h2>
          </header>
          <ul className="ppp-v2-security__list">
            {SECURITY_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.label}>
                  <Icon className="h-5 w-5" aria-hidden />
                  <span>{item.label}</span>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="ppp-v2-help ps-shell ps-shell--wide" aria-labelledby="ppp-help-title">
          <div className="ppp-v2-help__card">
            <h2 id="ppp-help-title">¿No puedes acceder?</h2>
            <p>
              Si tu email no funciona o no has recibido invitación, contacta con tu clínica para activar tu cuenta.
            </p>
            <div className="ppp-v2-help__actions">
              <a href="/contacto?tipo=soporte" className="ps-btn ps-btn--primary">
                Contactar soporte
              </a>
              <a href="/ayuda#portal-paciente" className="ps-btn ps-btn--outline ps-btn--on-teal">
                Ver ayuda del portal
              </a>
            </div>
          </div>
        </section>
      </main>
    </PublicSiteShell>
  );
}

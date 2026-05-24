import { useEffect, useState } from 'react';
import {
  ArrowRight,
  FileStack,
  FileText,
  Heart,
  Lock,
  MessageSquare,
  Receipt,
  ShieldCheck,
  UserPlus
} from 'lucide-react';
import { LiveLoginForm } from '@/components/auth/LiveLoginForm';
import type { SessionUser } from '@/lib/session';
import { PublicFooter } from './PublicFooter';
import { PublicHeader } from './PublicHeader';

type AuthTab = 'login' | 'register';

const PORTAL_FEATURES = [
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
    icon: MessageSquare,
    title: 'Mensajes',
    text: 'Comunícate con tu clínica de forma privada y trazable.'
  },
  {
    icon: ShieldCheck,
    title: 'Privacidad garantizada',
    text: 'Solo tú ves tu información. Datos aislados por clínica con acceso autenticado.'
  },
  {
    icon: Lock,
    title: 'Acceso seguro',
    text: 'Inicio de sesión protegido, activación por correo y contraseña personal.'
  }
] as const;

export function PatientPortalPublicPage() {
  const [tab, setTab] = useState<AuthTab>('login');
  const [session, setSession] = useState<SessionUser | null>(null);
  const [checking, setChecking] = useState(true);

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
    <>
      <PublicHeader activeHref="/portal-paciente" />
      <main className="ppp-page">
        <div className="ppp-layout">
          <aside className="ppp-auth" aria-label="Acceso al portal del paciente">
            <div className="ppp-auth__card">
              <span className="ppp-auth__eyebrow">
                <Heart className="h-3.5 w-3.5" aria-hidden />
                Portal del paciente
              </span>

              {checking ? (
                <p className="ppp-auth__hint">Comprobando sesión…</p>
              ) : session ? (
                <div className="ppp-auth__session">
                  <h1 className="ppp-auth__title">Hola, {session.name.split(' ')[0]}</h1>
                  <p className="ppp-auth__lead">
                    Tu sesión está activa. Entra a tu panel para gestionar documentos, informes, facturas y mensajes
                    con tu clínica.
                  </p>
                  <a href="/paciente" className="ps-btn ps-btn--primary ps-btn--block ppp-auth__panel-btn">
                    Acceder a mi panel
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </a>
                  <p className="ppp-auth__foot">
                  <button
                    type="button"
                    className="ppp-auth__link ppp-auth__logout"
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
                  <div className="ppp-auth__tabs" role="tablist" aria-label="Acceso o registro">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={tab === 'login'}
                      className={`ppp-auth__tab${tab === 'login' ? ' ppp-auth__tab--active' : ''}`}
                      onClick={() => setTab('login')}
                    >
                      Iniciar sesión
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={tab === 'register'}
                      className={`ppp-auth__tab${tab === 'register' ? ' ppp-auth__tab--active' : ''}`}
                      onClick={() => setTab('register')}
                    >
                      Crear cuenta
                    </button>
                  </div>

                  {tab === 'login' ? (
                    <div className="ppp-auth__panel" role="tabpanel">
                      <h1 className="ppp-auth__title">Tu espacio de salud dental</h1>
                      <p className="ppp-auth__lead">
                        Accede con el email y contraseña que te proporcionó tu clínica o los que definiste al
                        registrarte.
                      </p>
                      <LiveLoginForm apiRole="patient" variant="patient" />
                    </div>
                  ) : (
                    <div className="ppp-auth__panel" role="tabpanel">
                      <h1 className="ppp-auth__title">Regístrate como paciente</h1>
                      <p className="ppp-auth__lead">
                        Crea tu cuenta vinculada a tu clínica. Tras el registro recibirás un correo para activar el
                        acceso.
                      </p>
                      <ul className="ppp-auth__steps">
                        <li>
                          <strong>1.</strong> Completa tus datos y elige clínica
                        </li>
                        <li>
                          <strong>2.</strong> Activa la cuenta desde el correo
                        </li>
                        <li>
                          <strong>3.</strong> Entra aquí e inicia sesión
                        </li>
                      </ul>
                      <a href="/registro-paciente" className="ps-btn ps-btn--primary ps-btn--block">
                        <UserPlus className="h-4 w-4" aria-hidden />
                        Ir al registro
                      </a>
                      <p className="ppp-auth__foot">
                        ¿Ya tienes cuenta?{' '}
                        <button type="button" className="ppp-auth__link" onClick={() => setTab('login')}>
                          Inicia sesión
                        </button>
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </aside>

          <section className="ppp-showcase" aria-labelledby="ppp-showcase-title">
            <header className="ppp-showcase__head">
              <span className="ps-kicker">Espacio privado</span>
              <h2 id="ppp-showcase-title">Todo lo que tu clínica comparte contigo, en un solo lugar</h2>
              <p>
                Dentista+ conecta tu consulta con un portal seguro. Desde aquí accedes a la gestión personal que solo
                tú puedes ver: informes, documentos, facturación y comunicación clínica.
              </p>
            </header>

            <div className="ppp-showcase__visual">
              <img
                src="/images/guides/mobile/pdp-inicio.png"
                alt="Vista del portal del paciente en móvil con accesos a informes y documentos"
                width={420}
                height={860}
                loading="eager"
                decoding="async"
              />
              <div className="ppp-showcase__badge">
                <ShieldCheck className="h-4 w-4" aria-hidden />
                Datos protegidos · solo tú
              </div>
            </div>

            <div className="ppp-features">
              {PORTAL_FEATURES.map((f) => {
                const Icon = f.icon;
                return (
                  <article key={f.title} className="ppp-feature">
                    <span className="ppp-feature__icon" aria-hidden>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <h3>{f.title}</h3>
                      <p>{f.text}</p>
                    </div>
                  </article>
                );
              })}
            </div>

            <aside className="ppp-trust">
              <h3>¿Primera vez aquí?</h3>
              <p>
                Si tu clínica ya usa Dentista+, regístrate con el enlace de la izquierda o solicita acceso en
                recepción. Una vez activada tu cuenta, vuelve a esta página para entrar.
              </p>
              <a href="/ayuda#portal-paciente" className="ps-btn ps-btn--outline">
                Guía del portal del paciente
              </a>
            </aside>
          </section>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}

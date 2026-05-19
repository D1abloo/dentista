import { useEffect, useState } from 'react';
import { ArrowRight, Building2, CalendarPlus, FileStack, Shield, UserRound } from 'lucide-react';
import { PublicFooter } from './PublicFooter';
import { PublicHeader } from './PublicHeader';
import { CookieBanner } from './CookieBanner';

export function LandingPage() {
  const [loggedOut, setLoggedOut] = useState(false);

  useEffect(() => {
    setLoggedOut(new URLSearchParams(window.location.search).get('logged_out') === '1');
  }, []);

  return (
    <>
      <PublicHeader />
      <main>
        {loggedOut ? (
          <div className="shell pt-4">
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
              Sesión cerrada. Elige <strong>Portal paciente</strong> o <strong>Panel admin</strong> en el menú para
              volver a entrar.
            </p>
          </div>
        ) : null}
        <section className="hero shell">
          <div className="hero__grid">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--teal)]">Dentista+</p>
              <h1>Gestión de citas odontológicas, sin fricción</h1>
              <p className="hero__lead">
                Reserva, administra y conecta informes, documentos, facturas y pagos. Multi-clínica con datos
                aislados para cada clínica y un portal global para cada paciente.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="/reserva" className="btn btn--primary">
                  <CalendarPlus className="h-4 w-4" /> Reservar cita
                </a>
                <a href="/login" className="btn btn--secondary">
                  Elegir portal <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>
            <div className="hero__img">
              <img src="/images/login-dentista-paciente.jpg" alt="Paciente y dentista en consulta" loading="eager" />
            </div>
          </div>
        </section>

        <section id="servicios" className="section section--alt">
          <div className="shell">
            <h2 className="section__title">Gestión de citas odontológicas</h2>
            <div className="feature-grid feature-grid--3">
              <article className="feature-card">
                <CalendarPlus className="h-8 w-8 text-[var(--blue)]" />
                <h3>Agenda inteligente</h3>
                <p>Vistas día, semana y mes. Bloqueos, confirmaciones y reprogramación con validación de huecos.</p>
              </article>
              <article className="feature-card">
                <FileStack className="h-8 w-8 text-[var(--purple)]" />
                <h3>Informes y documentos</h3>
                <p>PDF clínicos, radiografías y consentimientos con visibilidad controlada hacia el paciente.</p>
              </article>
              <article className="feature-card">
                <Shield className="h-8 w-8 text-[var(--teal)]" />
                <h3>Facturas y pagos</h3>
                <p>Facturación demo, estados pendiente/pagada y recibos vinculados por ID de paciente.</p>
              </article>
            </div>
          </div>
        </section>

        <section id="portal" className="section shell">
          <h2 className="section__title">Portal del paciente</h2>
          <div className="feature-grid">
            <article className="feature-card">
              <UserRound className="h-8 w-8 text-[var(--teal)]" />
              <h3>Todo en un solo lugar</h3>
              <p>
                Aunque visites varias clínicas, tu portal agrupa citas, informes, facturas y pagos por tu ID de
                paciente (PAT-XXXX).
              </p>
              <a href="/login/paciente" className="btn btn--teal btn--sm mt-4">
                Ver portal paciente
              </a>
            </article>
            <article className="feature-card">
              <Building2 className="h-8 w-8 text-[var(--blue)]" />
              <h3>Panel administrativo</h3>
              <p>
                Cada clínica gestiona solo sus registros (TEN-XXXX). Los administradores no ven datos de otras
                clínicas.
              </p>
              <a href="/login/admin" className="btn btn--secondary btn--sm mt-4">
                Acceso clínica
              </a>
            </article>
          </div>
        </section>

        <section id="admin" className="section section--alt">
          <div className="shell highlight-panel">
            <h2>Multi-clínica sin mezclar datos</h2>
            <p>
              Clínica Centro, Norte y Sur operan en paneles aislados. La paciente Elena (PAT-0001) ve sus citas en
              Centro y Norte; ninguna clínica ve los registros de la otra.
            </p>
          </div>
        </section>

        <section className="section shell">
          <h2 className="section__title">Normativa y confianza</h2>
          <p className="max-w-2xl text-[var(--muted)]">
            Políticas de cancelación, consentimiento, protección de datos y avisos legales editables por clínica en
            modo demo. En producción, Supabase RLS refuerza el aislamiento por tenant.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="/privacidad" className="btn btn--ghost btn--sm">
              Privacidad
            </a>
            <a href="/terminos" className="btn btn--ghost btn--sm">
              Términos
            </a>
            <a href="/cookies" className="btn btn--ghost btn--sm">
              Cookies
            </a>
          </div>
        </section>
      </main>
      <PublicFooter />
      <CookieBanner />
    </>
  );
}

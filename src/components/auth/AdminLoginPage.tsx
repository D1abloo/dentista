import { useState } from 'react';
import { Building2, ChevronRight } from 'lucide-react';
import { LogoMark } from '@/components/brand/Logo';
import { isClientDemoMode } from '@/lib/appMode';
import { signInAs } from '@/lib/demoAuth';
import { DEMO_TENANTS } from '@/lib/tenantIds';
import { LiveLoginForm } from './LiveLoginForm';

const HERO_IMAGE = '/images/login-dentista-paciente.jpg';

export function AdminLoginPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const demo = isClientDemoMode();

  async function enterDemo(tenantId: string) {
    setLoading(tenantId);
    const path = await signInAs('admin', { tenantId, ephemeral: false });
    window.location.href = path;
  }

  return (
    <main className="login-admin">
      <section className="login-admin__hero" aria-label="Ilustración clínica">
        <img
          src={HERO_IMAGE}
          alt="Dentista profesional atendiendo a un paciente en consulta"
          className="login-admin__hero-img"
          loading="eager"
          decoding="async"
        />
        <div className="login-admin__hero-shade" aria-hidden />
        <div className="login-admin__hero-copy">
          <p className="login-admin__hero-kicker">Panel clínica · Dentista+</p>
          <h2 className="login-admin__hero-title">Gestiona citas, pacientes y facturación en un solo lugar</h2>
          <p className="login-admin__hero-text">
            Acceso exclusivo para el equipo de la clínica. Datos aislados por sede y sesión protegida.
          </p>
        </div>
      </section>

      <section className="login-admin__panel">
        <div className="login-admin__card">
          <header className="login-admin__head">
            <LogoMark size={48} />
            <div>
              <p className="login-admin__eyebrow">Administración</p>
              <h1 className="login-admin__title">Acceso clínica</h1>
              <p className="login-admin__lead">
                {demo
                  ? 'Selecciona la sede que vas a gestionar hoy.'
                  : 'Introduce tus credenciales para entrar al panel.'}
              </p>
            </div>
          </header>

          {demo ? (
            <ul className="login-admin__tenants">
              {DEMO_TENANTS.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    className="login-admin__tenant"
                    disabled={!!loading}
                    onClick={() => enterDemo(t.id)}
                  >
                    <span className="login-admin__tenant-icon" aria-hidden>
                      <Building2 className="h-5 w-5" />
                    </span>
                    <span className="login-admin__tenant-body">
                      <span className="login-admin__tenant-name">{t.label}</span>
                      <span className="login-admin__tenant-id">{t.id}</span>
                    </span>
                    <span className="login-admin__tenant-action">
                      {loading === t.id ? 'Entrando…' : 'Entrar'}
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <LiveLoginForm apiRole="admin" variant="admin" />
          )}

          <footer className="login-admin__foot">
            <a href="/login/paciente">Portal paciente</a>
            <span aria-hidden>·</span>
            <a href="/">Volver al inicio</a>
          </footer>
        </div>
      </section>
    </main>
  );
}

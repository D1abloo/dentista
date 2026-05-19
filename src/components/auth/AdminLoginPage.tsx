import { useState } from 'react';
import { LogoMark } from '@/components/brand/Logo';
import { isClientDemoMode } from '@/lib/appMode';
import { signInAs } from '@/lib/demoAuth';
import { DEMO_TENANTS } from '@/lib/tenantIds';
import { LiveLoginForm } from './LiveLoginForm';

export function AdminLoginPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const demo = isClientDemoMode();

  async function enterDemo(tenantId: string) {
    setLoading(tenantId);
    const path = await signInAs('admin', { tenantId, ephemeral: false });
    window.location.href = path;
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-900 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white p-8 shadow-[var(--shadow-lg)]">
        <div className="flex flex-col items-center text-center">
          <LogoMark size={52} />
          <p className="mt-4 text-xs font-bold uppercase tracking-wide text-[var(--blue)]">Panel administrativo</p>
          <h1 className="mt-2 font-[family-name:var(--display)] text-2xl text-[var(--navy)]">Acceso clínica</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {demo
              ? 'Modo demo: elige la sede (TEN-XXXX).'
              : 'Modo LIVE: inicia sesión con email y contraseña de administrador.'}
          </p>
        </div>

        {demo ? (
          <div className="mt-6 space-y-3">
            {DEMO_TENANTS.map((t) => (
              <button
                key={t.id}
                type="button"
                className="btn btn--secondary w-full text-left"
                disabled={!!loading}
                onClick={() => enterDemo(t.id)}
              >
                <span className="block font-bold">{t.label}</span>
                <span className="block font-mono text-xs text-[var(--muted)]">{t.id}</span>
                {loading === t.id ? ' · Entrando…' : null}
              </button>
            ))}
          </div>
        ) : (
          <LiveLoginForm apiRole="admin" />
        )}

        <p className="mt-6 text-center text-xs text-[var(--muted)]">
          <a href="/login/paciente" className="font-semibold text-[var(--teal)] underline">
            Portal paciente
          </a>
          {' · '}
          <a href="/" className="font-semibold text-[var(--blue)] underline">
            Inicio
          </a>
        </p>
      </div>
    </main>
  );
}

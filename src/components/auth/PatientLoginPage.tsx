import { useState } from 'react';
import { LogoMark } from '@/components/brand/Logo';
import { isClientDemoMode } from '@/lib/appMode';
import { signInAs } from '@/lib/demoAuth';
import { DEMO_PATIENT_LOGIN_ID } from '@/data/demoData';
import { LiveLoginForm } from './LiveLoginForm';

const PATIENT_LABEL = 'María González (PAT-0001)';

export function PatientLoginPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const demo = isClientDemoMode();

  async function enterDemo(ephemeral: boolean) {
    const key = ephemeral ? 'ephemeral' : 'save';
    setLoading(key);
    const path = await signInAs('paciente', { ephemeral });
    window.location.href = path;
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[var(--bg)] px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-white p-8 shadow-[var(--shadow-lg)]">
        <div className="flex flex-col items-center text-center">
          <LogoMark size={52} />
          <p className="mt-4 text-xs font-bold uppercase tracking-wide text-[var(--teal)]">Portal del paciente</p>
          <h1 className="mt-2 font-[family-name:var(--display)] text-2xl text-[var(--navy)]">Acceso paciente</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {demo ? (
              <>
                Usuario demo: <strong>{PATIENT_LABEL}</strong> · <span className="font-mono">{DEMO_PATIENT_LOGIN_ID}</span>
              </>
            ) : (
              'Modo LIVE: inicia sesión con email y contraseña de paciente.'
            )}
          </p>
        </div>

        {demo ? (
          <div className="mt-6 space-y-3">
            <button
              type="button"
              className="btn btn--teal w-full"
              disabled={!!loading}
              onClick={() => enterDemo(true)}
            >
              {loading === 'ephemeral' ? 'Entrando…' : 'Entrar en modo prueba (sin guardar)'}
            </button>
            <button
              type="button"
              className="btn btn--secondary w-full"
              disabled={!!loading}
              onClick={() => enterDemo(false)}
            >
              {loading === 'save' ? 'Entrando…' : 'Entrar con datos guardados'}
            </button>
          </div>
        ) : (
          <LiveLoginForm apiRole="patient" />
        )}

        <p className="mt-6 text-center text-xs text-[var(--muted)]">
          <a href="/login/admin" className="font-semibold text-[var(--blue)] underline">
            Panel administrativo
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

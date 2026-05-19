import { useEffect } from 'react';
import { LogoMark } from '@/components/brand/Logo';
import { DEMO_TENANTS } from '@/lib/tenantIds';
import { DEMO_PATIENT_LOGIN_ID } from '@/data/demoData';

/** Selector de portal — sin auto-login; cada portal tiene su ruta. */
export function LoginPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const role = params.get('role');
    if (role === 'admin') {
      const tenant = params.get('tenant');
      window.location.replace(tenant ? `/login/admin?tenant=${tenant}` : '/login/admin');
      return;
    }
    if (role === 'paciente') {
      window.location.replace('/login/paciente');
    }
  }, []);

  return (
    <main className="grid min-h-screen place-items-center bg-[var(--bg)] px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-white p-8 shadow-[var(--shadow-lg)]">
        <div className="flex flex-col items-center text-center">
          <LogoMark size={52} />
          <h1 className="mt-4 font-[family-name:var(--display)] text-2xl text-[var(--navy)]">Elegir portal</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Paciente y administración son sesiones distintas. Elige dónde quieres entrar.
          </p>
        </div>

        <a
          href="/login/paciente"
          className="mt-8 flex flex-col rounded-2xl border border-teal-200 bg-teal-50 p-5 no-underline transition hover:border-teal-300"
        >
          <span className="text-xs font-bold uppercase tracking-wide text-teal-800">Portal paciente</span>
          <span className="mt-1 font-[family-name:var(--display)] text-lg text-[var(--navy)]">Elena Vidal Romero</span>
          <span className="mt-1 font-mono text-xs text-teal-900">{DEMO_PATIENT_LOGIN_ID}</span>
          <span className="mt-3 text-sm font-semibold text-teal-800">Continuar como paciente →</span>
        </a>

        <a
          href="/login/admin"
          className="mt-4 flex flex-col rounded-2xl border border-blue-200 bg-blue-50 p-5 no-underline transition hover:border-blue-300"
        >
          <span className="text-xs font-bold uppercase tracking-wide text-blue-800">Panel clínica</span>
          <span className="mt-1 text-sm text-blue-950">
            Administrador demo · {DEMO_TENANTS.map((t) => t.label).join(', ')}
          </span>
          <span className="mt-3 text-sm font-semibold text-blue-800">Continuar como administración →</span>
        </a>

        <p className="mt-6 text-center text-xs text-[var(--muted)]">
          <a href="/" className="font-semibold text-[var(--blue)] underline">
            Volver al inicio
          </a>
        </p>
      </div>
    </main>
  );
}

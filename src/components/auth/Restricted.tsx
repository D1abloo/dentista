import type { DemoRole } from '@/types/demo';
import { Button } from '@/components/ui';
import { clearDemoSession } from '@/lib/demoStore';
import { loginPath } from '@/lib/loginIntent';
import { DEMO_TENANTS } from '@/lib/tenantIds';
import { DEMO_PATIENT_LOGIN_ID } from '@/data/demoData';

function goToLogin(href: string) {
  clearDemoSession();
  window.location.href = href;
}

export function Restricted({
  expected,
  current,
  live = false
}: {
  expected: DemoRole;
  current: DemoRole | null;
  live?: boolean;
}) {
  const loginHref = loginPath(expected);

  if (expected === 'admin') {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-10">
        <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-premium ring-1 ring-slate-100">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--blue)]">Panel administrativo</p>
          <h1 className="mt-2 font-display text-2xl text-dental-950">Acceso solo para clínica</h1>
          <p className="mt-3 text-sm text-slate-600">
            {current === 'paciente'
              ? 'Tienes sesión de paciente. Ciérrala y entra como administrador.'
              : live
                ? 'Inicia sesión con email y contraseña de administrador.'
                : 'Necesitas un usuario administrador (demo).'}
          </p>
          {!live ? (
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              {DEMO_TENANTS.map((t) => (
                <li key={t.id} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
                  <span className="font-mono text-xs text-slate-500">{t.id}</span>
                  <span className="font-semibold">{t.label}</span>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-2">
            <Button type="button" onClick={() => goToLogin(loginHref)}>
              Ir al login de clínica
            </Button>
            <a href="/">
              <Button tone="secondary">Volver al inicio</Button>
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-premium ring-1 ring-slate-100">
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--teal)]">Portal del paciente</p>
        <h1 className="mt-2 font-display text-2xl text-dental-950">Acceso solo para pacientes</h1>
        <p className="mt-3 text-sm text-slate-600">
          {current === 'admin'
            ? 'Tienes sesión de administrador. Ciérrala y entra como paciente.'
            : live
              ? 'Inicia sesión con email y contraseña de paciente.'
              : 'Necesitas iniciar sesión como paciente.'}
        </p>
        {!live ? (
          <p className="mt-3 rounded-xl bg-[#f0fdfa] px-3 py-2 text-sm font-semibold text-dental-900">
            Usuario demo: María González · <span className="font-mono">{DEMO_PATIENT_LOGIN_ID}</span>
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-2">
          <Button type="button" onClick={() => goToLogin(loginHref)}>
            Ir al login de paciente
          </Button>
          <a href="/">
            <Button tone="secondary">Volver al inicio</Button>
          </a>
        </div>
      </div>
    </main>
  );
}

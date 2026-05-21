import type { DemoRole } from '@/types/demo';
import { Button } from '@/components/ui';
import { clearDemoSession } from '@/lib/demoStore';
import { loginPath } from '@/lib/loginIntent';

function goToLogin(href: string) {
  clearDemoSession();
  window.location.href = href;
}

export function Restricted({
  expected,
  current
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
              : 'Inicia sesión con email y contraseña de administrador.'}
          </p>
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
            ? 'Tienes sesión de administrador. Usa un token de acceso autorizado o cierra sesión e inicia como paciente.'
            : 'Inicia sesión con email y contraseña de paciente, o solicita un token en administración.'}
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button type="button" onClick={() => goToLogin(loginHref)}>
            Ir al login de paciente
          </Button>
          <a href="/paciente/acceso" className="no-underline">
            <Button tone="secondary">Acceso con token</Button>
          </a>
          <a href="/">
            <Button tone="secondary">Volver al inicio</Button>
          </a>
        </div>
      </div>
    </main>
  );
}

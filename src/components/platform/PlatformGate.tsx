import { useEffect, useState, type ReactNode } from 'react';
const REDIRECT_GUARD = 'df_platform_login_redirect';

type CheckPayload = {
  allowed?: boolean;
  email?: string;
};

function loginHref(): string {
  const next = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
  return `/platform/login?next=${next}`;
}

export function PlatformGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<'loading' | 'ok' | 'login'>('loading');

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch('/api/auth/platform-check', {
          credentials: 'include',
          cache: 'no-store'
        });
        if (cancelled) return;

        const json = (await res.json()) as { data?: CheckPayload };
        if (json.data?.allowed) {
          try {
            sessionStorage.removeItem(REDIRECT_GUARD);
          } catch {
            /* ignore */
          }
          setState('ok');
          return;
        }

        const guard = sessionStorage.getItem(REDIRECT_GUARD);
        if (!guard) {
          try {
            sessionStorage.setItem(REDIRECT_GUARD, '1');
          } catch {
            /* ignore */
          }
          window.location.replace(loginHref());
          return;
        }

        setState('login');
      } catch {
        if (!cancelled) setState('login');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (state === 'loading') {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 text-sm font-bold text-[var(--ink)]">
        Cargando panel de plataforma…
      </main>
    );
  }

  if (state === 'login') {
    const href = loginHref();

    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 p-6 text-center">
        <div className="max-w-md rounded-2xl bg-white p-8 shadow-premium ring-1 ring-slate-100">
          <h1 className="font-display text-xl text-dental-950">Sesión de plataforma requerida</h1>
          <p className="mt-3 text-sm text-slate-600">
            Inicia sesión como Super Admin para acceder al panel. Si acabas de entrar y ves este mensaje,
            borra cookies del sitio o usa una ventana privada.
          </p>
          <a href={href} className="btn btn--primary btn--sm mt-6 inline-flex no-underline">
            Ir al acceso de plataforma
          </a>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}

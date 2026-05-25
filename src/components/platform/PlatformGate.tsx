import { useEffect, useState, type ReactNode } from 'react';
import type { SessionUser } from '@/lib/auth';
import { canAccessPlatformPanel } from '@/lib/auth/sessionPortal';

type MePayload = {
  role?: string;
  baseRole?: SessionUser['role'];
};

export function PlatformGate({ children }: { children: ReactNode }) {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' });
        if (cancelled) return;

        if (!res.ok) {
          const next = encodeURIComponent(
            `${window.location.pathname}${window.location.search}`
          );
          window.location.replace(`/platform/login?next=${next}`);
          return;
        }

        const json = (await res.json()) as { data?: MePayload };
        const data = json.data;

        if (!canAccessPlatformPanel({ role: data?.role, baseRole: data?.baseRole })) {
          window.location.replace('/platform/login');
          return;
        }

        if (!cancelled) setAllowed(true);
      } catch {
        if (!cancelled) {
          window.location.replace('/platform/login');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!allowed) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 text-sm font-bold text-[var(--ink)]">
        Cargando panel de plataforma…
      </main>
    );
  }

  return <>{children}</>;
}

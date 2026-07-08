import { useEffect, useState, type ReactNode } from 'react';
import { AppLoader } from '@/components/ui/AppLoader';

type SessionRole = string | null;

export function PlatformGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [role, setRole] = useState<SessionRole>(null);

  useEffect(() => {
    if (ready && role !== 'super_admin') {
      window.location.replace('/platform/login');
    }
  }, [ready, role]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (!res.ok) {
          if (!cancelled) {
            setRole(null);
            setReady(true);
          }
          return;
        }
        const json = (await res.json()) as { data?: { role?: string; baseRole?: string } };
        if (!cancelled) {
          setRole(json.data?.baseRole ?? json.data?.role ?? null);
          setReady(true);
        }
      } catch {
        if (!cancelled) {
          setRole(null);
          setReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return <AppLoader label="Cargando panel de plataforma…" fullscreen />;
  }

  if (role !== 'super_admin') {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 p-6 text-center text-sm text-[var(--muted)]">
        Redirigiendo al acceso de plataforma…
      </main>
    );
  }

  return <>{children}</>;
}

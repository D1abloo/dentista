import { useEffect, useState, type ReactNode } from 'react';
import { homePathForPortal, inferSessionPortal, type SessionPortal } from '@/lib/auth/sessionPortal';

type MePayload = {
  role?: string;
  sessionPortal?: SessionPortal;
  platformInspect?: boolean;
  clinicId?: string;
};

export function PlatformGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [me, setMe] = useState<MePayload | null>(null);

  useEffect(() => {
    if (!ready || !me) return;
    if (me.role !== 'super_admin') {
      window.location.replace('/platform/login');
      return;
    }
    const portal = inferSessionPortal({
      role: me.role,
      clinicId: me.clinicId,
      platformInspect: me.platformInspect,
      sessionPortal: me.sessionPortal
    });
    if (portal === 'clinic' && !me.platformInspect) {
      window.location.replace(homePathForPortal('clinic', me.clinicId));
    }
    if (portal === 'patient') {
      window.location.replace('/paciente');
    }
  }, [ready, me]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (!res.ok) {
          if (!cancelled) {
            setMe(null);
            setReady(true);
          }
          return;
        }
        const json = (await res.json()) as { data?: MePayload };
        if (!cancelled) {
          setMe(json.data ?? null);
          setReady(true);
        }
      } catch {
        if (!cancelled) {
          setMe(null);
          setReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 text-sm font-bold text-[var(--ink)]">
        Cargando panel de plataforma…
      </main>
    );
  }

  if (me?.role !== 'super_admin') {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 p-6 text-center text-sm text-[var(--muted)]">
        Redirigiendo al acceso de plataforma…
      </main>
    );
  }

  const portal = me
    ? inferSessionPortal({
        role: me.role,
        clinicId: me.clinicId,
        platformInspect: me.platformInspect,
        sessionPortal: me.sessionPortal
      })
    : null;
  if (portal === 'clinic' && !me?.platformInspect) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 p-6 text-center text-sm text-[var(--muted)]">
        Redirigiendo al panel de clínica…
      </main>
    );
  }

  return <>{children}</>;
}

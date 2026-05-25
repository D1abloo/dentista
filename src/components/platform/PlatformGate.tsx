import { useEffect, useState, type ReactNode } from 'react';
import type { SessionUser } from '@/lib/auth';
import {
  canAccessPlatformPanelFromSession,
  homePathForPortal,
  inferSessionPortal,
  type SessionPortal
} from '@/lib/auth/sessionPortal';

type MePayload = {
  role?: string;
  baseRole?: SessionUser['role'];
  sessionPortal?: SessionPortal;
  platformInspect?: boolean;
  clinicId?: string;
};

function redirectForMe(me: MePayload): string | null {
  if (!canAccessPlatformPanelFromSession({
    role: me.role as SessionUser['role'] | undefined,
    baseRole: me.baseRole,
    sessionPortal: me.sessionPortal,
    platformInspect: me.platformInspect
  })) {
    const portal = inferSessionPortal({
      role: me.baseRole ?? me.role ?? '',
      sessionPortal: me.sessionPortal,
      platformInspect: false
    });
    if (portal === 'clinic') return homePathForPortal('clinic', me.clinicId);
    if (portal === 'patient') return '/paciente';
    return '/platform/login';
  }
  return null;
}

export function PlatformGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [me, setMe] = useState<MePayload | null>(null);

  useEffect(() => {
    if (!ready || !me) return;
    const dest = redirectForMe(me);
    if (dest) window.location.replace(dest);
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

  if (!me || redirectForMe(me)) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 p-6 text-center text-sm text-[var(--muted)]">
        Redirigiendo al acceso de plataforma…
      </main>
    );
  }

  return <>{children}</>;
}

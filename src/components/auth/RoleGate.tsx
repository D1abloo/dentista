import { useEffect, useState, type ReactNode } from 'react';
import { isClientDemoMode } from '@/lib/appMode';
import { clearDemoRoleHints } from '@/lib/demoStore';
import { logoutSession } from '@/lib/session';
import { Restricted } from './Restricted';
import type { DemoRole } from '@/types/demo';

type MeUser = {
  role: string;
  platformInspect?: boolean;
  inspectMode?: string;
};

function mapMeToPortalRole(data: MeUser): DemoRole | null {
  if (data.role === 'patient') return 'paciente';
  if (data.role === 'admin' || data.role === 'super_admin') return 'admin';
  return null;
}

export function RoleGate({ role, children }: { role: DemoRole; children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [current, setCurrent] = useState<DemoRole | null>(null);
  const live = isClientDemoMode() === false;

  useEffect(() => {
    let cancelled = false;

    const sync = async () => {
      if (live) clearDemoRoleHints();
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (!res.ok) {
          if (!cancelled) {
            setCurrent(null);
            setReady(true);
          }
          return;
        }
        const json = (await res.json()) as { data?: MeUser };
        const data = json.data;
        if (!cancelled) {
          setCurrent(data ? mapMeToPortalRole(data) : null);
          setReady(true);
        }
      } catch {
        if (!cancelled) {
          setCurrent(null);
          setReady(true);
        }
      }
    };

    void sync();

    const onStorage = () => void sync();
    const onFocus = () => void sync();
    window.addEventListener('storage', onStorage);
    if (live) window.addEventListener('focus', onFocus);

    return () => {
      cancelled = true;
      window.removeEventListener('storage', onStorage);
      if (live) window.removeEventListener('focus', onFocus);
    };
  }, [live]);

  if (!ready) {
    const label = role === 'admin' ? 'clínica' : 'paciente';
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 text-sm font-bold text-dental-800">
        Cargando portal {label}…
      </main>
    );
  }

  if (current !== role) {
    return <Restricted expected={role} current={current} live={live} />;
  }

  return <>{children}</>;
}

export function useLogout() {
  return () => {
    void fetch('/api/platform/inspect', {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: '{}'
    }).finally(() =>
      logoutSession().finally(() => {
        if (typeof window !== 'undefined' && 'caches' in window) {
          void caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))));
        }
        window.location.replace('/?logged_out=1');
      })
    );
  };
}

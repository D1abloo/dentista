import { useEffect, useState, type ReactNode } from 'react';
import { isClientDemoMode } from '@/lib/appMode';
import { clearDemoSession } from '@/lib/demoStore';
import { logoutSession, resolvePortalRole } from '@/lib/session';
import { Restricted } from './Restricted';
import type { DemoRole } from '@/types/demo';

export function RoleGate({ role, children }: { role: DemoRole; children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [current, setCurrent] = useState<DemoRole | null>(null);
  const live = isClientDemoMode() === false;

  useEffect(() => {
    let cancelled = false;

    const sync = async () => {
      if (live) clearDemoSession();
      const resolved = await resolvePortalRole();
      if (!cancelled) {
        setCurrent(resolved);
        setReady(true);
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
    void logoutSession().finally(() => {
      window.location.replace('/?logged_out=1');
    });
  };
}

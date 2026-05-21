import { useEffect, useState, type ReactNode } from 'react';
import { clearDemoSession } from '@/lib/demoStore';
import { resolvePortalRole } from '@/lib/session';
import { Restricted } from './Restricted';
import type { DemoRole } from '@/types/demo';

export function PatientPortalGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [staffView, setStaffView] = useState(false);
  const [current, setCurrent] = useState<DemoRole | null>(null);

  useEffect(() => {
    let cancelled = false;
    const sync = async () => {
      clearDemoSession();
      try {
        const pdpRes = await fetch('/api/portal-access/me', { credentials: 'include' });
        const pdpJson = (await pdpRes.json()) as { data?: { active?: boolean } };
        if (!cancelled && pdpRes.ok && pdpJson.data?.active) {
          setStaffView(true);
          setCurrent('admin');
          setReady(true);
          return;
        }
      } catch {
        /* ignore */
      }
      const resolved = await resolvePortalRole();
      if (!cancelled) {
        setStaffView(false);
        setCurrent(resolved);
        setReady(true);
      }
    };
    void sync();
    const onFocus = () => void sync();
    window.addEventListener('focus', onFocus);
    return () => {
      cancelled = true;
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  if (!ready) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 text-sm font-bold text-dental-800">
        Cargando portal del paciente…
      </main>
    );
  }

  if (staffView) return <>{children}</>;

  if (current !== 'paciente') {
    return <Restricted expected="paciente" current={current} live />;
  }

  return <>{children}</>;
}

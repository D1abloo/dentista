import { useEffect } from 'react';
import { useDemoStore } from '@/hooks/useDemoStore';
import { isClientLiveMode } from '@/lib/appMode';

const POLL_MS = 20_000;

/** Refresco periódico del bootstrap en el panel admin (citas, bloqueos, tratamientos). */
export function useAdminLiveRefresh(enabled: boolean) {
  const { refresh } = useDemoStore();

  useEffect(() => {
    if (!enabled || !isClientLiveMode()) return;
    const tick = () => {
      void refresh();
    };
    const id = window.setInterval(tick, POLL_MS);
    return () => window.clearInterval(id);
  }, [enabled, refresh]);
}

import type { ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { useDemoStore } from '@/hooks/useDemoStore';

export function PatientPortalStatus({ children }: { children: ReactNode }) {
  const { dataSource, reset } = useDemoStore();

  if (dataSource === 'loading') {
    return (
      <div className="pdp-status pdp-status--loading" role="status" aria-live="polite">
        <span>Cargando tu portal…</span>
        <div className="pdp-skeleton w-full max-w-md" style={{ minHeight: '2.5rem' }} />
        <div className="pdp-skeleton w-full" style={{ minHeight: '12rem', marginTop: '0.75rem' }} />
      </div>
    );
  }

  if (dataSource === 'empty') {
    return (
      <div className="pdp-status pdp-status--error" role="alert">
        <span>No se pudieron cargar los datos.</span>
        <button type="button" className="ph-btn ph-btn--outline" onClick={() => void reset()}>
          <RefreshCw className="inline h-3.5 w-3.5 mr-1" aria-hidden />
          Reintentar
        </button>
      </div>
    );
  }

  return <>{children}</>;
}

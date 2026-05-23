import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';
import { createEmptyDemoState } from '@/lib/emptyState';
import { fetchClinicBootstrap } from '@/lib/clinicApi';
import * as store from '@/lib/demoStore';
import { applyPatientPortalOverlay, savePatientPortalOverlay } from '@/lib/patient/portalOverlay';
import { STORAGE_PATIENT_ID, STORAGE_TENANT_ID } from '@/lib/storage/keys';
import type { DemoState } from '@/types/demo';

type DataSource = 'supabase' | 'loading' | 'empty';

type Ctx = {
  state: DemoState;
  dataSource: DataSource;
  syncing: boolean;
  ephemeral: boolean;
  setState: (updater: DemoState | ((prev: DemoState) => DemoState)) => void;
  commit: (next: DemoState) => void;
  reset: () => void;
  refresh: () => Promise<void>;
};

export const DemoStoreContext = createContext<Ctx | null>(null);

export function DemoStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>(() => createEmptyDemoState());
  const [dataSource, setDataSource] = useState<DataSource>('loading');
  const [syncing] = useState(false);

  const loadBootstrap = useCallback(async () => {
    store.clearDemoRoleHints();
    setDataSource('loading');
    try {
      const res = await fetch('/api/clinic/bootstrap', { credentials: 'include' });
      const json = (await res.json()) as {
        data?: { state?: DemoState; tenantId?: string; patientId?: string };
        error?: { message?: string };
      };
      if (res.ok && json.data?.state) {
        const sessionPatientId = json.data.patientId ?? null;
        if (sessionPatientId) {
          localStorage.setItem(STORAGE_PATIENT_ID, sessionPatientId);
        }
        const overlayPatientId =
          sessionPatientId ??
          (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_PATIENT_ID) : null);
        const merged =
          overlayPatientId &&
          typeof window !== 'undefined' &&
          window.location.pathname.startsWith('/paciente')
            ? applyPatientPortalOverlay(json.data.state, overlayPatientId)
            : json.data.state;
        setState(merged);
        if (json.data.tenantId) localStorage.setItem(STORAGE_TENANT_ID, json.data.tenantId);
        setDataSource('supabase');
      } else {
        setState(createEmptyDemoState());
        setDataSource('empty');
      }
    } catch {
      setState(createEmptyDemoState());
      setDataSource('empty');
    }
  }, []);

  useEffect(() => {
    void loadBootstrap();
  }, [loadBootstrap]);

  const commit = useCallback((next: DemoState) => {
    setState(next);
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/paciente')) {
      const patientId = localStorage.getItem(STORAGE_PATIENT_ID);
      if (patientId) savePatientPortalOverlay(next, patientId);
    }
  }, []);

  const refresh = useCallback(async () => {
    const remote = await fetchClinicBootstrap();
    if (remote?.state) {
      if (remote.patientId) localStorage.setItem(STORAGE_PATIENT_ID, remote.patientId);
      const overlayPatientId =
        remote.patientId ??
        (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_PATIENT_ID) : null);
      const merged =
        overlayPatientId &&
        typeof window !== 'undefined' &&
        window.location.pathname.startsWith('/paciente')
          ? applyPatientPortalOverlay(remote.state, overlayPatientId)
          : remote.state;
      setState(merged);
      if (remote.tenantId) localStorage.setItem(STORAGE_TENANT_ID, remote.tenantId);
      setDataSource('supabase');
    }
  }, []);

  const reset = useCallback(() => {
    void loadBootstrap();
  }, [loadBootstrap]);

  const value = useMemo(
    () => ({
      state,
      dataSource,
      syncing,
      ephemeral: false,
      setState,
      commit,
      reset,
      refresh
    }),
    [state, dataSource, syncing, commit, reset, refresh]
  );

  return <DemoStoreContext.Provider value={value}>{children}</DemoStoreContext.Provider>;
}

export function useDemoStore() {
  const ctx = useContext(DemoStoreContext);
  if (!ctx) {
    return {
      state: createEmptyDemoState(),
      dataSource: 'empty' as DataSource,
      syncing: false,
      ephemeral: false,
      setState: () => undefined,
      commit: () => undefined,
      reset: () => undefined,
      refresh: async () => undefined
    };
  }
  return ctx;
}

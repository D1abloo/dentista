import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react';
import { demoSeed } from '@/data/demoData';
import { isClientDemoMode } from '@/lib/appMode';
import * as store from '@/lib/demoStore';
import type { DemoState } from '@/types/demo';

type DataSource = 'local' | 'supabase' | 'ephemeral' | 'loading';

type Ctx = {
  state: DemoState;
  dataSource: DataSource;
  syncing: boolean;
  ephemeral: boolean;
  setState: (updater: DemoState | ((prev: DemoState) => DemoState)) => void;
  commit: (next: DemoState) => void;
  reset: () => void;
};

const DemoStoreContext = createContext<Ctx | null>(null);

async function fetchRemoteState(): Promise<{ source: DataSource; state: DemoState }> {
  const res = await fetch('/api/demo/state');
  const json = (await res.json()) as {
    data?: { source?: 'local' | 'supabase'; state?: DemoState };
    error?: { message?: string };
  };
  if (!res.ok || !json.data?.state) {
    throw new Error(json.error?.message ?? 'No se pudo cargar el estado demo');
  }
  return { source: json.data.source ?? 'local', state: json.data.state };
}

async function pushRemoteState(state: DemoState) {
  await fetch('/api/demo/state', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ state })
  });
}

async function resetRemoteState() {
  await fetch('/api/demo/state', { method: 'DELETE' });
}

export function DemoStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>(() => store.getInitialState());
  const [dataSource, setDataSource] = useState<DataSource>('loading');
  const [syncing, setSyncing] = useState(false);
  const [ephemeral, setEphemeral] = useState(() => store.isEphemeralSession());
  const syncRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabaseSyncRef = useRef(false);

  useEffect(() => {
    if (!isClientDemoMode()) {
      store.clearDemoSession();
    }
    let cancelled = false;
    const isEphemeral = isClientDemoMode() && store.isEphemeralSession();
    setEphemeral(isEphemeral);

    if (isEphemeral) {
      const seed = structuredClone(demoSeed);
      setState(seed);
      setDataSource('ephemeral');
      supabaseSyncRef.current = false;
      return;
    }

    (async () => {
      try {
        const remote = await fetchRemoteState();
        if (cancelled) return;
        setState(remote.state);
        store.persistState(remote.state);
        setDataSource(remote.source);
        supabaseSyncRef.current = remote.source === 'supabase';
      } catch {
        if (!cancelled) {
          const local = store.getInitialState();
          setState(local);
          setDataSource('local');
          supabaseSyncRef.current = false;
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const commit = useCallback(
    (next: DemoState) => {
      setState(next);
      if (!isClientDemoMode() || store.isEphemeralSession()) return;

      store.persistState(next);

      if (!supabaseSyncRef.current) return;

      if (syncRef.current) clearTimeout(syncRef.current);
      syncRef.current = setTimeout(() => {
        setSyncing(true);
        void pushRemoteState(next)
          .catch(() => undefined)
          .finally(() => setSyncing(false));
      }, 450);
    },
    []
  );

  const reset = useCallback(() => {
    const run = async () => {
      if (store.isEphemeralSession()) {
        setState(structuredClone(demoSeed));
        return;
      }
      if (supabaseSyncRef.current) {
        try {
          await resetRemoteState();
          const remote = await fetchRemoteState();
          setState(remote.state);
          store.persistState(remote.state);
          setDataSource(remote.source);
          return;
        } catch {
          /* fallback local */
        }
      }
      const next = store.resetState();
      setState(next);
      setDataSource('local');
    };
    void run();
  }, []);

  const value = useMemo(
    () => ({ state, dataSource, syncing, ephemeral, setState, commit, reset }),
    [state, dataSource, syncing, ephemeral, commit, reset]
  );

  if (dataSource === 'loading') {
    return (
      <main className="grid min-h-[40vh] place-items-center text-sm font-semibold text-[var(--muted)]">
        Cargando datos…
      </main>
    );
  }

  return <DemoStoreContext.Provider value={value}>{children}</DemoStoreContext.Provider>;
}

export function useDemoStore() {
  const ctx = useContext(DemoStoreContext);
  if (!ctx) {
    return {
      state: demoSeed,
      dataSource: 'local' as DataSource,
      syncing: false,
      ephemeral: false,
      setState: () => undefined,
      commit: () => undefined,
      reset: () => undefined
    };
  }
  return ctx;
}

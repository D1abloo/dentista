import { useMemo, useState, type ReactNode } from 'react';
import { demoSeed } from '@/data/demoData';
import { DemoStoreContext } from '@/hooks/useDemoStore';
import type { DemoState } from '@/types/demo';

/** Proveedor de estado demo fijo para capturas (compatible con useDemoStore). */
export function GuideDemoStoreProvider({
  children,
  initialState = demoSeed
}: {
  children: ReactNode;
  initialState?: DemoState;
}) {
  const [state, setState] = useState<DemoState>(() => structuredClone(initialState));
  const value = useMemo(
    () => ({
      state,
      dataSource: 'supabase' as const,
      syncing: false,
      ephemeral: false,
      setState,
      commit: (next: DemoState) => setState(next),
      reset: () => setState(structuredClone(initialState)),
      refresh: async () => undefined
    }),
    [state, initialState]
  );
  return <DemoStoreContext.Provider value={value}>{children}</DemoStoreContext.Provider>;
}

import { demoState } from '@/data/demoData';
import { ensureDemoStateInSupabase, useSupabaseDemoStorage } from '@/lib/supabaseDemo';
import type { DemoState } from '@/types/demo';

export type DataAdapterMode = 'demo-localstorage' | 'demo-supabase' | 'supabase-produccion';

export interface DataAdapter {
  mode: DataAdapterMode;
  loadInitialState(): Promise<DemoState>;
}

export function createDemoDataAdapter(): DataAdapter {
  return {
    mode: 'demo-localstorage',
    async loadInitialState() {
      return demoState;
    }
  };
}

export function createSupabaseDemoDataAdapter(): DataAdapter {
  return {
    mode: 'demo-supabase',
    async loadInitialState() {
      if (!useSupabaseDemoStorage()) {
        return demoState;
      }
      return ensureDemoStateInSupabase();
    }
  };
}

/** Elige adaptador según entorno (servidor). */
export function createDataAdapter(): DataAdapter {
  return useSupabaseDemoStorage() ? createSupabaseDemoDataAdapter() : createDemoDataAdapter();
}

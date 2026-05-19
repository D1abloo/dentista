import { demoSeed } from '@/data/demoData';
import type { DemoState } from '@/types/demo';
import { STORAGE_STATE } from './keys';

export function loadPersistedState(): DemoState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_STATE);
    if (!raw) return null;
    return JSON.parse(raw) as DemoState;
  } catch {
    return null;
  }
}

export function savePersistedState(state: DemoState) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_STATE, JSON.stringify(state));
}

export function resetPersistedState(): DemoState {
  const state = structuredClone(demoSeed);
  savePersistedState(state);
  return state;
}

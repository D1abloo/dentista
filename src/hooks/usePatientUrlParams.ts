import { useMemo } from 'react';

export function usePatientUrlParams() {
  const search = typeof window !== 'undefined' ? window.location.search : '';
  return useMemo(() => new URLSearchParams(search), [search]);
}

/** Resuelve id de entidad desde ?focus= ?factura= ?informe= ?documento= */
export function resolveFocusId(params: URLSearchParams, keys: string[]): string {
  for (const key of keys) {
    const v = params.get(key)?.trim();
    if (v) return v;
  }
  return '';
}

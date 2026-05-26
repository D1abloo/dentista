/** Modo demo desactivado: la app opera siempre en producción (Supabase + sesión). */
export function isClientDemoMode(): boolean {
  return false;
}

export function isClientLiveMode(): boolean {
  return true;
}

export function modeCopy(_demo: string, live: string): string {
  return live;
}

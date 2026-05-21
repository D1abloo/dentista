/** Producción: sin modo demo en cliente. */
export function isClientDemoMode(): boolean {
  return false;
}

export function isClientLiveMode(): boolean {
  return true;
}

export function modeCopy(_demo: string, live: string): string {
  return live;
}

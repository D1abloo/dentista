/** Cliente: PUBLIC_DEMO_MODE=false → modo LIVE (sin localStorage de roles demo). */
export function isClientDemoMode(): boolean {
  return import.meta.env.PUBLIC_DEMO_MODE === 'true';
}

export function isClientLiveMode(): boolean {
  return !isClientDemoMode();
}

/** Texto según modo demo o LIVE (cliente). */
export function modeCopy(demo: string, live: string): string {
  return isClientDemoMode() ? demo : live;
}

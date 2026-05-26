/** true cuando PUBLIC_DEMO_MODE=true (desarrollo local sin login obligatorio). */
export function isClientDemoMode(): boolean {
  return import.meta.env.PUBLIC_DEMO_MODE === 'true';
}

export function isClientLiveMode(): boolean {
  return !isClientDemoMode();
}

export function modeCopy(_demo: string, live: string): string {
  return live;
}

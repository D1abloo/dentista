/** Cliente: PUBLIC_DEMO_MODE=false → modo LIVE (sin localStorage de roles demo). */
export function isClientDemoMode(): boolean {
  const raw = import.meta.env.PUBLIC_DEMO_MODE;
  return raw === 'true';
}

export function isClientLiveMode(): boolean {
  return !isClientDemoMode();
}

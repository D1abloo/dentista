import { platformNavFlat, type PlatformNavItem } from '@/components/platform/nav';

export type PlatformSearchHit = PlatformNavItem & { section?: string };

/** Rutas buscables del panel plataforma (misma fuente que el sidebar). */
export function searchPlatformNav(query: string, limit = 12): PlatformSearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return platformNavFlat.slice(0, limit);

  const scored: { item: PlatformNavItem; score: number }[] = [];

  for (const item of platformNavFlat) {
    const label = item.label.toLowerCase();
    const href = item.href.toLowerCase();
    const desc = (item.description ?? '').toLowerCase();
    let score = 0;
    if (label.startsWith(q)) score += 100;
    else if (label.includes(q)) score += 60;
    if (href.includes(q)) score += 40;
    if (desc.includes(q)) score += 25;
    if (score > 0) scored.push({ item, score });
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.item);
}

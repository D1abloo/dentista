export function scrollToSection(sectionId: string) {
  const el = document.getElementById(sectionId);
  if (!el) return false;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  return true;
}

import type { MouseEvent } from 'react';

export function handleLandingHashLink(e: MouseEvent<HTMLAnchorElement>, href: string) {
  if (!href.startsWith('/#')) return;
  if (window.location.pathname !== '/') return;
  e.preventDefault();
  const id = href.slice(2);
  scrollToSection(id);
}

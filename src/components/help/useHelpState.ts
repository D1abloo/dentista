import { useCallback, useEffect, useState } from 'react';
import {
  defaultSectionId,
  getSection,
  helpHashFor,
  parseHelpHash,
  type HelpAudience
} from '@/lib/guide/catalog';

export function useHelpState(initialAudience?: HelpAudience, options?: { syncHash?: boolean }) {
  const syncHash = options?.syncHash ?? true;
  const [audience, setAudience] = useState<HelpAudience>(initialAudience ?? 'patient');
  const [sectionId, setSectionId] = useState(() => defaultSectionId(initialAudience ?? 'patient'));

  const applyHash = useCallback(() => {
    if (!syncHash) return;
    const parsed = parseHelpHash(window.location.hash);
    setAudience(parsed.audience);
    setSectionId(parsed.sectionId);
  }, [syncHash]);

  useEffect(() => {
    if (!syncHash) return;
    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, [applyHash, syncHash]);

  const selectAudience = useCallback(
    (next: HelpAudience) => {
      const first = defaultSectionId(next);
      setAudience(next);
      setSectionId(first);
      if (!syncHash) return;
      const hash = helpHashFor(next, first);
      window.history.replaceState(null, '', `${window.location.pathname}${hash}`);
    },
    [syncHash]
  );

  const selectSection = useCallback(
    (nextSectionId: string, nextAudience?: HelpAudience) => {
      const aud = nextAudience ?? audience;
      if (!getSection(aud, nextSectionId)) return;
      setAudience(aud);
      setSectionId(nextSectionId);
      if (!syncHash) return;
      const hash = helpHashFor(aud, nextSectionId);
      window.history.replaceState(null, '', `${window.location.pathname}${hash}`);
    },
    [audience, syncHash]
  );

  return { audience, sectionId, selectAudience, selectSection, activeSection: getSection(audience, sectionId) };
}

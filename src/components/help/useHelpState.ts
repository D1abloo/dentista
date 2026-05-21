import { useCallback, useEffect, useState } from 'react';
import {
  getSection,
  helpHashAudience,
  helpHashFaq,
  helpHashSection,
  parseHelpHash,
  type HelpAudience
} from '@/lib/guide/catalog';

export function useHelpState(initialAudience?: HelpAudience, options?: { syncHash?: boolean }) {
  const syncHash = options?.syncHash ?? true;
  const [audience, setAudience] = useState<HelpAudience>(initialAudience ?? 'patient');
  const [sectionId, setSectionId] = useState<string | null>(null);
  const [showFaq, setShowFaq] = useState(false);

  const applyHash = useCallback(() => {
    if (!syncHash) return;
    const route = parseHelpHash(window.location.hash);
    setAudience(route.audience);
    setSectionId(route.sectionId);
    setShowFaq(route.showFaq);
  }, [syncHash]);

  useEffect(() => {
    if (!syncHash) return;
    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, [applyHash, syncHash]);

  const selectAudience = useCallback(
    (next: HelpAudience) => {
      setAudience(next);
      setSectionId(null);
      setShowFaq(false);
      if (!syncHash) return;
      window.history.replaceState(null, '', `${window.location.pathname}${helpHashAudience(next)}`);
    },
    [syncHash]
  );

  const openSection = useCallback(
    (id: string, aud?: HelpAudience) => {
      const a = aud ?? audience;
      if (!getSection(a, id)) return;
      setAudience(a);
      setSectionId(id);
      setShowFaq(false);
      if (!syncHash) return;
      window.history.replaceState(null, '', `${window.location.pathname}${helpHashSection(id)}`);
      document.getElementById('help-hub')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    [audience, syncHash]
  );

  const openIndex = useCallback(() => {
    setSectionId(null);
    setShowFaq(false);
    if (!syncHash) return;
    window.history.replaceState(null, '', `${window.location.pathname}${helpHashAudience(audience)}`);
  }, [audience, syncHash]);

  const openFaq = useCallback(() => {
    setSectionId(null);
    setShowFaq(true);
    if (!syncHash) return;
    window.history.replaceState(null, '', `${window.location.pathname}${helpHashFaq()}`);
  }, [syncHash]);

  const activeSection = sectionId ? getSection(audience, sectionId) : undefined;
  const mode = showFaq ? 'faq' : sectionId && activeSection ? 'guide' : 'hub';

  return {
    audience,
    sectionId,
    showFaq,
    mode,
    activeSection,
    selectAudience,
    openSection,
    openIndex,
    openFaq
  };
}

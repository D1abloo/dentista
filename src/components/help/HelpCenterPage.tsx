import { Headphones } from 'lucide-react';
import { PublicFooter } from '@/components/public/PublicFooter';
import { PublicHeader } from '@/components/public/PublicHeader';
import { HelpFaqPanel } from '@/components/help/HelpFaqPanel';
import { HelpGuideExperience } from '@/components/help/HelpGuideExperience';
import { HelpHubHome } from '@/components/help/HelpHubHome';
import { useHelpState } from '@/components/help/useHelpState';

export function HelpCenterPage() {
  const { audience, mode, activeSection, selectAudience, openSection, openIndex, openFaq } = useHelpState();

  return (
    <>
      <PublicHeader activeHref="/ayuda" />
      <main className="help-hub" id="help-hub">
        <header className="help-hub__header shell">
          <div>
            <p className="help-hub__eyebrow">Centro de ayuda</p>
            <h1>Dentista+</h1>
          </div>
          <a href="/contacto" className="help-hub__support">
            <Headphones className="h-4 w-4" aria-hidden />
            Soporte
          </a>
        </header>

        <div className="shell help-hub__content">
          {mode === 'guide' && activeSection ? (
            <HelpGuideExperience section={activeSection} onClose={openIndex} />
          ) : mode === 'faq' ? (
            <div className="help-hub__faq-wrap">
              <button type="button" className="help-hub__faq-back" onClick={openIndex}>
                ← Volver al índice
              </button>
              <HelpFaqPanel audience={audience} />
            </div>
          ) : (
            <HelpHubHome
              audience={audience}
              onAudience={selectAudience}
              onTopic={openSection}
              onFaq={openFaq}
            />
          )}
        </div>
      </main>
      <PublicFooter />
    </>
  );
}

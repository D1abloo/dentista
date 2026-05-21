import { useState } from 'react';
import { Headphones } from 'lucide-react';
import { PublicFooter } from '@/components/public/PublicFooter';
import { PublicHeader } from '@/components/public/PublicHeader';
import { HelpFaqPanel } from '@/components/help/HelpFaqPanel';
import { HelpSectionPanel } from '@/components/help/HelpSectionPanel';
import { HelpSidebar } from '@/components/help/HelpSidebar';
import { useHelpState } from '@/components/help/useHelpState';

export function HelpCenterPage() {
  const { audience, sectionId, selectAudience, selectSection, activeSection } = useHelpState();
  const [showFaqs, setShowFaqs] = useState(false);

  return (
    <>
      <PublicHeader activeHref="/ayuda" />
      <main className="help-page">
        <div className="help-page__top shell">
          <div className="help-page__top-inner">
            <h1>Ayuda</h1>
            <p>Guías paso a paso para pacientes y clínicas.</p>
          </div>
          <a href="/contacto" className="help-page__support-link">
            <Headphones className="h-4 w-4" aria-hidden />
            Soporte
          </a>
        </div>

        <div className="shell help-page__shell">
          <HelpSidebar
            audience={audience}
            sectionId={sectionId}
            onAudience={(next) => {
              setShowFaqs(false);
              selectAudience(next);
            }}
            onSection={(id) => {
              setShowFaqs(false);
              selectSection(id);
            }}
            showFaqs={showFaqs}
            onToggleFaqs={() => setShowFaqs((v) => !v)}
          />

          <div className="help-page__main" id="help-content">
            {showFaqs ? (
              <HelpFaqPanel audience={audience} />
            ) : activeSection ? (
              <HelpSectionPanel key={activeSection.id} section={activeSection} />
            ) : (
              <p className="help-page__empty">Elige un tema en el menú.</p>
            )}
          </div>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}

import { useState } from 'react';
import { BookOpen, Headphones } from 'lucide-react';
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
        <section className="help-page__hero shell">
          <div className="help-page__hero-inner">
            <span className="help-page__badge">
              <BookOpen className="h-4 w-4" aria-hidden />
              Centro de ayuda
            </span>
            <h1>Documentación Dentista+</h1>
            <p>
              Tutoriales con capturas en móvil. Elige el tipo de usuario en el menú lateral y consulta un tema cada vez,
              sin scroll interminable.
            </p>
            <a href="/contacto" className="help-page__support">
              <Headphones className="h-4 w-4" aria-hidden />
              Contactar soporte
            </a>
          </div>
        </section>

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

          <div className="help-page__main">
            {showFaqs ? (
              <HelpFaqPanel audience={audience} />
            ) : activeSection ? (
              <HelpSectionPanel section={activeSection} />
            ) : (
              <p className="help-page__empty">Selecciona un tema en el menú lateral.</p>
            )}
          </div>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}

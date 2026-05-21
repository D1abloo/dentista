import { useState } from 'react';
import { helpSectionsByAudience, type HelpAudience } from '@/lib/guide/catalog';
import { HelpFaqPanel } from '@/components/help/HelpFaqPanel';
import { HelpSectionPanel } from '@/components/help/HelpSectionPanel';
import { useHelpState } from '@/components/help/useHelpState';

export function HelpEmbedded({ audience = 'patient' }: { audience?: HelpAudience }) {
  const { sectionId, selectSection, activeSection } = useHelpState(audience, { syncHash: false });
  const [showFaqs, setShowFaqs] = useState(false);
  const sections = helpSectionsByAudience[audience];

  return (
    <div className="help-embedded">
      <div className="help-embedded__bar">
        <p className="help-embedded__intro">
          Guía del portal. Documentación completa en{' '}
          <a href={`/ayuda#${audience === 'patient' ? 'portal-paciente' : 'panel-admin'}`}>Centro de ayuda</a>.
        </p>
        <button type="button" className="help-embedded__faq-toggle" onClick={() => setShowFaqs((v) => !v)}>
          {showFaqs ? 'Ver temas' : 'FAQ'}
        </button>
      </div>

      {showFaqs ? (
        <HelpFaqPanel audience={audience} />
      ) : (
        <>
          <nav className="help-embedded__chips" aria-label="Temas de la guía">
            {sections.map((s) => (
              <button
                key={s.id}
                type="button"
                className={sectionId === s.id ? 'help-embedded__chip--active' : ''}
                onClick={() => selectSection(s.id)}
              >
                {s.title}
              </button>
            ))}
          </nav>
          {activeSection ? <HelpSectionPanel section={activeSection} /> : null}
        </>
      )}
    </div>
  );
}

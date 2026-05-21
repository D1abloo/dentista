import { ExternalLink } from 'lucide-react';
import {
  faqsForAudience,
  helpAudiences,
  helpQuickLinks,
  helpSectionsByAudience,
  type HelpAudience
} from '@/lib/guide/catalog';

export function HelpSidebar({
  audience,
  sectionId,
  onAudience,
  onSection,
  showFaqs,
  onToggleFaqs
}: {
  audience: HelpAudience;
  sectionId: string;
  onAudience: (a: HelpAudience) => void;
  onSection: (id: string) => void;
  showFaqs: boolean;
  onToggleFaqs: () => void;
}) {
  const sections = helpSectionsByAudience[audience];

  return (
    <aside className="help-nav">
      <div className="help-nav__audience" role="tablist" aria-label="Tipo de guía">
        {helpAudiences.map((a) => (
          <button
            key={a.id}
            type="button"
            role="tab"
            aria-selected={audience === a.id}
            className={audience === a.id ? 'help-nav__audience-btn--active' : ''}
            onClick={() => onAudience(a.id)}
          >
            {a.label}
          </button>
        ))}
      </div>

      <p className="help-nav__desc">{helpAudiences.find((a) => a.id === audience)?.description}</p>

      <nav className="help-nav__sections" aria-label="Temas de la guía">
        <p className="help-nav__label">Temas</p>
        <ul>
          {sections.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                className={sectionId === s.id && !showFaqs ? 'help-nav__link--active' : ''}
                onClick={() => onSection(s.id)}
                aria-current={sectionId === s.id && !showFaqs ? 'true' : undefined}
              >
                {s.title}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <button
        type="button"
        className={`help-nav__faq-btn ${showFaqs ? 'help-nav__faq-btn--active' : ''}`}
        onClick={onToggleFaqs}
      >
        Preguntas frecuentes ({faqsForAudience(audience).length})
      </button>

      <div className="help-nav__links">
        <p className="help-nav__label">Enlaces útiles</p>
        <ul>
          {helpQuickLinks.map((link) => (
            <li key={link.id}>
              <a href={link.href} className="help-nav__ext">
                {link.label}
                <ExternalLink className="h-3 w-3" aria-hidden />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

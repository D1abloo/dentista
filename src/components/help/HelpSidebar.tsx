import { CircleHelp, ExternalLink } from 'lucide-react';
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
  const currentIndex = sections.findIndex((s) => s.id === sectionId);
  const progress = currentIndex >= 0 ? currentIndex + 1 : 1;

  return (
    <aside className="help-nav" aria-label="Navegación de ayuda">
      <p className="help-nav__role">Navegación</p>

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

      {!showFaqs ? (
        <p className="help-nav__progress" aria-live="polite">
          Tema {progress} de {sections.length}
        </p>
      ) : null}

      <nav className="help-nav__sections" aria-label="Temas">
        <ul>
          {sections.map((s, i) => (
            <li key={s.id}>
              <button
                type="button"
                className={sectionId === s.id && !showFaqs ? 'help-nav__link--active' : ''}
                onClick={() => onSection(s.id)}
                aria-current={sectionId === s.id && !showFaqs ? 'step' : undefined}
              >
                <span className="help-nav__link-n">{i + 1}</span>
                <span className="help-nav__link-text">{s.title}</span>
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
        <CircleHelp className="h-4 w-4" aria-hidden />
        FAQ · {faqsForAudience(audience).length}
      </button>

      <details className="help-nav__more">
        <summary>Enlaces rápidos</summary>
        <ul>
          {helpQuickLinks.map((link) => (
            <li key={link.id}>
              <a href={link.href}>
                {link.label}
                <ExternalLink className="h-3 w-3" aria-hidden />
              </a>
            </li>
          ))}
        </ul>
      </details>
    </aside>
  );
}

import type { GuideSection } from '@/lib/guide/content';

export function GuideViewer({ sections, intro }: { sections: GuideSection[]; intro: string }) {
  return (
    <div className="guide-docs">
      <p className="guide-docs__intro">{intro}</p>
      <nav className="guide-docs__toc" aria-label="Índice de la guía">
        {sections.map((s) => (
          <a key={s.id} href={`#${s.id}`} className="guide-docs__toc-link">
            {s.title}
          </a>
        ))}
      </nav>
      <div className="guide-docs__sections">
        {sections.map((section) => (
          <article key={section.id} id={section.id} className="guide-docs__section">
            <header className="guide-docs__section-head">
              <h2>{section.title}</h2>
              <p>{section.summary}</p>
            </header>
            {section.image ? (
              <div className="guide-docs__media">
                <img src={section.image} alt={section.imageAlt ?? section.title} loading="lazy" decoding="async" />
              </div>
            ) : null}
            <ol className="guide-docs__steps">
              {section.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            {section.tips?.length ? (
              <ul className="guide-docs__tips">
                {section.tips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}

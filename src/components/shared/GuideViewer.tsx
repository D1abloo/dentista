import type { GuideSection } from '@/lib/guide/content';
import { AlertTriangle, BookOpen, Lightbulb, Target } from 'lucide-react';

export function GuideViewer({ sections, intro }: { sections: GuideSection[]; intro: string }) {
  return (
    <div className="guide-docs guide-docs--rich">
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

            <div className="guide-docs__meta">
              <p className="guide-docs__meta-row">
                <Target className="h-4 w-4" aria-hidden />
                <span>
                  <strong>Objetivo:</strong> {section.goal}
                </span>
              </p>
              <p className="guide-docs__meta-row">
                <BookOpen className="h-4 w-4" aria-hidden />
                <span>
                  <strong>Para quién:</strong> {section.audience}
                </span>
              </p>
            </div>

            {section.prerequisites?.length ? (
              <div className="guide-docs__prereq">
                <h3>Antes de empezar</h3>
                <ul>
                  {section.prerequisites.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {section.screenshots.length ? (
              <div className="guide-docs__gallery">
                {section.screenshots.map((shot) => (
                  <figure key={shot.src} className="guide-docs__shot">
                    <div className="guide-docs__phone">
                      <img src={shot.src} alt={shot.alt} loading="lazy" decoding="async" />
                    </div>
                    <figcaption>{shot.caption}</figcaption>
                  </figure>
                ))}
              </div>
            ) : null}

            <div className="guide-docs__steps-block">
              <h3>Paso a paso</h3>
              <ol className="guide-docs__steps">
                {section.steps.map((step, i) => (
                  <li key={step.title}>
                    <span className="guide-docs__step-num">{i + 1}</span>
                    <div>
                      <strong>{step.title}</strong>
                      <p>{step.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {section.tips?.length ? (
              <ul className="guide-docs__tips">
                {section.tips.map((tip) => (
                  <li key={tip}>
                    <Lightbulb className="h-4 w-4 shrink-0" aria-hidden />
                    {tip}
                  </li>
                ))}
              </ul>
            ) : null}

            {section.warnings?.length ? (
              <ul className="guide-docs__warnings">
                {section.warnings.map((w) => (
                  <li key={w}>
                    <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
                    {w}
                  </li>
                ))}
              </ul>
            ) : null}

            {section.related?.length ? (
              <div className="guide-docs__related">
                <h3>Enlaces relacionados</h3>
                <div className="guide-docs__related-links">
                  {section.related.map((r) => (
                    <a key={r.href} href={r.href}>
                      {r.label}
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}

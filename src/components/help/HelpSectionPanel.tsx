import { AlertTriangle, ArrowUpRight, Lightbulb, Target, Users } from 'lucide-react';
import type { GuideSection } from '@/lib/guide/types';

export function HelpSectionPanel({ section }: { section: GuideSection }) {
  return (
    <article className="help-section">
      <header className="help-section__head">
        <p className="help-section__kicker">Guía paso a paso</p>
        <h2>{section.title}</h2>
        <p className="help-section__summary">{section.summary}</p>
      </header>

      <div className="help-section__meta">
        <p>
          <Target className="h-4 w-4" aria-hidden />
          <span>
            <strong>Objetivo:</strong> {section.goal}
          </span>
        </p>
        <p>
          <Users className="h-4 w-4" aria-hidden />
          <span>
            <strong>Dirigido a:</strong> {section.audience}
          </span>
        </p>
      </div>

      <div className="help-section__layout">
        <div className="help-section__content">
          {section.prerequisites?.length ? (
            <div className="help-section__block">
              <h3>Antes de empezar</h3>
              <ul>
                {section.prerequisites.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="help-section__block">
            <h3>Pasos</h3>
            <ol className="help-section__steps">
              {section.steps.map((step, i) => (
                <li key={step.title}>
                  <span className="help-section__step-n">{i + 1}</span>
                  <div>
                    <strong>{step.title}</strong>
                    <p>{step.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {section.tips?.length ? (
            <ul className="help-section__tips">
              {section.tips.map((tip) => (
                <li key={tip}>
                  <Lightbulb className="h-4 w-4 shrink-0" aria-hidden />
                  {tip}
                </li>
              ))}
            </ul>
          ) : null}

          {section.warnings?.length ? (
            <ul className="help-section__warnings">
              {section.warnings.map((w) => (
                <li key={w}>
                  <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
                  {w}
                </li>
              ))}
            </ul>
          ) : null}

          {section.related?.length ? (
            <div className="help-section__related">
              {section.related.map((r) => (
                <a key={r.href} href={r.href} className="help-section__related-link">
                  {r.label}
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                </a>
              ))}
            </div>
          ) : null}
        </div>

        {section.screenshots.length ? (
          <aside className="help-section__media" aria-label="Capturas de pantalla">
            {section.screenshots.map((shot) => (
              <figure key={shot.src} className="help-section__shot">
                <div className="help-section__phone">
                  <img src={shot.src} alt={shot.alt} loading="lazy" decoding="async" />
                </div>
                <figcaption>{shot.caption}</figcaption>
              </figure>
            ))}
          </aside>
        ) : null}
      </div>
    </article>
  );
}

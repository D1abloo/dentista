import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Lightbulb,
  Target
} from 'lucide-react';
import type { GuideSection } from '@/lib/guide/types';

export function HelpSectionPanel({ section }: { section: GuideSection }) {
  const [activeStep, setActiveStep] = useState(0);
  const total = section.steps.length;
  const isLast = activeStep >= total - 1;

  useEffect(() => {
    setActiveStep(0);
  }, [section.id]);

  return (
    <article className="help-guide">
      <header className="help-guide__summary">
        <div className="help-guide__pills">
          <span className="help-guide__pill">{total} pasos</span>
          <span className="help-guide__pill help-guide__pill--muted">Guía rápida</span>
        </div>
        <h2>{section.title}</h2>
        <p className="help-guide__lede">{section.summary}</p>
        <p className="help-guide__objective">
          <Target className="h-4 w-4 shrink-0" aria-hidden />
          <span>{section.goal}</span>
        </p>
      </header>

      <div className="help-guide__grid">
        <div className="help-guide__flow">
          {section.prerequisites?.length ? (
            <section className="help-guide__prep" aria-label="Requisitos">
              <h3>Antes de empezar</h3>
              <ul>
                {section.prerequisites.map((p) => (
                  <li key={p}>
                    <Check className="h-3.5 w-3.5" aria-hidden />
                    {p}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="help-guide__timeline" aria-label="Pasos">
            <div
              className="help-guide__progress"
              role="progressbar"
              aria-valuenow={activeStep + 1}
              aria-valuemin={1}
              aria-valuemax={total}
              aria-label="Progreso de la guía"
            >
              <span style={{ width: `${((activeStep + 1) / total) * 100}%` }} />
            </div>

            <ol className="help-guide__steps">
              {section.steps.map((step, i) => {
                const state = i < activeStep ? 'done' : i === activeStep ? 'active' : 'pending';
                return (
                  <li key={step.title} className={`help-guide__step help-guide__step--${state}`}>
                    <button
                      type="button"
                      className="help-guide__step-trigger"
                      onClick={() => setActiveStep(i)}
                      aria-expanded={i === activeStep}
                    >
                      <span className="help-guide__step-marker" aria-hidden>
                        {i < activeStep ? <Check className="h-3.5 w-3.5" /> : i + 1}
                      </span>
                      <span className="help-guide__step-title">{step.title}</span>
                      <ChevronRight className="help-guide__step-chevron h-4 w-4" aria-hidden />
                    </button>
                    {i === activeStep ? (
                      <div className="help-guide__step-body">
                        <p>{step.detail}</p>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          </section>

          {section.tips?.length ? (
            <ul className="help-guide__callouts help-guide__callouts--tip">
              {section.tips.map((tip) => (
                <li key={tip}>
                  <Lightbulb className="h-4 w-4 shrink-0" aria-hidden />
                  {tip}
                </li>
              ))}
            </ul>
          ) : null}

          {section.warnings?.length ? (
            <ul className="help-guide__callouts help-guide__callouts--warn">
              {section.warnings.map((w) => (
                <li key={w}>
                  <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
                  {w}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {section.screenshots[0] ? (
          <aside className="help-guide__preview" aria-label="Vista previa">
            <p className="help-guide__preview-label">Vista en móvil</p>
            <figure className="help-guide__shot">
              <div className="help-guide__phone">
                <img
                  src={section.screenshots[0].src}
                  alt={section.screenshots[0].alt}
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <figcaption>{section.screenshots[0].caption}</figcaption>
            </figure>
          </aside>
        ) : null}
      </div>

      <footer className="help-guide__actions">
        <div className="help-guide__step-nav">
          <button
            type="button"
            className="help-guide__btn help-guide__btn--ghost"
            disabled={activeStep === 0}
            onClick={() => setActiveStep((s) => Math.max(0, s - 1))}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Anterior
          </button>
          <button
            type="button"
            className="help-guide__btn help-guide__btn--primary"
            onClick={() => setActiveStep((s) => (isLast ? s : s + 1))}
          >
            {isLast ? 'Guía completada' : 'Siguiente paso'}
            {!isLast ? <ArrowRight className="h-4 w-4" aria-hidden /> : null}
          </button>
        </div>

        {section.related?.length ? (
          <div className="help-guide__cta">
            <p className="help-guide__cta-label">Acciones</p>
            <div className="help-guide__cta-row">
              {section.related.map((r, i) => (
                <a
                  key={r.href}
                  href={r.href}
                  className={i === 0 ? 'help-guide__btn help-guide__btn--primary' : 'help-guide__btn help-guide__btn--outline'}
                >
                  {r.label}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </footer>
    </article>
  );
}

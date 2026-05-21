import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Lightbulb
} from 'lucide-react';
import { HelpPdpScreen } from '@/components/help/HelpPdpScreen';
import { resolveStepScreenshot } from '@/lib/guide/screenshots';
import type { GuideSection } from '@/lib/guide/types';

export function HelpSectionPanel({ section }: { section: GuideSection }) {
  const [activeStep, setActiveStep] = useState(0);
  const total = section.steps.length;
  const isLast = activeStep >= total - 1;
  const currentStep = section.steps[activeStep];
  const activeShot = useMemo(
    () => (currentStep ? resolveStepScreenshot(section, currentStep, activeStep) : null),
    [section, currentStep, activeStep]
  );

  useEffect(() => {
    setActiveStep(0);
  }, [section.id]);

  return (
    <article className="help-guide">
      <header className="help-guide__summary">
        <div className="help-guide__pills">
          <span className="help-guide__pill">{total} pasos</span>
          {activeShot ? <span className="help-guide__pill help-guide__pill--live">Vista real del PdP</span> : null}
        </div>
        <h2>{section.title}</h2>
        <p className="help-guide__lede">{section.summary}</p>
      </header>

      {activeShot ? (
        <div className="help-guide__hero-shot">
          <HelpPdpScreen shot={activeShot} />
        </div>
      ) : null}

      <div className="help-guide__body">
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
          >
            <span style={{ width: `${((activeStep + 1) / total) * 100}%` }} />
          </div>

          <ol className="help-guide__steps">
            {section.steps.map((step, i) => {
              const state = i < activeStep ? 'done' : i === activeStep ? 'active' : 'pending';
              const hasShot = Boolean(resolveStepScreenshot(section, step, i));
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
                    {hasShot ? <span className="help-guide__step-badge">PdP</span> : null}
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
            {isLast ? 'Listo' : 'Siguiente'}
            {!isLast ? <ArrowRight className="h-4 w-4" aria-hidden /> : null}
          </button>
        </div>

        {section.related?.length ? (
          <div className="help-guide__cta">
            <p className="help-guide__cta-label">Ir a</p>
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

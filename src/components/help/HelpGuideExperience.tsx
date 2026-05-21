import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { HelpPdpScreen } from '@/components/help/HelpPdpScreen';
import { resolveStepScreenshot } from '@/lib/guide/screenshots';
import type { GuideSection } from '@/lib/guide/types';

export function HelpGuideExperience({
  section,
  onClose
}: {
  section: GuideSection;
  onClose: () => void;
}) {
  const [step, setStep] = useState(0);
  const total = section.steps.length;
  const current = section.steps[step];
  const shot = useMemo(
    () => (current ? resolveStepScreenshot(section, current, step) : null),
    [section, current, step]
  );

  useEffect(() => {
    setStep(0);
  }, [section.id]);

  return (
    <div className="help-stage" role="dialog" aria-labelledby="help-stage-title">
      <header className="help-stage__bar">
        <button type="button" className="help-stage__back" onClick={onClose}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Índice
        </button>
        <div className="help-stage__dots" aria-hidden>
          {section.steps.map((_, i) => (
            <span key={i} className={i === step ? 'help-stage__dot--on' : i < step ? 'help-stage__dot--done' : ''} />
          ))}
        </div>
        <span className="help-stage__count">
          {step + 1}/{total}
        </span>
        <button type="button" className="help-stage__close" onClick={onClose} aria-label="Cerrar guía">
          <X className="h-5 w-5" />
        </button>
      </header>

      <div className="help-stage__layout">
        <div className="help-stage__screen">
          {shot ? <HelpPdpScreen shot={shot} label="Captura del portal" /> : (
            <p className="help-stage__no-shot">Sin captura para este paso.</p>
          )}
        </div>

        <div className="help-stage__panel">
          <p className="help-stage__kicker" id="help-stage-title">
            {section.title}
          </p>
          <h2 className="help-stage__step-title">{current?.title}</h2>
          <p className="help-stage__step-text">{current?.detail}</p>

          <nav className="help-stage__steps-nav" aria-label="Saltar a paso">
            {section.steps.map((s, i) => (
              <button
                key={s.title}
                type="button"
                className={i === step ? 'help-stage__pill--on' : i < step ? 'help-stage__pill--done' : ''}
                onClick={() => setStep(i)}
              >
                {i + 1}. {s.title}
              </button>
            ))}
          </nav>

          <div className="help-stage__actions">
            <button
              type="button"
              className="help-stage__btn help-stage__btn--ghost"
              disabled={step === 0}
              onClick={() => setStep((s) => s - 1)}
            >
              Anterior
            </button>
            <button
              type="button"
              className="help-stage__btn help-stage__btn--primary"
              onClick={() => (step < total - 1 ? setStep((s) => s + 1) : onClose())}
            >
              {step < total - 1 ? (
                <>
                  Siguiente
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </>
              ) : (
                'Volver al índice'
              )}
            </button>
          </div>

          {section.related?.length ? (
            <div className="help-stage__links">
              {section.related.map((r) => (
                <a key={r.href} href={r.href} className="help-stage__link">
                  {r.label}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

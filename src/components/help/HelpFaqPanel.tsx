import { useId, useState } from 'react';
import { ChevronDown, Shield } from 'lucide-react';
import { faqsForAudience, type HelpAudience } from '@/lib/guide/catalog';

export function HelpFaqPanel({
  audience,
  compact,
  premium
}: {
  audience: HelpAudience;
  compact?: boolean;
  premium?: boolean;
}) {
  const faqs = faqsForAudience(audience);
  const [openId, setOpenId] = useState<string | null>(faqs[0]?.id ?? null);
  const titleId = useId();

  function toggle(id: string) {
    setOpenId((prev) => (prev === id ? null : id));
  }

  if (premium) {
    return (
      <article className="help-faq-premium__card help-faq-premium__card--platform" aria-labelledby={titleId}>
        <div className="help-faq-premium__card-icon" aria-hidden>
          <Shield className="h-7 w-7" />
        </div>
        <header className="help-faq-premium__card-head">
          <p className="help-faq-premium__kicker">Respuestas rápidas</p>
          <h3 id={titleId}>Preguntas frecuentes</h3>
          <p className="help-faq-premium__subtitle">Administradores · {faqs.length} temas</p>
        </header>
        <div className="help-faq-premium__list" role="list">
          {faqs.map((faq) => {
            const open = openId === faq.id;
            const answerId = `platform-faq-${faq.id}`;
            return (
              <div
                key={faq.id}
                role="listitem"
                className={`help-faq-premium__item${open ? ' help-faq-premium__item--open' : ''}`}
              >
                <button
                  type="button"
                  id={`${answerId}-trigger`}
                  className="help-faq-premium__trigger"
                  aria-expanded={open}
                  aria-controls={answerId}
                  onClick={() => toggle(faq.id)}
                >
                  <span className="help-faq-premium__trigger-icon help-faq-premium__trigger-icon--platform" aria-hidden>
                    <Shield className="h-4 w-4" />
                  </span>
                  <span className="help-faq-premium__trigger-text">{faq.question}</span>
                  <ChevronDown className="help-faq-premium__chevron h-5 w-5 shrink-0" aria-hidden />
                </button>
                <div
                  id={answerId}
                  role="region"
                  aria-labelledby={`${answerId}-trigger`}
                  className={`help-faq-premium__answer-wrap${open ? ' help-faq-premium__answer-wrap--open' : ''}`}
                >
                  <div className="help-faq-premium__answer-inner help-faq-premium__answer-inner--platform">
                    <p className="help-faq-premium__answer">{faq.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </article>
    );
  }

  return (
    <section className={`help-faq${compact ? ' help-faq--compact' : ''}`} aria-labelledby={compact ? undefined : 'help-faq-title'}>
      {!compact ? (
        <header className="help-faq__head">
          <p className="help-faq__kicker">Respuestas rápidas</p>
          <h2 id="help-faq-title">Preguntas frecuentes</h2>
          <p>
            {audience === 'patient' ? 'Pacientes' : audience === 'admin' ? 'Clínicas' : 'Plataforma'} · {faqs.length}{' '}
            temas
          </p>
        </header>
      ) : null}
      <div className="help-faq__list">
        {faqs.map((faq) => {
          const open = openId === faq.id;
          return (
            <div key={faq.id} className={`help-faq__item ${open ? 'help-faq__item--open' : ''}`}>
              <button
                type="button"
                className="help-faq__trigger"
                aria-expanded={open}
                onClick={() => toggle(faq.id)}
              >
                {faq.question}
                <ChevronDown className="h-4 w-4" aria-hidden />
              </button>
              {open ? <p className="help-faq__answer">{faq.answer}</p> : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { faqsForAudience, type HelpAudience } from '@/lib/guide/catalog';

export function HelpFaqPanel({ audience }: { audience: HelpAudience }) {
  const faqs = faqsForAudience(audience);
  const [openId, setOpenId] = useState<string | null>(faqs[0]?.id ?? null);

  return (
    <section className="help-faq" aria-labelledby="help-faq-title">
      <header className="help-faq__head">
        <p className="help-faq__kicker">Respuestas rápidas</p>
        <h2 id="help-faq-title">Preguntas frecuentes</h2>
        <p>{audience === 'patient' ? 'Pacientes' : 'Equipos de clínica'} · {faqs.length} temas</p>
      </header>
      <div className="help-faq__list">
        {faqs.map((faq) => {
          const open = openId === faq.id;
          return (
            <div key={faq.id} className={`help-faq__item ${open ? 'help-faq__item--open' : ''}`}>
              <button
                type="button"
                className="help-faq__trigger"
                aria-expanded={open}
                onClick={() => setOpenId(open ? null : faq.id)}
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

import { useId, useState } from 'react';
import { ArrowRight, Building2, ChevronDown, User } from 'lucide-react';
import {
  helpFaqHubClinic,
  helpFaqHubDefaultOpen,
  helpFaqHubPatient,
  type HelpFaqHubItem
} from '@/lib/guide/helpFaqPremium';

type CardVariant = 'patient' | 'admin';

function FaqPremiumCard({
  variant,
  items,
  defaultOpenId,
  staggerIndex
}: {
  variant: CardVariant;
  items: HelpFaqHubItem[];
  defaultOpenId: string;
  staggerIndex: number;
}) {
  const titleId = useId();
  const [openId, setOpenId] = useState<string | null>(defaultOpenId);
  const isPatient = variant === 'patient';
  const IconHeader = isPatient ? User : Building2;

  function toggle(id: string) {
    setOpenId((prev) => (prev === id ? null : id));
  }

  return (
    <article
      className={`help-faq-premium__card help-faq-premium__card--${variant} help-faq-premium__anim-stagger`}
      style={{ animationDelay: `${staggerIndex * 80}ms` }}
      aria-labelledby={titleId}
    >
      <div className="help-faq-premium__card-icon" aria-hidden>
        <IconHeader className="h-7 w-7" />
      </div>

      <header className="help-faq-premium__card-head">
        <p className="help-faq-premium__kicker">Respuestas rápidas</p>
        <h3 id={titleId}>Preguntas frecuentes</h3>
        <p className="help-faq-premium__subtitle">
          {isPatient ? 'Pacientes' : 'Clínicas'} · {items.length} temas
        </p>
      </header>

      <div className="help-faq-premium__list" role="list">
        {items.map((faq) => {
          const open = openId === faq.id;
          const answerId = `${variant}-faq-${faq.id}`;
          const RowIcon = faq.icon;
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggle(faq.id);
                  }
                }}
              >
                <span className="help-faq-premium__trigger-icon" aria-hidden>
                  <RowIcon className="h-4 w-4" />
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
                <div className="help-faq-premium__answer-inner">
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

type Props = {
  onViewAll?: () => void;
  showViewAll?: boolean;
  /** Texto SEO bajo el título de sección (opcional). */
  seoLead?: boolean;
};

export function HelpFaqPremiumSection({ onViewAll, showViewAll = true, seoLead = true }: Props) {
  return (
    <section
      className="help-faq-premium"
      id="help-faq"
      aria-labelledby="help-faq-section-title"
    >
      <div className="help-faq-premium__intro">
        <h2 id="help-faq-section-title">Preguntas frecuentes</h2>
        {seoLead ? (
          <p className="help-faq-premium__seo">
            Preguntas frecuentes AgendaClinic: ayuda del portal paciente dental, soporte para clínicas
            dentales, reservar cita dental online, informes odontológicos, facturación dental y
            consentimiento dental digital.
          </p>
        ) : null}
        {showViewAll && onViewAll ? (
          <button type="button" className="help-faq-premium__view-all" onClick={onViewAll}>
            Ver todas
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>

      <div className="help-faq-premium__grid">
        <FaqPremiumCard
          variant="patient"
          items={helpFaqHubPatient}
          defaultOpenId={helpFaqHubDefaultOpen.patient}
          staggerIndex={0}
        />
        <FaqPremiumCard
          variant="admin"
          items={helpFaqHubClinic}
          defaultOpenId={helpFaqHubDefaultOpen.admin}
          staggerIndex={1}
        />
      </div>
    </section>
  );
}

import { useId, useMemo, useState } from 'react';
import { Building2, ChevronDown, Shield, User } from 'lucide-react';
import {
  helpFaqHubAdmin,
  helpFaqHubClinic,
  helpFaqHubDefaultOpen,
  helpFaqHubPatient,
  type HelpFaqHubItem
} from '@/lib/guide/helpFaqPremium';
import type { HelpAudience } from '@/lib/guide/types';

type FaqTab = 'patient' | 'admin' | 'platform';

const TAB_LABELS: Record<FaqTab, string> = {
  patient: 'Pacientes',
  admin: 'Clínicas',
  platform: 'Administradores'
};

function FaqPremiumCard({
  variant,
  items,
  defaultOpenId,
  staggerIndex
}: {
  variant: FaqTab;
  items: HelpFaqHubItem[];
  defaultOpenId: string;
  staggerIndex: number;
}) {
  const titleId = useId();
  const [openId, setOpenId] = useState<string | null>(defaultOpenId);
  const IconHeader = variant === 'patient' ? User : variant === 'admin' ? Building2 : Shield;

  function toggle(id: string) {
    setOpenId((prev) => (prev === id ? null : id));
  }

  return (
    <article
      className={`help-faq-premium__card help-faq-premium__card--${variant === 'platform' ? 'platform' : variant === 'admin' ? 'admin' : 'patient'} help-faq-premium__anim-stagger`}
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
          {TAB_LABELS[variant]} · {items.length} temas
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
  seoLead?: boolean;
  /** Filtra ítems por búsqueda global del hub. */
  searchQuery?: string;
  /** Alinea pestaña FAQ con perfil activo. */
  activeAudience?: HelpAudience;
};

function filterFaqItems(items: HelpFaqHubItem[], q: string): HelpFaqHubItem[] {
  const query = q.trim().toLowerCase();
  if (!query) return items;
  return items.filter(
    (f) => f.question.toLowerCase().includes(query) || f.answer.toLowerCase().includes(query)
  );
}

export function HelpFaqPremiumSection({
  onViewAll,
  showViewAll = false,
  seoLead = true,
  searchQuery = '',
  activeAudience = 'patient'
}: Props) {
  const defaultTab: FaqTab =
    activeAudience === 'platform' ? 'platform' : activeAudience === 'admin' ? 'admin' : 'patient';
  const [tab, setTab] = useState<FaqTab>(defaultTab);

  const patientItems = useMemo(
    () => filterFaqItems(helpFaqHubPatient, searchQuery),
    [searchQuery]
  );
  const clinicItems = useMemo(() => filterFaqItems(helpFaqHubClinic, searchQuery), [searchQuery]);
  const adminItems = useMemo(() => filterFaqItems(helpFaqHubAdmin, searchQuery), [searchQuery]);

  const activeItems =
    tab === 'patient' ? patientItems : tab === 'admin' ? clinicItems : adminItems;

  return (
    <section className="help-faq-premium" id="help-faq" aria-labelledby="help-faq-section-title">
      <div className="help-faq-premium__intro">
        <h2 id="help-faq-section-title">Preguntas frecuentes</h2>
        {seoLead ? (
          <p className="help-faq-premium__seo">
            Ayuda portal paciente dental, panel clínica dental, informes odontológicos, facturación
            dental, consentimiento dental digital y soporte software dental AgendaClinic.
          </p>
        ) : null}
        {showViewAll && onViewAll ? (
          <button type="button" className="help-faq-premium__view-all" onClick={onViewAll}>
            Ver documentación completa
          </button>
        ) : null}
      </div>

      <div className="help-faq-premium__tabs" role="tablist" aria-label="Perfil de preguntas frecuentes">
        {(Object.keys(TAB_LABELS) as FaqTab[]).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            className={`help-faq-premium__tab${tab === key ? ' help-faq-premium__tab--active' : ''}`}
            onClick={() => setTab(key)}
          >
            {TAB_LABELS[key]}
          </button>
        ))}
      </div>

      {searchQuery && activeItems.length === 0 ? (
        <p className="help-faq-premium__empty" role="status">
          No se encontraron resultados en FAQ. Selecciona otro perfil o cambia la búsqueda.
        </p>
      ) : (
        <div className="help-faq-premium__grid help-faq-premium__grid--single">
          <FaqPremiumCard
            variant={tab}
            items={activeItems}
            defaultOpenId={helpFaqHubDefaultOpen[tab]}
            staggerIndex={0}
          />
        </div>
      )}
    </section>
  );
}

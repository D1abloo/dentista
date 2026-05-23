import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Building2,
  Headphones,
  HelpCircle,
  Search,
  Shield,
  Sparkles,
  User,
  Users
} from 'lucide-react';
import { HelpGuideExperience } from '@/components/help/HelpGuideExperience';
import { HelpFaqPanel } from '@/components/help/HelpFaqPanel';
import { useHelpState } from '@/components/help/useHelpState';
import {
  adminHubCards,
  estimateGuideMinutes,
  filterGuideSections,
  helpSectionsByAudience,
  helpSidebarNav,
  patientHubCards,
  platformHubCards,
  searchAllGuides
} from '@/lib/guide/hubCatalog';
import { helpAudiences, sectionThumb, type HelpAudience } from '@/lib/guide/catalog';
import type { GuideSection } from '@/lib/guide/types';
const AUDIENCE_ICONS = {
  patient: User,
  admin: Building2,
  platform: Shield
} as const;

function GuideSectionBlock({
  title,
  cards,
  audience,
  onOpen,
  compact
}: {
  title: string;
  cards: { id: string; title: string }[];
  audience: HelpAudience;
  onOpen: (id: string, aud: HelpAudience) => void;
  compact?: boolean;
}) {
  const sections = helpSectionsByAudience[audience];
  const byId = new Map(sections.map((s) => [s.id, s]));

  return (
    <section className={`help-hub-v2__block${compact ? ' help-hub-v2__block--compact' : ''}`}>
      <div className="help-hub-v2__block-head">
        <h2>{title}</h2>
      </div>
      <div className={`help-hub-v2__guide-grid${compact ? ' help-hub-v2__guide-grid--dense' : ''}`}>
        {cards.map((card, i) => {
          const section = byId.get(card.id);
          if (!section) return null;
          return (
            <GuideCard
              key={`${card.id}-${i}`}
              section={section}
              displayTitle={card.title}
              audience={audience}
              compact={compact}
              onOpen={() => onOpen(card.id, audience)}
            />
          );
        })}
      </div>
    </section>
  );
}

function GuideCard({
  section,
  displayTitle,
  audience,
  compact,
  onOpen
}: {
  section: GuideSection;
  displayTitle: string;
  audience: HelpAudience;
  compact?: boolean;
  onOpen: () => void;
}) {
  const thumb = sectionThumb(section);
  const mins = estimateGuideMinutes(section);

  return (
    <button type="button" className={`help-hub-v2__guide-card${compact ? ' help-hub-v2__guide-card--sm' : ''}`} onClick={onOpen}>
      {!compact ? (
        <span className="help-hub-v2__guide-card-media">
          <img src={thumb} alt="" loading="lazy" decoding="async" />
        </span>
      ) : null}
      <span className="help-hub-v2__guide-card-body">
        <span className="help-hub-v2__guide-card-title">{displayTitle}</span>
        <span className="help-hub-v2__guide-card-desc">{section.summary}</span>
        <span className="help-hub-v2__guide-card-meta">
          {section.steps.length} pasos · {mins} min
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </span>
      </span>
    </button>
  );
}

export function HelpHubPage() {
  const help = useHelpState('patient');
  const [q, setQ] = useState('');

  const searchHits = useMemo(() => searchAllGuides(q), [q]);

  const patientFiltered = useMemo(
    () => filterGuideSections(helpSectionsByAudience.patient, q),
    [q]
  );
  const adminFiltered = useMemo(() => filterGuideSections(helpSectionsByAudience.admin, q), [q]);

  const showPatientGuides = !q || patientFiltered.length > 0;
  const showAdminGuides = !q || adminFiltered.length > 0;

  function selectAudienceCard(id: HelpAudience) {
    help.selectAudience(id);
    document.getElementById('help-guides')?.scrollIntoView({ behavior: 'smooth' });
  }

  function openGuide(id: string, aud: HelpAudience) {
    help.openSection(id, aud);
  }

  if (help.mode === 'guide' && help.activeSection) {
    return (
      <div className="shell help-hub-v2 help-hub-v2--stage" id="help-hub">
        <HelpGuideExperience section={help.activeSection} onClose={help.openIndex} />
      </div>
    );
  }

  if (help.mode === 'faq') {
    return (
      <div className="shell help-hub-v2" id="help-hub">
        <button type="button" className="help-hub-v2__back" onClick={help.openIndex}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Volver al centro de ayuda
        </button>
        <div className="help-hub-v2__faq-layout">
          <HelpFaqPanel audience="patient" />
          <HelpFaqPanel audience="admin" />
        </div>
      </div>
    );
  }

  return (
    <div className="help-hub-v2" id="help-hub">
      <section className="help-hub-v2__hero shell">
        <h1>Centro de ayuda Dentista+</h1>
        <p>Encuentra guías y respuestas para pacientes, clínicas y administradores.</p>
        <label className="help-hub-v2__search">
          <Search className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar ayuda sobre citas, informes, facturas, portal paciente…"
            aria-label="Buscar en el centro de ayuda"
          />
        </label>
        {q && searchHits.length > 0 ? (
          <ul className="help-hub-v2__search-hits">
            {searchHits.slice(0, 8).map(({ audience, section }) => (
              <li key={`${audience}-${section.id}`}>
                <button type="button" onClick={() => openGuide(section.id, audience)}>
                  <span className="help-hub-v2__hit-audience">{helpAudiences.find((a) => a.id === audience)?.label}</span>
                  {section.title}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {q && searchHits.length === 0 ? (
          <p className="help-hub-v2__search-empty">No hay resultados para «{q}». Prueba con otras palabras.</p>
        ) : null}
      </section>

      <section className="help-hub-v2__who shell">
        <h2>¿Quién eres?</h2>
        <div className="help-hub-v2__who-grid">
          {helpAudiences.map((a) => {
            const Icon = AUDIENCE_ICONS[a.id];
            const active = help.audience === a.id;
            return (
              <button
                key={a.id}
                type="button"
                className={`help-hub-v2__who-card help-hub-v2__who-card--${a.id}${active ? ' help-hub-v2__who-card--active' : ''}`}
                onClick={() => selectAudienceCard(a.id)}
              >
                <span className="help-hub-v2__who-icon" aria-hidden>
                  <Icon className="h-6 w-6" />
                </span>
                <span className="help-hub-v2__who-text">
                  <strong>
                  {a.id === 'patient' ? 'Soy paciente' : a.id === 'admin' ? 'Soy clínica' : 'Soy administrador'}
                </strong>
                  <span>{a.description}</span>
                </span>
                <ArrowRight className="help-hub-v2__who-arrow h-5 w-5" aria-hidden />
              </button>
            );
          })}
        </div>
      </section>

      <div className="help-hub-v2__layout shell" id="help-guides">
        <aside className="help-hub-v2__sidebar">
          <p className="help-hub-v2__sidebar-label">En esta guía</p>
          <nav aria-label="Enlaces de guías">
            {helpSidebarNav.map((group) => (
              <div key={group.label} className="help-hub-v2__sidebar-group">
                <p>{group.label}</p>
                <ul>
                  {group.links.map((link) => (
                    <li key={`${link.audience}-${link.id}-${link.label}`}>
                      <button
                        type="button"
                        className={
                          help.sectionId === link.id && help.audience === link.audience
                            ? 'help-hub-v2__sidebar-link--active'
                            : ''
                        }
                        onClick={() => openGuide(link.id, link.audience)}
                      >
                        {link.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
          <div className="help-hub-v2__sidebar-cta">
            <Headphones className="h-5 w-5 text-teal-700" aria-hidden />
            <p>
              <strong>¿Necesitas ayuda?</strong>
              <span>Nuestro equipo está disponible para ayudarte.</span>
            </p>
            <a href="/contacto" className="help-hub-v2__btn help-hub-v2__btn--primary no-underline">
              Contactar soporte
            </a>
          </div>
        </aside>

        <div className="help-hub-v2__main">
          {help.audience === 'platform' && !q ? (
            <GuideSectionBlock
              title="Guías para administradores"
              cards={platformHubCards}
              audience="platform"
              onOpen={openGuide}
            />
          ) : null}

          {showPatientGuides ? (
            <GuideSectionBlock
              title="Guías para pacientes"
              cards={patientHubCards}
              audience="patient"
              onOpen={openGuide}
            />
          ) : null}

          {showAdminGuides ? (
            <GuideSectionBlock
              title="Guías para clínicas"
              cards={adminHubCards}
              audience="admin"
              onOpen={openGuide}
              compact
            />
          ) : null}

          <section className="help-hub-v2__faq-section" id="help-faq">
            <div className="help-hub-v2__faq-head">
              <h2>Preguntas frecuentes</h2>
              <button type="button" className="help-hub-v2__link-btn" onClick={help.openFaq}>
                Ver todas
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <div className="help-hub-v2__faq-columns">
              <div>
                <p className="help-hub-v2__faq-col-label">Pacientes</p>
                <HelpFaqPanel audience="patient" compact />
              </div>
              <div>
                <p className="help-hub-v2__faq-col-label">Clínicas</p>
                <HelpFaqPanel audience="admin" compact />
              </div>
              <aside className="help-hub-v2__need-help">
                <HelpCircle className="h-8 w-8 text-teal-600" aria-hidden />
                <h3>¿Necesitas ayuda?</h3>
                <p>Escríbenos y te ayudaremos lo antes posible.</p>
                <a href="/contacto" className="help-hub-v2__btn help-hub-v2__btn--primary no-underline">
                  Contactar soporte
                </a>
              </aside>
            </div>
          </section>

          <section className="help-hub-v2__trust">
            <div>
              <BookOpen className="h-5 w-5" aria-hidden />
              <strong>Guías paso a paso</strong>
              <span>Instrucciones claras con imágenes.</span>
            </div>
            <div>
              <Sparkles className="h-5 w-5" aria-hidden />
              <strong>Siempre actualizado</strong>
              <span>Contenido revisado con frecuencia.</span>
            </div>
            <div>
              <Shield className="h-5 w-5" aria-hidden />
              <strong>Acceso seguro</strong>
              <span>Información confidencial.</span>
            </div>
            <div>
              <Users className="h-5 w-5" aria-hidden />
              <strong>Soporte real</strong>
              <span>Equipo disponible para ayudarte.</span>
            </div>
          </section>

          <p className="help-hub-v2__docs-link">
            <a href="#documentacion">Ver documentación detallada con capturas ampliadas</a>
          </p>
        </div>
      </div>

      <div id="documentacion" className="help-hub-v2__docs-anchor shell">
        <p className="text-sm text-slate-500 m-0">
          La documentación extendida se muestra al abrir cada guía desde las tarjetas superiores.
        </p>
      </div>
    </div>
  );
}

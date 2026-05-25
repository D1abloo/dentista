import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Building2,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Headphones,
  Search,
  Shield,
  Sparkles,
  User,
  Users
} from 'lucide-react';
import { HelpGuideExperience } from '@/components/help/HelpGuideExperience';
import { HelpFaqPanel } from '@/components/help/HelpFaqPanel';
import { HelpFaqPremiumSection } from '@/components/help/HelpFaqPremiumSection';
import { useHelpState } from '@/components/help/useHelpState';
import {
  audienceBadgeLabel,
  filterHubCards,
  guideAnchorId,
  helpPopularLinks,
  helpQuickAccessLinks,
  helpSectionsByAudience,
  helpSidebarNav,
  hubCardsForAudience,
  profileCardCopy,
  searchAllGuides,
  searchHelpFaqs,
  type HubGuideCard
} from '@/lib/guide/hubCatalog';
import { helpFaqHubPatient, searchHubFaqs } from '@/lib/guide/helpFaqPremium';
import { helpAudiences, sectionThumb, type HelpAudience } from '@/lib/guide/catalog';
import type { GuideSection } from '@/lib/guide/types';

const AUDIENCE_ICONS = {
  patient: User,
  admin: Building2,
  platform: Shield
} as const;

function GuideCard({
  card,
  section,
  audience,
  onOpen
}: {
  card: HubGuideCard;
  section: GuideSection;
  audience: HelpAudience;
  onOpen: () => void;
}) {
  const thumb = sectionThumb(section);
  const mins = Math.max(2, section.steps.length + (section.id === 'acceso' ? 1 : 0));
  const stepsLabel = section.id === 'acceso' ? '4 pasos' : `${section.steps.length} pasos`;

  return (
    <article id={guideAnchorId(audience, card.id)} className="help-hub-v2__guide-wrap">
      <button type="button" className="help-hub-v2__guide-card" onClick={onOpen}>
        <span className="help-hub-v2__guide-card-media">
          <img src={thumb} alt={`Captura: ${card.title}`} loading="lazy" decoding="async" />
        </span>
        <span className="help-hub-v2__guide-card-body">
          <span className={`help-hub-v2__guide-badge help-hub-v2__guide-badge--${audience}`}>
            {audienceBadgeLabel(audience)}
          </span>
          <span className="help-hub-v2__guide-card-title">{card.title}</span>
          <span className="help-hub-v2__guide-card-desc">{card.description}</span>
          <span className="help-hub-v2__guide-card-meta">
            <span>
              {stepsLabel} · {mins} min
            </span>
            <ArrowRight className="h-4 w-4" aria-hidden />
          </span>
        </span>
      </button>
    </article>
  );
}

function HelpHubAside({
  onOpenGuide
}: {
  onOpenGuide: (id: string, aud: HelpAudience) => void;
}) {
  return (
    <aside className="help-hub-v2__rail" aria-label="Recursos de ayuda">
      <div className="help-hub-v2__rail-card help-hub-v2__rail-card--accent">
        <Headphones className="h-6 w-6 text-teal-700" aria-hidden />
        <h3>¿Necesitas ayuda?</h3>
        <p>Nuestro equipo está disponible para ayudarte.</p>
        <a href="/contacto?tipo=soporte" className="help-hub-v2__btn help-hub-v2__btn--primary no-underline">
          Contactar soporte
        </a>
      </div>

      <div className="help-hub-v2__rail-card">
        <h3>Guías populares</h3>
        <ul className="help-hub-v2__rail-links">
          {helpPopularLinks.map((link) => (
            <li key={link.label}>
              <button type="button" onClick={() => onOpenGuide(link.guideId, link.audience)}>
                {link.label}
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="help-hub-v2__rail-card">
        <h3>Estado del servicio</h3>
        <p className="help-hub-v2__status">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden />
          <span>Todos los sistemas operativos</span>
        </p>
        <a href="/contacto?tipo=soporte" className="help-hub-v2__rail-muted-link">
          Informar de una incidencia
        </a>
      </div>

      <div className="help-hub-v2__rail-card">
        <h3>Accesos rápidos</h3>
        <ul className="help-hub-v2__rail-links help-hub-v2__rail-links--external">
          {helpQuickAccessLinks.map((link) => (
            <li key={link.href}>
              <a href={link.href}>
                {link.label}
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

export function HelpHubPage() {
  const help = useHelpState('patient');
  const [q, setQ] = useState('');
  const [sidebarActive, setSidebarActive] = useState<string | null>(null);

  const guideHits = useMemo(() => searchAllGuides(q), [q]);
  const faqHits = useMemo(() => {
    const hub = searchHubFaqs(q).map((f) => ({
      id: f.id,
      question: f.question,
      audience: helpFaqHubPatient.some((p) => p.id === f.id) ? ('patient' as const) : ('admin' as const)
    }));
    const catalog = searchHelpFaqs(q).map((f) => ({
      id: f.id,
      question: f.question,
      audience: f.audience === 'all' ? ('patient' as const) : f.audience
    }));
    const seen = new Set<string>();
    return [...hub, ...catalog].filter((f) => {
      if (seen.has(f.id)) return false;
      seen.add(f.id);
      return true;
    });
  }, [q]);

  const activeCards = useMemo(() => {
    const cards = hubCardsForAudience(help.audience);
    return filterHubCards(cards, q);
  }, [help.audience, q]);

  const sections = helpSectionsByAudience[help.audience];
  const byId = useMemo(() => new Map(sections.map((s) => [s.id, s])), [sections]);

  const copy = profileCardCopy[help.audience];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tipo = params.get('tipo');
    if (tipo === 'paciente' || tipo === 'patient') help.selectAudience('patient');
    if (tipo === 'clinica' || tipo === 'admin') help.selectAudience('admin');
    if (tipo === 'administrador' || tipo === 'platform') help.selectAudience('platform');
  }, []);

  function selectAudienceCard(id: HelpAudience) {
    help.selectAudience(id);
    setSidebarActive(null);
    requestAnimationFrame(() => {
      document.getElementById('help-guides')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function openGuide(id: string, aud: HelpAudience) {
    help.openSection(id, aud);
  }

  function scrollToGuide(id: string, aud: HelpAudience) {
    if (aud !== help.audience) {
      help.selectAudience(aud);
      requestAnimationFrame(() => {
        document.getElementById(guideAnchorId(aud, id))?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      return;
    }
    const el = document.getElementById(guideAnchorId(aud, id));
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setSidebarActive(id);
    } else {
      openGuide(id, aud);
    }
  }

  function handleSidebarClick(link: (typeof helpSidebarNav)[0]['links'][0]) {
    if (link.href) {
      if (link.href.startsWith('#')) {
        document.querySelector(link.href)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.location.href = link.href;
      }
      return;
    }
    scrollToGuide(link.id, link.audience);
  }

  if (help.mode === 'guide' && help.activeSection) {
    return (
      <div className="ps-shell ps-shell--wide help-hub-v2 help-hub-v2--stage" id="help-hub">
        <HelpGuideExperience section={help.activeSection} onClose={help.openIndex} />
      </div>
    );
  }

  if (help.mode === 'faq') {
    return (
      <div className="ps-shell ps-shell--wide help-hub-v2 help-hub-v2--faq-page" id="help-hub">
        <button type="button" className="help-hub-v2__back" onClick={help.openIndex}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Volver al centro de ayuda
        </button>
        <header className="help-hub-v2__faq-page-head">
          <h1>Preguntas frecuentes</h1>
          <p>Respuestas para pacientes, clínicas y administradores de la plataforma.</p>
        </header>
        <HelpFaqPremiumSection showViewAll={false} seoLead={false} />
        <div className="help-faq-premium help-faq-premium--platform">
          <h2 className="help-faq-premium__platform-title">Administradores</h2>
          <HelpFaqPanel audience="platform" premium />
        </div>
        <p className="help-hub-v2__faq-page-cta">
          <a href="/contacto?tipo=soporte" className="help-hub-v2__btn help-hub-v2__btn--primary no-underline">
            Contactar soporte
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="help-hub-v2 help-hub-v2--full" id="help-hub">
      <section className="help-hub-v2__hero help-hub-v2__hero--bleed" aria-labelledby="help-hero-title">
        <div className="ps-shell ps-shell--wide help-hub-v2__hero-inner help-hub-v2__anim-in">
          <p className="help-hub-v2__hero-kicker">
            <BookOpen className="h-4 w-4" aria-hidden />
            Centro de ayuda
          </p>
          <h1 id="help-hero-title">Centro de ayuda Dentista+</h1>
          <p className="help-hub-v2__hero-lead">
            Encuentra guías, respuestas y documentación para pacientes, clínicas y administradores. Ayuda sobre el
            portal paciente dental, reservar citas online, informes odontológicos, facturación dental y consentimiento
            digital.
          </p>
          <label className="help-hub-v2__search">
            <span className="sr-only">Buscar en el centro de ayuda</span>
            <Search className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar ayuda sobre citas, informes, facturas, portal paciente…"
            />
            <button type="button" className="help-hub-v2__search-btn">
              Buscar
            </button>
          </label>
          {q ? (
            <div className="help-hub-v2__search-results">
              {guideHits.length === 0 && faqHits.length === 0 ? (
                <p className="help-hub-v2__search-empty">No hay resultados para «{q}». Prueba con otras palabras.</p>
              ) : (
                <>
                  {guideHits.length > 0 ? (
                    <ul className="help-hub-v2__search-hits">
                      {guideHits.slice(0, 6).map(({ audience, section }) => (
                        <li key={`${audience}-${section.id}`}>
                          <button type="button" onClick={() => openGuide(section.id, audience)}>
                            <span className="help-hub-v2__hit-audience">{audienceBadgeLabel(audience)}</span>
                            {section.title}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {faqHits.length > 0 ? (
                    <ul className="help-hub-v2__search-hits help-hub-v2__search-hits--faq">
                      {faqHits.slice(0, 4).map((faq) => (
                        <li key={faq.id}>
                          <button
                            type="button"
                            onClick={() => {
                              document.getElementById('help-faq')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                          >
                            <span className="help-hub-v2__hit-audience">FAQ</span>
                            {faq.question}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </>
              )}
            </div>
          ) : null}
        </div>
      </section>

      <section className="help-hub-v2__who ps-shell ps-shell--wide" aria-labelledby="help-who-title">
        <h2 id="help-who-title" className="sr-only">
          Elige tu perfil
        </h2>
        <div className="help-hub-v2__who-grid">
          {helpAudiences.map((a, i) => {
            const Icon = AUDIENCE_ICONS[a.id];
            const active = help.audience === a.id;
            const card = profileCardCopy[a.id];
            return (
              <button
                key={a.id}
                type="button"
                className={`help-hub-v2__who-card help-hub-v2__who-card--${a.id}${active ? ' help-hub-v2__who-card--active' : ''} help-hub-v2__anim-stagger`}
                style={{ animationDelay: `${i * 60}ms` }}
                onClick={() => selectAudienceCard(a.id)}
              >
                <span className="help-hub-v2__who-icon" aria-hidden>
                  <Icon className="h-6 w-6" />
                </span>
                <span className="help-hub-v2__who-text">
                  <strong>{card.title}</strong>
                  <span>{card.text}</span>
                  <span className="help-hub-v2__who-cta">{card.cta}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="help-hub-v2__layout ps-shell ps-shell--wide" id="help-guides">
        <aside className="help-hub-v2__sidebar" aria-label="Índice de guías">
          <p className="help-hub-v2__sidebar-label">En esta guía</p>
          <nav>
            {helpSidebarNav.map((group) => (
              <div key={group.label} className="help-hub-v2__sidebar-group">
                <p>{group.label}</p>
                <ul>
                  {group.links.map((link) => (
                    <li key={`${link.audience}-${link.id}-${link.label}`}>
                      <button
                        type="button"
                        className={
                          sidebarActive === link.id && !link.href
                            ? 'help-hub-v2__sidebar-link--active'
                            : ''
                        }
                        onClick={() => handleSidebarClick(link)}
                      >
                        {link.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        <div className="help-hub-v2__main">
          <section className="help-hub-v2__featured" aria-labelledby="help-featured-title">
            <div className="help-hub-v2__block-head">
              <h2 id="help-featured-title">{copy.featuredTitle}</h2>
              {q ? <span className="help-hub-v2__filter-hint">{activeCards.length} resultados</span> : null}
            </div>
            {activeCards.length === 0 ? (
              <p className="help-hub-v2__empty">No hay guías que coincidan con tu búsqueda en este perfil.</p>
            ) : (
              <div className="help-hub-v2__guide-grid help-hub-v2__guide-grid--featured">
                {activeCards.map((card, i) => {
                  const section = byId.get(card.id);
                  if (!section) return null;
                  return (
                    <GuideCard
                      key={`${card.id}-${card.title}-${i}`}
                      card={card}
                      section={section}
                      audience={help.audience}
                      onOpen={() => openGuide(card.id, help.audience)}
                    />
                  );
                })}
              </div>
            )}
            <p className="help-hub-v2__view-all">
              <button type="button" className="help-hub-v2__link-btn" onClick={help.openFaq}>
                Ver documentación completa (FAQ)
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            </p>
          </section>

        </div>

        <HelpHubAside onOpenGuide={openGuide} />
      </div>

      <div className="ps-shell ps-shell--wide help-hub-v2__faq-band">
        <HelpFaqPremiumSection onViewAll={help.openFaq} />
      </div>

      <section className="help-hub-v2__trust ps-shell ps-shell--wide" aria-label="Ventajas del centro de ayuda">
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
          <span>Información confidencial protegida.</span>
        </div>
        <div>
          <Users className="h-5 w-5" aria-hidden />
          <strong>Soporte real</strong>
          <span>Equipo disponible para ayudarte.</span>
        </div>
      </section>

      <section className="help-hub-v2__cta" aria-labelledby="help-cta-title">
        <div className="ps-shell ps-shell--wide help-hub-v2__cta-inner">
          <div>
            <h2 id="help-cta-title">¿No encuentras lo que buscas?</h2>
            <p>Contacta con soporte y te ayudamos a resolverlo. Software dental con soporte humano.</p>
          </div>
          <div className="help-hub-v2__cta-actions">
            <a href="/contacto?tipo=soporte" className="help-hub-v2__btn help-hub-v2__btn--primary no-underline">
              <Headphones className="h-4 w-4" aria-hidden />
              Contactar soporte
            </a>
            <button type="button" className="help-hub-v2__btn help-hub-v2__btn--ghost" onClick={help.openFaq}>
              Ver documentación completa
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Building2,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Headphones,
  Loader2,
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
  hubCardMetaLabel,
  hubCardsForAudience,
  profileCardCopy,
  searchAllGuides,
  searchHelpFaqs,
  type HubGuideCard
} from '@/lib/guide/hubCatalog';
import { searchHubFaqs } from '@/lib/guide/helpFaqPremium';
import { helpAudiences, sectionThumb, type HelpAudience } from '@/lib/guide/catalog';
import type { GuideSection } from '@/lib/guide/types';

const AUDIENCE_ICONS = {
  patient: User,
  admin: Building2,
  platform: Shield
} as const;

type GuideFilter = 'all' | HelpAudience;
type LoadState = 'loading' | 'ready' | 'error';

const GUIDE_FILTERS: { id: GuideFilter; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'patient', label: 'Paciente' },
  { id: 'admin', label: 'Clínica' },
  { id: 'platform', label: 'Administrador' }
];

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
  const meta = hubCardMetaLabel(section.id, section);

  return (
    <article id={guideAnchorId(audience, card.id)} className="help-hub-v2__guide-wrap">
      <button type="button" className="help-hub-v2__guide-card" onClick={onOpen}>
        <span className="help-hub-v2__guide-card-media">
          <img
            src={thumb}
            alt={`Captura de la guía ${card.title} en AgendaClinic`}
            loading="lazy"
            decoding="async"
          />
        </span>
        <span className="help-hub-v2__guide-card-body">
          <span className={`help-hub-v2__guide-badge help-hub-v2__guide-badge--${audience}`}>
            {audienceBadgeLabel(audience)}
          </span>
          <span className="help-hub-v2__guide-card-title">{card.title}</span>
          <span className="help-hub-v2__guide-card-desc">{card.description}</span>
          <span className="help-hub-v2__guide-card-meta">
            <span>{meta}</span>
            <span className="help-hub-v2__guide-card-cta">
              Ver guía
              <ArrowRight className="h-4 w-4" aria-hidden />
            </span>
          </span>
        </span>
      </button>
    </article>
  );
}

function HelpHubAside({ onOpenGuide }: { onOpenGuide: (id: string, aud: HelpAudience) => void }) {
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
        <a href="/contacto?tipo=soporte&mensaje=Consulta+estado+de+servicios" className="help-hub-v2__rail-muted-link">
          Ver estado detallado
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

function collectGuideEntries(filter: GuideFilter, query: string) {
  const audiences: HelpAudience[] =
    filter === 'all' ? ['patient', 'admin', 'platform'] : [filter];
  const out: { audience: HelpAudience; card: HubGuideCard; section: GuideSection }[] = [];
  for (const aud of audiences) {
    const cards = filterHubCards(hubCardsForAudience(aud), query);
    const sections = helpSectionsByAudience[aud];
    const byId = new Map(sections.map((s) => [s.id, s]));
    for (const card of cards) {
      const sectionId = card.sectionId ?? card.id;
      const section = byId.get(sectionId);
      if (section) out.push({ audience: aud, card, section });
    }
  }
  return out;
}

export function HelpHubPage() {
  const help = useHelpState('patient');
  const [q, setQ] = useState('');
  const [submittedQ, setSubmittedQ] = useState('');
  const [guideFilter, setGuideFilter] = useState<GuideFilter>('all');
  const [sidebarActive, setSidebarActive] = useState<string | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const searchTerm = submittedQ || q;

  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        const ok =
          helpSectionsByAudience.patient.length > 0 &&
          helpSectionsByAudience.admin.length > 0 &&
          helpSectionsByAudience.platform.length > 0;
        setLoadState(ok ? 'ready' : 'error');
      } catch {
        setLoadState('error');
      }
    }, 280);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tipo = params.get('tipo');
    if (tipo === 'paciente' || tipo === 'patient') help.selectAudience('patient');
    if (tipo === 'clinica' || tipo === 'admin') help.selectAudience('admin');
    if (tipo === 'administrador' || tipo === 'platform') help.selectAudience('platform');
    const hash = window.location.hash.replace('#', '');
    if (hash === 'faq') help.openFaq();
  }, []);

  useEffect(() => {
    setGuideFilter(help.audience);
  }, [help.audience]);

  const guideHits = useMemo(() => searchAllGuides(searchTerm), [searchTerm]);
  const faqHits = useMemo(() => {
    const hub = searchHubFaqs(searchTerm);
    const catalog = searchHelpFaqs(searchTerm);
    const seen = new Set<string>();
    const merged: { id: string; question: string }[] = [];
    for (const f of [...hub, ...catalog]) {
      if (seen.has(f.id)) continue;
      seen.add(f.id);
      merged.push({ id: f.id, question: f.question });
    }
    return merged;
  }, [searchTerm]);

  const guideEntries = useMemo(() => {
    if (loadState !== 'ready') return [];
    return collectGuideEntries(guideFilter, searchTerm);
  }, [guideFilter, searchTerm, loadState]);

  function onSearchSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmittedQ(q.trim());
    document.getElementById('help-guides')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function selectAudienceCard(id: HelpAudience) {
    help.selectAudience(id);
    setGuideFilter(id);
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
      setGuideFilter(aud);
    }
    requestAnimationFrame(() => {
      const el = document.getElementById(guideAnchorId(aud, id));
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setSidebarActive(id);
      } else {
        openGuide(id, aud);
      }
    });
    setSidebarOpen(false);
  }

  function handleSidebarClick(link: (typeof helpSidebarNav)[0]['links'][0]) {
    if (link.href) {
      if (link.href.startsWith('#')) {
        document.querySelector(link.href)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.location.href = link.href;
      }
      setSidebarOpen(false);
      return;
    }
    scrollToGuide(link.id, link.audience);
  }

  if (help.mode === 'guide' && help.activeSection) {
    return (
      <div className="help-hub-v2 help-hub-v2--stage ps-shell ps-shell--wide" id="help-hub">
        <HelpGuideExperience section={help.activeSection} onClose={help.openIndex} />
        <p className="help-hub-v2__guide-support">
          <a href="/contacto?tipo=soporte" className="help-hub-v2__btn help-hub-v2__btn--outline no-underline">
            Contactar soporte
          </a>
        </p>
      </div>
    );
  }

  if (help.mode === 'faq') {
    return (
      <div className="help-hub-v2 help-hub-v2--faq-page ps-shell ps-shell--wide" id="help-hub">
        <button type="button" className="help-hub-v2__back" onClick={help.openIndex}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Volver al centro de ayuda
        </button>
        <header className="help-hub-v2__faq-page-head">
          <h1>Preguntas frecuentes</h1>
          <p>Respuestas para pacientes, clínicas y administradores de la plataforma.</p>
        </header>
        <HelpFaqPremiumSection showViewAll={false} seoLead={false} activeAudience={help.audience} />
        <div className="help-faq-premium help-faq-premium--platform-only">
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
        <div className="help-hub-v2__hero-deco" aria-hidden />
        <div className="ps-shell ps-shell--wide help-hub-v2__hero-inner help-hub-v2__anim-in">
          <p className="help-hub-v2__hero-kicker">
            <BookOpen className="h-4 w-4" aria-hidden />
            Centro de ayuda
          </p>
          <h1 id="help-hero-title">Centro de ayuda AgendaClinic</h1>
          <p className="help-hub-v2__hero-lead">
            Encuentra guías, respuestas y documentación para pacientes, clínicas y administradores.
          </p>
          <form className="help-hub-v2__search" onSubmit={onSearchSubmit}>
            <label className="sr-only" htmlFor="help-hub-search">
              Buscar en el centro de ayuda
            </label>
            <Search className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
            <input
              id="help-hub-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar ayuda sobre citas, informes, facturas, portal paciente…"
            />
            <button type="submit" className="help-hub-v2__search-btn">
              Buscar
            </button>
          </form>
          {searchTerm ? (
            <div className="help-hub-v2__search-results" role="region" aria-live="polite">
              {guideHits.length === 0 && faqHits.length === 0 ? (
                <p className="help-hub-v2__search-empty">No se encontraron resultados.</p>
              ) : (
                <>
                  {guideHits.length > 0 ? (
                    <ul className="help-hub-v2__search-hits">
                      {guideHits.slice(0, 8).map(({ audience, section }) => (
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
                      {faqHits.slice(0, 5).map((faq) => (
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
                aria-pressed={active}
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
        <details
          className="help-hub-v2__sidebar-mobile"
          open={sidebarOpen}
          onToggle={(e) => setSidebarOpen(e.currentTarget.open)}
        >
          <summary>En esta guía</summary>
          <nav className="help-hub-v2__sidebar-tabs" aria-label="Índice de guías en tablet">
            {helpSidebarNav[0]?.links.map((link) => (
              <button
                key={`tab-${link.audience}-${link.id}-${link.label}`}
                type="button"
                className={sidebarActive === link.id && !link.href ? 'help-hub-v2__sidebar-tab--active' : ''}
                onClick={() => handleSidebarClick(link)}
              >
                {link.label}
              </button>
            ))}
          </nav>
        </details>

        <aside className="help-hub-v2__sidebar" aria-label="Índice de guías">
          <p className="help-hub-v2__sidebar-label">En esta guía</p>
          <nav>
            {helpSidebarNav.map((group) => (
              <div key={group.label} className="help-hub-v2__sidebar-group">
                <ul>
                  {group.links.map((link) => (
                    <li key={`${link.audience}-${link.id}-${link.label}`}>
                      <button
                        type="button"
                        className={
                          sidebarActive === link.id && !link.href ? 'help-hub-v2__sidebar-link--active' : ''
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
              <h2 id="help-featured-title">Guías destacadas</h2>
              {searchTerm ? (
                <span className="help-hub-v2__filter-hint">{guideEntries.length} resultados</span>
              ) : null}
            </div>

            <div className="help-hub-v2__guide-filters" role="tablist" aria-label="Filtrar guías por perfil">
              {GUIDE_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  role="tab"
                  aria-selected={guideFilter === f.id}
                  className={`help-hub-v2__guide-filter${guideFilter === f.id ? ' help-hub-v2__guide-filter--active' : ''}`}
                  onClick={() => setGuideFilter(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {loadState === 'loading' ? (
              <p className="help-hub-v2__state help-hub-v2__state--loading" role="status">
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                Cargando guías…
              </p>
            ) : loadState === 'error' ? (
              <p className="help-hub-v2__state help-hub-v2__state--error" role="alert">
                No se pudieron cargar las guías.
              </p>
            ) : guideEntries.length === 0 ? (
              <p className="help-hub-v2__empty" role="status">
                {searchTerm
                  ? 'No se encontraron resultados. Selecciona otro perfil o cambia la búsqueda.'
                  : 'No hay guías que coincidan con tu búsqueda en este perfil.'}
              </p>
            ) : (
              <div className="help-hub-v2__guide-grid help-hub-v2__guide-grid--featured">
                {guideEntries.map(({ audience, card, section }, i) => (
                  <GuideCard
                    key={`${audience}-${card.id}-${card.title}-${i}`}
                    card={card}
                    section={section}
                    audience={audience}
                    onOpen={() => openGuide(card.sectionId ?? card.id, audience)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        <HelpHubAside onOpenGuide={openGuide} />
      </div>

      <div className="ps-shell ps-shell--wide help-hub-v2__faq-band">
        <HelpFaqPremiumSection searchQuery={searchTerm} activeAudience={help.audience} />
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
            <p>Contacta con soporte y te ayudamos a resolverlo.</p>
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

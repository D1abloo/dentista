import { ArrowRight, CircleHelp, ExternalLink } from 'lucide-react';
import { helpAudiences, helpQuickLinks, type HelpAudience } from '@/lib/guide/catalog';
import { HelpTopicGrid } from '@/components/help/HelpTopicGrid';

export function HelpHubHome({
  audience,
  onAudience,
  onTopic,
  onFaq
}: {
  audience: HelpAudience;
  onAudience: (a: HelpAudience) => void;
  onTopic: (id: string) => void;
  onFaq: () => void;
}) {
  const meta = helpAudiences.find((a) => a.id === audience);

  return (
    <div className="help-hub__home">
      <section className="help-hub__intro">
        <h2>¿Qué necesitas hacer?</h2>
        <p>{meta?.description}</p>
      </section>

      <div className="help-hub__tabs" role="tablist">
        {helpAudiences.map((a) => (
          <button
            key={a.id}
            type="button"
            role="tab"
            aria-selected={audience === a.id}
            className={audience === a.id ? 'help-hub__tab--on' : ''}
            onClick={() => onAudience(a.id)}
          >
            {a.label}
          </button>
        ))}
      </div>

      <HelpTopicGrid audience={audience} onSelect={onTopic} />

      <section className="help-hub__shortcuts">
        <h3>Accesos directos</h3>
        <ul>
          {helpQuickLinks.map((link) => (
            <li key={link.id}>
              <a href={link.href}>
                <span>
                  <strong>{link.label}</strong>
                  <small>{link.description}</small>
                </span>
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            </li>
          ))}
        </ul>
      </section>

      <button type="button" className="help-hub__faq-banner" onClick={onFaq}>
        <CircleHelp className="h-5 w-5" aria-hidden />
        <span>
          <strong>Preguntas frecuentes</strong>
          <small>Respuestas rápidas sin leer la guía completa</small>
        </span>
        <ArrowRight className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}

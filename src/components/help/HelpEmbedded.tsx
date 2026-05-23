import { ArrowRight } from 'lucide-react';
import { helpHashAudience, helpSectionsByAudience, sectionThumb, type HelpAudience } from '@/lib/guide/catalog';

/** Vista compacta: tarjetas que enlazan al centro de ayuda completo. */
export function HelpEmbedded({ audience = 'patient' }: { audience?: HelpAudience }) {
  const sections = helpSectionsByAudience[audience];
  const hubHash = helpHashAudience(audience);

  return (
    <div className="help-embedded-v2">
      <p className="help-embedded-v2__lead">
        Elige un tema o abre el{' '}
        <a href={`/ayuda${hubHash}`}>centro de ayuda</a> con capturas reales del portal.
      </p>
      <div className="help-embedded-v2__grid">
        {sections.map((s) => (
          <a key={s.id} href={`/ayuda#${s.id}`} className="help-embedded-v2__card">
            <img src={sectionThumb(s)} alt="" loading="lazy" />
            <span>
              <strong>{s.title}</strong>
              <small>{s.steps.length} pasos</small>
            </span>
            <ArrowRight className="h-4 w-4" aria-hidden />
          </a>
        ))}
      </div>
    </div>
  );
}

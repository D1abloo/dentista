import { LEGAL_ENTITY, type LegalSection } from '@/lib/legal/content';
import { PublicSiteShell } from './PublicSiteShell';

function LegalBody({ sections }: { sections: LegalSection[] }) {
  return (
    <div className="legal-doc">
      <p className="legal-doc__meta">
        Última actualización: <strong>{LEGAL_ENTITY.lastUpdated}</strong> · Responsable: {LEGAL_ENTITY.operator} ·{' '}
        <a href={`mailto:${LEGAL_ENTITY.email}`}>{LEGAL_ENTITY.email}</a>
      </p>
      <nav className="legal-doc__toc" aria-label="Índice">
        <p className="legal-doc__toc-title">Índice</p>
        <ol>
          {sections.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`}>{s.title}</a>
            </li>
          ))}
        </ol>
      </nav>
      {sections.map((section) => (
        <section key={section.id} id={section.id} className="legal-doc__section">
          <h2>{section.title}</h2>
          {section.paragraphs.map((p) => (
            <p key={p.slice(0, 40)}>{p}</p>
          ))}
          {section.list ? (
            <ul>
              {section.list.map((item) => (
                <li key={item.slice(0, 48)}>{item}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
      <aside className="legal-doc__contact">
        <h3>Contacto legal</h3>
        <p>
          {LEGAL_ENTITY.operator} — {LEGAL_ENTITY.appName}
          <br />
          Email: <a href={`mailto:${LEGAL_ENTITY.email}`}>{LEGAL_ENTITY.email}</a>
        </p>
      </aside>
    </div>
  );
}

export function LegalPage({
  title,
  intro,
  sections
}: {
  title: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <PublicSiteShell>
      <main className="legal-page shell ac-page ac-page--legal" id="main-content">
        <h1>{title}</h1>
        <p className="legal-page__intro">{intro}</p>
        <LegalBody sections={sections} />
      </main>
    </PublicSiteShell>
  );
}

import type { GuideSection } from '@/lib/guide/types';
import { adminGuideSections, patientGuideSections } from '@/lib/guide/content';

function DocBlock({ section, domId }: { section: GuideSection; domId?: string }) {
  return (
    <article id={domId ?? section.id} className="help-doc">
      <h2 className="help-doc__title">{section.title}</h2>
      <p className="help-doc__summary">{section.summary}</p>
      <p className="help-doc__goal">
        <strong>Objetivo:</strong> {section.goal}
      </p>
      <p className="help-doc__audience">
        <strong>Para quién:</strong> {section.audience}
      </p>

      {section.prerequisites?.length ? (
        <div className="help-doc__block">
          <h3>Requisitos previos</h3>
          <ul>
            {section.prerequisites.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {section.screenshots.map((shot) => (
        <figure key={shot.src} className="help-doc__figure">
          <img src={shot.src} alt={shot.alt} loading="lazy" width={320} height={640} />
          <figcaption>{shot.caption}</figcaption>
        </figure>
      ))}

      <div className="help-doc__block">
        <h3>Pasos detallados</h3>
        <ol className="help-doc__steps">
          {section.steps.map((step) => (
            <li key={step.title}>
              <strong>{step.title}</strong>
              <p>{step.detail}</p>
            </li>
          ))}
        </ol>
      </div>

      {section.tips?.length ? (
        <div className="help-doc__block help-doc__block--tip">
          <h3>Consejos</h3>
          <ul>
            {section.tips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {section.warnings?.length ? (
        <div className="help-doc__block help-doc__block--warn">
          <h3>Importante</h3>
          <ul>
            {section.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}

export function HelpDocsPage() {
  return (
    <div className="help-docs">
      <header className="help-docs__intro shell">
        <h1>Guía detallada Dentista+</h1>
        <p>
          Documentación del portal del paciente y del panel de clínica: capturas, pasos, requisitos y
          advertencias para el día a día.
        </p>
        <nav className="help-docs__toc" aria-label="Índice">
          <div>
            <p className="help-docs__toc-label">Portal paciente</p>
            {patientGuideSections.map((s) => (
              <a key={s.id} href={`#${s.id}`}>
                {s.title}
              </a>
            ))}
          </div>
          <div>
            <p className="help-docs__toc-label">Panel clínica</p>
            {adminGuideSections.map((s) => (
              <a key={s.id} href={`#admin-${s.id}`}>
                {s.title}
              </a>
            ))}
          </div>
        </nav>
      </header>

      <section className="help-docs__group shell" aria-labelledby="help-patient-h">
        <h2 id="help-patient-h" className="help-docs__group-title">
          Portal del paciente
        </h2>
        {patientGuideSections.map((s) => (
          <DocBlock key={s.id} section={s} />
        ))}
      </section>

      <section className="help-docs__group shell" aria-labelledby="help-admin-h">
        <h2 id="help-admin-h" className="help-docs__group-title">
          Panel de clínica
        </h2>
        {adminGuideSections.map((s) => (
          <DocBlock key={s.id} section={s} domId={`admin-${s.id}`} />
        ))}
      </section>
    </div>
  );
}

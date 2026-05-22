import { useState } from 'react';
import { clinicShowcases } from '@/data/landingShowcases';

const tabs = [
  {
    id: 'agenda',
    title: 'Agenda clínica',
    text: 'Vista diaria, semanal y por profesional.',
    imageKey: 'admin-agenda'
  },
  {
    id: 'pacientes',
    title: 'Pacientes y expedientes',
    text: 'Historial, documentos e informes accesibles.',
    imageKey: 'admin-pacientes'
  },
  {
    id: 'facturacion',
    title: 'Facturación y pagos',
    text: 'Cobros, estados y PDFs con imagen de tu clínica.',
    imageKey: 'admin-facturas'
  }
] as const;

export function FeatureShowcaseTabs() {
  const [active, setActive] = useState<(typeof tabs)[number]['id']>('agenda');
  const current = tabs.find((t) => t.id === active) ?? tabs[0];
  const showcase = clinicShowcases.find((s) => s.src.includes(current.imageKey)) ?? clinicShowcases[1];

  return (
    <div className="pro-tabs">
      <div className="pro-tabs__list" role="tablist" aria-label="Módulos del producto">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={active === t.id}
            aria-controls={`panel-${t.id}`}
            className={`pro-tabs__btn${active === t.id ? ' pro-tabs__btn--active' : ''}`}
            onClick={() => setActive(t.id)}
          >
            <span className="pro-tabs__btn-title">{t.title}</span>
            <span className="pro-tabs__btn-text">{t.text}</span>
          </button>
        ))}
      </div>
      <div
        className="pro-tabs__panel"
        role="tabpanel"
        id={`panel-${active}`}
        aria-labelledby={`tab-${active}`}
      >
        <img src={showcase.src} alt={showcase.title} width={360} height={720} loading="lazy" />
        <div className="pro-tabs__panel-copy">
          <h3>{current.title}</h3>
          <p>{current.text}</p>
          <p className="pro-tabs__panel-desc">{showcase.description}</p>
          <div className="pro-tabs__tags">
            {showcase.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
          <a href="/login/admin" className="btn btn--outline-teal btn--sm">
            Ver panel de clínica
          </a>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';

const modules = [
  {
    id: 'agenda',
    title: 'Agenda clínica',
    text: 'Vista diaria, semanal y por profesional.',
    src: '/images/guides/mobile/admin-agenda.png',
    alt: 'Vista de agenda clínica con columnas por profesional'
  },
  {
    id: 'pacientes',
    title: 'Pacientes y expedientes',
    text: 'Historial, documentos e informes accesibles.',
    src: '/images/guides/mobile/admin-pacientes.png',
    alt: 'Ficha de paciente con historial y tratamientos'
  },
  {
    id: 'facturacion',
    title: 'Facturación y pagos',
    text: 'Cobros, estados y PDFs con imagen de tu clínica.',
    src: '/images/guides/mobile/admin-facturas.png',
    alt: 'Factura digital con opciones de descarga y envío'
  }
] as const;

export function FeatureShowcaseGrid() {
  const [active, setActive] = useState<(typeof modules)[number]['id']>('agenda');

  return (
    <div className="pro-features-grid">
      {modules.map((m) => (
        <article
          key={m.id}
          className={`pro-feature-card${active === m.id ? ' pro-feature-card--active' : ''}`}
          onMouseEnter={() => setActive(m.id)}
          onFocus={() => setActive(m.id)}
        >
          <div className="pro-device-frame">
            <div className="pro-device-frame__chrome" aria-hidden>
              <span />
              <span />
              <span />
            </div>
            <img src={m.src} alt={m.alt} width={400} height={280} loading="lazy" />
          </div>
          <h3>{m.title}</h3>
          <p>{m.text}</p>
          <a href="/registro-clinica" className="pro-feature-card__link">
            Ver módulo en el panel
            <ArrowRight className="h-4 w-4" aria-hidden />
          </a>
        </article>
      ))}
    </div>
  );
}

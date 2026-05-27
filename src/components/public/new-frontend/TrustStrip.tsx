import { ResponsiveContainer } from './ResponsiveContainer'

const LOGOS = [
  'Clínica Dental Nova',
  'Sonrisa Clínica Dental',
  'Dental Horizonte',
  'Clínica Mediterráneo',
  'Dental Plus'
] as const

const METRICS = [
  { value: '+50', label: 'clínicas digitalizadas' },
  { value: '+12.000', label: 'citas gestionadas' },
  { value: '+8.000', label: 'documentos compartidos' },
  { value: '99,9%', label: 'disponibilidad' }
] as const

export function TrustStrip() {
  return (
    <section className="ac-trust" aria-labelledby="ac-trust-title">
      <ResponsiveContainer wide>
        <h2 id="ac-trust-title" className="ac-trust__title">
          Clínicas que confían en AgendaClinic
        </h2>
        <div className="ac-trust__logos" aria-label="Clínicas de referencia">
          {LOGOS.map((name) => (
            <span key={name} className="ac-trust__logo">
              {name}
            </span>
          ))}
        </div>
        <div className="ac-trust__metrics">
          {METRICS.map((metric) => (
            <article key={metric.label} className="ac-trust__metric">
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
            </article>
          ))}
        </div>
      </ResponsiveContainer>
    </section>
  )
}

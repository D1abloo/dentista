import { Database, Scale, Server } from 'lucide-react'
import { ResponsiveContainer } from './ResponsiveContainer'

const PILLARS = [
  {
    title: 'RGPD y cumplimiento legal',
    text: 'Gestiona la información de tus pacientes conforme al RGPD y a las exigencias del ámbito sanitario.',
    tags: ['Cumplimiento legal', 'RGPD'],
    Icon: Scale
  },
  {
    title: 'Copias de seguridad',
    text: 'La información de tu clínica se respalda automáticamente. Accede a historias clínicas con tranquilidad.',
    tags: ['Backup diario', 'Protección continua'],
    Icon: Database
  },
  {
    title: 'Infraestructura segura',
    text: 'Datos en servidores de la Unión Europea, cifrado en tránsito y en reposo, y políticas RLS por clínica.',
    tags: ['Servidores UE', 'Cifrado'],
    Icon: Server
  }
] as const

export function SecurityTrustSection() {
  return (
    <section className="ac-section ac-section--security" aria-labelledby="ac-security-title">
      <ResponsiveContainer wide>
        <header className="ac-section__head ac-section__head--center">
          <h2 id="ac-security-title">Los datos de tus pacientes, protegidos</h2>
          <p>Toda la información protegida de principio a fin, cumpliendo siempre con el RGPD.</p>
        </header>
        <div className="ac-grid ac-grid--3">
          {PILLARS.map((pillar) => {
            const Icon = pillar.Icon
            return (
              <article key={pillar.title} className="ac-card ac-card--security">
                <span className="ac-card__icon">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h3>{pillar.title}</h3>
                <p>{pillar.text}</p>
                <div className="ac-card__tags">
                  {pillar.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              </article>
            )
          })}
        </div>
        <p className="ac-section__footnote">
          <a href="/privacidad">Ver más sobre protección de datos</a>
        </p>
      </ResponsiveContainer>
    </section>
  )
}

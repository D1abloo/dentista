import { BookOpenCheck, Building2, UserRound } from 'lucide-react'
import { ResponsiveContainer } from './ResponsiveContainer'

const CARDS = [
  { title: 'Guías para pacientes', Icon: UserRound, text: 'Acceso, citas, documentos, facturas y portal.' },
  { title: 'Guías para clínicas', Icon: Building2, text: 'Agenda, profesionales, informes y facturación.' },
  { title: 'Guías para administradores', Icon: BookOpenCheck, text: 'Organizaciones, seguridad y auditoría.' }
] as const

export function HelpPreviewSection() {
  return (
    <section id="ayuda" className="ac-section ac-section--surface" aria-labelledby="ac-help-title">
      <ResponsiveContainer wide>
        <header className="ac-section__head">
          <p className="ac-kicker">Centro de ayuda</p>
          <h2 id="ac-help-title">¿Necesitas ayuda?</h2>
        </header>
        <div className="ac-grid ac-grid--3">
          {CARDS.map((card) => {
            const Icon = card.Icon
            return (
              <article key={card.title} className="ac-card">
                <span className="ac-card__icon">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </article>
            )
          })}
        </div>
        <div className="ac-help__action">
          <a href="/ayuda" className="ac-btn ac-btn--secondary">
            Ir al centro de ayuda
          </a>
        </div>
      </ResponsiveContainer>
    </section>
  )
}

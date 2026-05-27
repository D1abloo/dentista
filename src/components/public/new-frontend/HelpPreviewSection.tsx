import { BookOpenCheck, Building2, CircleHelp, UserRound } from 'lucide-react'
import { ResponsiveContainer } from './ResponsiveContainer'

const CARDS = [
  { title: 'Guías para pacientes', text: 'Reservas, portal, documentos, facturas y consentimientos.', href: '/ayuda', Icon: UserRound },
  { title: 'Guías para clínicas', text: 'Agenda, pacientes, informes, facturación y bloqueos.', href: '/ayuda', Icon: Building2 },
  { title: 'Guías para administradores', text: 'Organizaciones, multi-sede, seguridad y auditoría.', href: '/ayuda', Icon: BookOpenCheck },
  { title: 'Preguntas frecuentes', text: 'Respuestas rápidas a las dudas más habituales.', href: '/ayuda', Icon: CircleHelp }
] as const

export function HelpPreviewSection() {
  return (
    <section id="ayuda" className="ac-section ac-section--band" aria-labelledby="ac-help-title">
      <ResponsiveContainer wide>
        <header className="ac-section__head ac-section__head--center">
          <p className="ac-kicker">Centro de ayuda</p>
          <h2 id="ac-help-title">Centro de ayuda AgendaClinic</h2>
          <p>Guías, preguntas frecuentes y soporte para pacientes, clínicas y administradores.</p>
        </header>
        <div className="ac-grid ac-grid--4">
          {CARDS.map((card) => {
            const Icon = card.Icon
            return (
              <article key={card.title} className="ac-card ac-card--help">
                <span className="ac-card__icon">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
                <a href={card.href} className="ac-btn ac-btn--secondary ac-btn--sm">
                  Leer guía
                </a>
              </article>
            )
          })}
        </div>
        <div className="ac-help__action">
          <a href="/ayuda" className="ac-btn ac-btn--primary">
            Ir al centro de ayuda
          </a>
        </div>
      </ResponsiveContainer>
    </section>
  )
}

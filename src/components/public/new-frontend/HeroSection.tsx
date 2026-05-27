import { ArrowRight, Bot, CalendarDays, Smartphone } from 'lucide-react'
import { ResponsiveContainer } from './ResponsiveContainer'

type Props = {
  onOpenDemo: () => void
}

export function HeroSection({ onOpenDemo }: Props) {
  return (
    <section className="ac-hero" id="inicio" aria-labelledby="ac-hero-title">
      <ResponsiveContainer wide className="ac-hero__layout">
        <div className="ac-hero__copy">
          <p className="ac-kicker">AgendaClinic · Gestión inteligente de citas</p>
          <h1 id="ac-hero-title">Gestiona citas, pacientes y agenda clínica desde una sola plataforma</h1>
          <p>
            AgendaClinic conecta reservas online, portal del paciente, agenda clínica, informes, documentos,
            facturación y pagos en un entorno seguro.
          </p>
          <div className="ac-hero__actions">
            <a href="/citas-con-ia" className="ac-btn ac-btn--primary">
              Reservar con IA
              <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
            <a href="#citas-ia" className="ac-btn ac-btn--secondary">
              Consultar mis citas
            </a>
            <button type="button" className="ac-btn ac-btn--ghost" onClick={onOpenDemo}>
              Solicitar demo
            </button>
          </div>
        </div>

        <div className="ac-hero__visual" aria-label="Vistas de AgendaClinic">
          <article className="ac-hero-card ac-hero-card--assistant">
            <header>
              <Bot className="h-4 w-4" aria-hidden />
              Asistente de citas con IA
            </header>
            <p>“Hola, puedo reservar, revisar o cambiar tus citas. ¿Qué necesitas hoy?”</p>
          </article>
          <article className="ac-hero-card ac-hero-card--agenda">
            <header>
              <CalendarDays className="h-4 w-4" aria-hidden />
              Agenda clínica
            </header>
            <p>Vista diaria, bloqueos, profesionales y citas confirmadas en tiempo real.</p>
          </article>
          <article className="ac-hero-card ac-hero-card--portal">
            <header>
              <Smartphone className="h-4 w-4" aria-hidden />
              Portal paciente móvil
            </header>
            <p>Citas, informes, facturas y consentimientos desde cualquier dispositivo.</p>
          </article>
        </div>
      </ResponsiveContainer>
    </section>
  )
}

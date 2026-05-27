import { ArrowRight } from 'lucide-react'
import { LandingHeroMocks } from '@/components/public/LandingHeroMocks'
import { ResponsiveContainer } from './ResponsiveContainer'

type Props = {
  onOpenDemo: () => void
}

export function HeroSection({ onOpenDemo }: Props) {
  return (
    <section className="ac-hero" id="inicio" aria-labelledby="ac-hero-title">
      <ResponsiveContainer wide className="ac-hero__layout">
        <div className="ac-hero__copy">
          <p className="ac-kicker">AgendaClinic</p>
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
            <button type="button" className="ac-btn ac-btn--secondary" onClick={onOpenDemo}>
              Solicitar demo
            </button>
            <a href="/portal-paciente" className="ac-btn ac-btn--ghost">
              Entrar al portal paciente
            </a>
          </div>
        </div>
        <div className="ac-hero__visual" aria-label="Vista de producto AgendaClinic">
          <LandingHeroMocks />
        </div>
      </ResponsiveContainer>
    </section>
  )
}

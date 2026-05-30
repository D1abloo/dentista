import { ArrowRight } from 'lucide-react'
import { DentalContainer } from './DentalContainer'

type Props = {
  onOpenDemo: () => void
}

export const DentalFinalCta = ({ onOpenDemo }: Props) => (
  <section className="adb-final-cta" aria-labelledby="adb-final-title">
    <DentalContainer wide>
      <div className="adb-final-cta__inner">
        <h2 id="adb-final-title">Empieza a gestionar citas online con AgendaClinic</h2>
        <p>Reserva online, consulta rápida, agenda clínica y portal paciente en una sola plataforma.</p>
        <div className="adb-final-cta__actions">
          <a href="/citas-con-ia" className="adb-btn adb-btn--primary">
            Reservar cita online
            <ArrowRight className="h-4 w-4" aria-hidden />
          </a>
          <a href="#consulta-cita" className="adb-btn adb-btn--secondary">
            Consultar mi cita
          </a>
          <button type="button" className="adb-btn adb-btn--ghost" onClick={onOpenDemo}>
            Solicitar demo
          </button>
        </div>
      </div>
    </DentalContainer>
  </section>
)

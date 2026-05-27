import { AiAppointmentsAssistant } from '@/components/public/ai-booking/AiBookingAssistant'
import { useAiAppointmentsFlow } from '@/components/public/ai-booking/useAiAppointmentsFlow'
import { ResponsiveContainer } from './ResponsiveContainer'

export function AiAppointmentsSection() {
  const flow = useAiAppointmentsFlow()

  return (
    <section id="citas-ia" className="ac-section ac-section--band" aria-labelledby="ac-ai-section-title">
      <ResponsiveContainer wide>
        <header className="ac-section__head ac-section__head--center">
          <p className="ac-kicker">Citas con IA</p>
          <h2 id="ac-ai-section-title">Citas con IA: reserva, revisa o cambia tus citas</h2>
          <p>
            El asistente de AgendaClinic permite reservar una nueva cita o consultar tus citas existentes usando
            email, DNI o NHC.
          </p>
        </header>
        <div className="ac-ai-section__shell">
          <AiAppointmentsAssistant variant="page" flow={flow} showHeader={false} />
        </div>
      </ResponsiveContainer>
    </section>
  )
}

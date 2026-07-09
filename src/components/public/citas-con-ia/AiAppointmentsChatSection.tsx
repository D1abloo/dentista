import { useMemo } from 'react'
import { Bot, MessageSquare } from 'lucide-react'
import { AiAppointmentsAssistant } from '@/components/public/ai-booking/AiBookingAssistant'
import { useAiAppointmentsFlow } from '@/components/public/ai-booking/useAiAppointmentsFlow'
import { ResponsiveContainer } from '@/components/public/new-frontend/ResponsiveContainer'

type Props = {
  initialQuery?: string
}

/** Isla mínima: asistente de citas con IA (sin header/footer). */
export function AiAppointmentsChatSection({ initialQuery }: Props = {}) {
  const queryFromUrl = useMemo(() => {
    if (initialQuery !== undefined) return initialQuery
    if (typeof window === 'undefined') return undefined
    return new URLSearchParams(window.location.search).get('q') ?? undefined
  }, [initialQuery])

  const flow = useAiAppointmentsFlow({ initialQuery: queryFromUrl })

  return (
    <section className="ac-section ac-section--band ac-page-citas" id="consulta-cita" aria-labelledby="citas-ia-title">
      <ResponsiveContainer wide>
        <header className="ac-section__head ac-section__head--center ac-page-citas__head">
          <p className="ac-kicker">Citas dentales online</p>
          <h1 id="citas-ia-title">Asistente de citas con IA</h1>
          <p>Reserva, consulta, cambia o cancela tus citas dentales de forma segura.</p>
          <p className="ac-page-citas__meta">
            <Bot className="h-3.5 w-3.5" aria-hidden />
            Gemini Pro en servidor · disponibilidad real · verificación de identidad
          </p>
        </header>
        <div className="ac-ai-section__shell ac-ai-section__shell--page">
          <div className="ac-ai-section__shell-head">
            <MessageSquare className="h-4 w-4" aria-hidden />
            <span>Asistente AgendaClinic</span>
          </div>
          <AiAppointmentsAssistant variant="page" flow={flow} showHeader={false} />
        </div>
      </ResponsiveContainer>
    </section>
  )
}

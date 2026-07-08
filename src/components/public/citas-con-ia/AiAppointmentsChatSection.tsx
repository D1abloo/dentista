import { useMemo } from 'react'
import { MessageSquareHeart } from 'lucide-react'
import { AiAppointmentsAssistant } from '@/components/public/ai-booking/AiBookingAssistant'
import { useAiAppointmentsFlow } from '@/components/public/ai-booking/useAiAppointmentsFlow'
import { DentalContainer } from '@/components/public/dental-landing/DentalContainer'

type Props = {
  initialQuery?: string
}

/** Isla mínima: solo el asistente y su contexto (sin header/footer). */
export function AiAppointmentsChatSection({ initialQuery }: Props = {}) {
  const queryFromUrl = useMemo(() => {
    if (initialQuery !== undefined) return initialQuery
    if (typeof window === 'undefined') return undefined
    return new URLSearchParams(window.location.search).get('q') ?? undefined
  }, [initialQuery])

  const flow = useAiAppointmentsFlow({ initialQuery: queryFromUrl })

  return (
    <section className="adb-section adb-section--band" id="consulta" aria-labelledby="citas-ia-title">
      <DentalContainer wide>
        <header className="adb-section-head">
          <p className="adb-kicker">Citas dentales online</p>
          <h1 id="citas-ia-title">Asistente de citas con IA</h1>
          <p>Reserva, consulta, cambia o cancela tus citas dentales de forma segura.</p>
          <h2 className="sr-only">Consulta y reserva de citas</h2>
        </header>
        <div className="adb-ai-app">
          <div className="adb-ai-app__head">
            <MessageSquareHeart className="h-4 w-4" aria-hidden />
            <span>Asistente AgendaClinic</span>
          </div>
          <div className="adb-ai-app__body">
            <AiAppointmentsAssistant variant="page" flow={flow} showHeader={false} />
          </div>
        </div>
      </DentalContainer>
    </section>
  )
}

import { useMemo } from 'react'
import { MessageSquareHeart } from 'lucide-react'
import { AiAppointmentsAssistant } from '@/components/public/ai-booking/AiBookingAssistant'
import { useAiAppointmentsFlow } from '@/components/public/ai-booking/useAiAppointmentsFlow'
import { DentalContainer } from '@/components/public/dental-landing/DentalContainer'
import { DentalFooter } from '@/components/public/dental-landing/DentalFooter'
import { DentalHeader } from '@/components/public/dental-landing/DentalHeader'

export function AiAppointmentsPage() {
  const initialQuery = useMemo(() => {
    if (typeof window === 'undefined') return undefined
    return new URLSearchParams(window.location.search).get('q') ?? undefined
  }, [])

  const flow = useAiAppointmentsFlow({ initialQuery })

  return (
    <>
      <DentalHeader />
      <main className="adb-landing">
        <section className="adb-section adb-section--band" id="consulta">
          <DentalContainer wide>
            <header className="adb-section-head">
              <p className="adb-kicker">Citas dentales online</p>
              <h1>Asistente de citas con IA</h1>
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
      </main>
      <DentalFooter />
    </>
  )
}

export const AiBookingPage = AiAppointmentsPage

import { useMemo } from 'react'
import { MessageSquareHeart } from 'lucide-react'
import { PublicFooter } from '@/components/public/PublicFooter'
import { PublicHeader } from '@/components/public/PublicHeader'
import { AiBookingAssistant } from '@/components/public/ai-booking/AiBookingAssistant'
import { useAiBookingFlow } from '@/components/public/ai-booking/useAiBookingFlow'

export function AiBookingPage() {
  const initialQuery = useMemo(() => {
    if (typeof window === 'undefined') return undefined
    return new URLSearchParams(window.location.search).get('q') ?? undefined
  }, [])

  const flow = useAiBookingFlow({ initialQuery })

  return (
    <>
      <PublicHeader activeHref="/reservar-con-ia" />
      <main className="ai-page">
        <section className="ai-page__hero">
          <span className="ai-page__badge">
            <MessageSquareHeart className="h-4 w-4" aria-hidden />
            Asistente de citas con IA
          </span>
          <h1>Reserva tu cita online con ayuda de IA</h1>
          <p>Cuéntanos qué necesitas y te mostramos huecos disponibles reales.</p>
          <div className="ai-page__highlights">
            <article>
              <strong>Encuentra el mejor hueco disponible</strong>
              <span>Pregunta en lenguaje natural y el asistente buscará huecos reales en tu clínica.</span>
            </article>
            <article>
              <strong>Reserva segura conectada con tu clínica</strong>
              <span>La cita queda registrada en la agenda y podrás consultarla en el Portal del Paciente.</span>
            </article>
          </div>
        </section>

        <section className="ai-page__workspace">
          <AiBookingAssistant variant="page" flow={flow} showHeader={false} />
        </section>
      </main>
      <PublicFooter />
    </>
  )
}

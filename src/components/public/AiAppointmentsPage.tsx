import { useMemo } from 'react'
import { MessageSquareHeart } from 'lucide-react'
import { PublicFooter } from '@/components/public/PublicFooter'
import { PublicHeader } from '@/components/public/PublicHeader'
import { AiAppointmentsAssistant } from '@/components/public/ai-booking/AiBookingAssistant'
import { useAiAppointmentsFlow } from '@/components/public/ai-booking/useAiAppointmentsFlow'

export function AiAppointmentsPage() {
  const initialQuery = useMemo(() => {
    if (typeof window === 'undefined') return undefined
    return new URLSearchParams(window.location.search).get('q') ?? undefined
  }, [])

  const flow = useAiAppointmentsFlow({ initialQuery })

  return (
    <>
      <PublicHeader activeHref="/citas-con-ia" />
      <main className="ai-page">
        <section className="ai-page__hero">
          <span className="ai-page__badge">
            <MessageSquareHeart className="h-4 w-4" aria-hidden />
            Asistente de citas con IA
          </span>
          <h1>Gestiona tus citas con ayuda de IA</h1>
          <p>Reserva, revisa o cambia tus citas de forma segura con el asistente de AgendaClinic.</p>
          <div className="ai-page__subs">
            <h2>Consulta tus próximas citas</h2>
            <h2>Reserva una nueva cita</h2>
          </div>
        </section>

        <section className="ai-page__workspace" aria-label="Asistente de citas">
          <AiAppointmentsAssistant variant="page" flow={flow} showHeader={false} />
        </section>
      </main>
      <PublicFooter />
    </>
  )
}

export const AiBookingPage = AiAppointmentsPage

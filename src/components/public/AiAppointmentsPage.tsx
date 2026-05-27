import { useMemo } from 'react'
import { MessageSquareHeart } from 'lucide-react'
import { AiAppointmentsAssistant } from '@/components/public/ai-booking/AiBookingAssistant'
import { useAiAppointmentsFlow } from '@/components/public/ai-booking/useAiAppointmentsFlow'
import { AppFooter } from '@/components/public/new-frontend/AppFooter'
import { AppHeader } from '@/components/public/new-frontend/AppHeader'
import { ResponsiveContainer } from '@/components/public/new-frontend/ResponsiveContainer'

export function AiAppointmentsPage() {
  const initialQuery = useMemo(() => {
    if (typeof window === 'undefined') return undefined
    return new URLSearchParams(window.location.search).get('q') ?? undefined
  }, [])

  const flow = useAiAppointmentsFlow({ initialQuery })

  return (
    <>
      <AppHeader />
      <main className="ac-landing">
        <section className="ac-section ac-section--band">
          <ResponsiveContainer wide>
            <header className="ac-section__head">
              <p className="ac-kicker ac-kicker--icon">
                <MessageSquareHeart className="h-4 w-4" aria-hidden />
                Asistente de citas con IA
              </p>
              <h1>Gestiona tus citas con ayuda de IA</h1>
              <p>Reserva, revisa o cambia tus citas de forma segura con el asistente de AgendaClinic.</p>
              <h2 className="sr-only">Consulta tus próximas citas</h2>
              <h2 className="sr-only">Reserva una nueva cita</h2>
            </header>
            <div className="ac-ai-section__shell">
              <AiAppointmentsAssistant variant="page" flow={flow} showHeader={false} />
            </div>
          </ResponsiveContainer>
        </section>
      </main>
      <AppFooter />
    </>
  )
}

export const AiBookingPage = AiAppointmentsPage

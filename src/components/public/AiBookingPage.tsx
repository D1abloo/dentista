import { useMemo } from 'react'
import { MessageSquareHeart } from 'lucide-react'
import { PublicFooter } from '@/components/public/PublicFooter'
import { PublicHeader } from '@/components/public/PublicHeader'
import { AiBookingSidePanel } from '@/components/public/ai-booking/AiBookingSidePanel'
import { AiChatWindow } from '@/components/public/ai-booking/AiChatWindow'
import {
  AI_BOOKING_QUICK_REPLIES,
  useAiBookingFlow
} from '@/components/public/ai-booking/useAiBookingFlow'

export function AiBookingPage() {
  const initialQuery = useMemo(() => {
    if (typeof window === 'undefined') return undefined
    return new URLSearchParams(window.location.search).get('q') ?? undefined
  }, [])

  const flow = useAiBookingFlow({ initialQuery })

  return (
    <>
      <PublicHeader activeHref="/reservar-con-ia" />
      <main className="min-h-screen bg-[radial-gradient(1200px_circle_at_16%_8%,rgba(221,245,242,0.7),transparent_55%),radial-gradient(900px_circle_at_88%_12%,rgba(238,248,249,0.9),transparent_55%),linear-gradient(180deg,#f7fbff,white)]">
        <section className="mx-auto max-w-6xl px-4 pb-7 pt-10 md:px-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800 ring-1 ring-teal-200">
            <MessageSquareHeart className="h-4 w-4" aria-hidden />
            Asistente de citas con IA
          </span>
          <h1 className="mt-4 text-3xl font-bold text-slate-900">Reserva tu cita online con ayuda de IA</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Cuéntanos qué necesitas y te ayudamos a encontrar el mejor hueco disponible.
          </p>
          <div className="mt-6 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
            <p className="ai-page__card px-4 py-3">
              <strong className="text-slate-900">Encuentra el mejor hueco disponible</strong>
              <span className="mt-1 block text-slate-600">
                Pregunta en lenguaje natural y el asistente buscará huecos reales en tu clínica.
              </span>
            </p>
            <p className="ai-page__card px-4 py-3">
              <strong className="text-slate-900">Reserva segura conectada con tu clínica</strong>
              <span className="mt-1 block text-slate-600">
                La cita queda registrada en la agenda y podrás consultarla en el Portal del Paciente.
              </span>
            </p>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-14 md:px-6 lg:grid-cols-[1.15fr_0.85fr]">
          <AiChatWindow
            messages={flow.messages}
            quickReplies={AI_BOOKING_QUICK_REPLIES}
            chatInput={flow.chatInput}
            status={flow.status}
            onInputChange={flow.setChatInput}
            onSend={(value) => void flow.handleSendMessage(value)}
            onQuickReply={(value) => void flow.handleSendMessage(value)}
          />

          <aside>
            <AiBookingSidePanel
              variant="page"
              status={flow.status}
              errorMessage={flow.errorMessage}
              slots={flow.slots}
              selectedSlot={flow.selectedSlot}
              readyForSummary={flow.readyForSummary}
              bookingState={flow.bookingState}
              patientForm={flow.patientForm}
              hasPortalAccount={flow.hasPortalAccount}
              onSelectSlot={flow.handleSelectSlot}
              onConfirmBooking={() => void flow.handleConfirmBooking()}
              onEditSummary={() => void flow.handleEditSummary()}
              onBookAnother={flow.resetFlow}
            />
          </aside>
        </section>
      </main>
      <PublicFooter />
    </>
  )
}

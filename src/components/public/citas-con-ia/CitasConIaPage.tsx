import { PublicSiteShell } from '@/components/public/PublicSiteShell'
import { AiAppointmentsChatSection } from '@/components/public/citas-con-ia/AiAppointmentsChatSection'

/** Página /citas-con-ia: shell público + isla de chat (bundle separado del resto de secciones). */
export function CitasConIaPage() {
  return (
    <PublicSiteShell>
      <main className="ac-landing ac-page" id="main-content">
        <AiAppointmentsChatSection />
      </main>
    </PublicSiteShell>
  )
}

export const AiAppointmentsPage = CitasConIaPage
export const AiBookingPage = CitasConIaPage

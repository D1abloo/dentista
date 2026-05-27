import { AiAppointmentsAssistant } from '@/components/public/ai-booking/AiBookingAssistant'
import { useAiAppointmentsFlow } from '@/components/public/ai-booking/useAiAppointmentsFlow'
import { ArrowRight, Bot, Calendar, MessageSquare, Search, Shield } from 'lucide-react'
import { ResponsiveContainer } from './ResponsiveContainer'

const USE_CASES = [
  'Reservar nueva cita',
  'Ver mis citas',
  'Próxima cita',
  'Cambiar una cita',
  'Cancelar una cita',
  'Hablar con mi clínica'
] as const

const FEATURES = [
  'Reserva guiada con disponibilidad real del backend',
  'Consulta con email, DNI o NHC (un identificador basta)',
  'Reprogramación y cancelación con verificación reforzada',
  'Sin exposición de datos sensibles en consulta pública'
] as const

export function AiAppointmentsSection() {
  const flow = useAiAppointmentsFlow()

  return (
    <section id="citas-ia" className="ac-section ac-section--band" aria-labelledby="ac-ai-section-title">
      <ResponsiveContainer wide>
        <div className="ac-ai-split">
          <aside className="ac-ai-split__copy">
            <p className="ac-kicker">Citas con IA</p>
            <h2 id="ac-ai-section-title">Citas con IA: reserva, revisa o cambia tus citas</h2>
            <p>
              El asistente de AgendaClinic permite reservar una nueva cita o consultar tus citas existentes usando
              email, DNI o NHC.
            </p>
            <ul className="ac-list ac-list--check">
              {FEATURES.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="ac-ai-split__cases" aria-label="Acciones rápidas del asistente">
              <p className="ac-ai-split__cases-title">Acciones habituales</p>
              <div className="ac-ai-split__chips">
                {USE_CASES.map((item) => (
                  <span key={item} className="ac-chip">
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="ac-lookup-card" id="consulta">
              <h3>
                <Search className="h-4 w-4" aria-hidden />
                Consulta rápida de citas
              </h3>
              <p>Introduce tu email, DNI o NHC para saber si tienes una cita próxima.</p>
              <p className="ac-lookup-card__note">
                <Shield className="h-3.5 w-3.5" aria-hidden />
                Con email, DNI o NHC puedes ver información básica de tu próxima cita. Para más detalles, inicia sesión
                en el Portal del Paciente.
              </p>
              <a href="/citas-con-ia" className="ac-btn ac-btn--secondary">
                Ir al asistente completo
                <ArrowRight className="h-4 w-4" aria-hidden />
              </a>
            </div>
            <p className="ac-ai-split__meta">
              <Bot className="h-3.5 w-3.5" aria-hidden />
              Gemini Pro solo en servidor · sin inventar citas ni huecos
            </p>
          </aside>
          <div className="ac-ai-split__app">
            <div className="ac-ai-section__shell">
              <div className="ac-ai-section__shell-head">
                <MessageSquare className="h-4 w-4" aria-hidden />
                <span>Asistente AgendaClinic</span>
                <Calendar className="h-4 w-4" aria-hidden />
              </div>
              <AiAppointmentsAssistant variant="page" flow={flow} showHeader={false} />
            </div>
          </div>
        </div>
      </ResponsiveContainer>
    </section>
  )
}

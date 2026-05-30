import { AiAppointmentsAssistant } from '@/components/public/ai-booking/AiBookingAssistant'
import { useAiAppointmentsFlow } from '@/components/public/ai-booking/useAiAppointmentsFlow'
import { ArrowRight, Bot, MessageSquare } from 'lucide-react'
import { DentalContainer } from './DentalContainer'

const USE_CASES = [
  'Quiero una limpieza dental esta semana',
  '¿Cuándo tengo mi próxima cita?',
  'Necesito cambiar mi cita',
  'Quiero cancelar mi cita',
  'Busco el primer hueco disponible'
] as const

const BENEFITS = [
  'Entiende español natural y clasifica tu intención',
  'Consulta con email, DNI o NHC (un dato basta para información básica)',
  'Reserva con huecos reales del backend, sin inventar disponibilidad',
  'Cancelar o cambiar requiere verificación reforzada o portal paciente'
] as const

const QUICK = [
  'Reservar nueva cita',
  'Ver mis citas',
  'Próxima cita',
  'Cambiar una cita',
  'Cancelar una cita',
  'Hablar con mi clínica'
] as const

export const DentalAiSection = () => {
  const flow = useAiAppointmentsFlow()

  return (
    <section id="asistente-ia" className="adb-section adb-section--tint" aria-labelledby="adb-ai-title">
      <DentalContainer wide>
        <div className="adb-ai-split">
          <aside className="adb-ai-split__copy">
            <p className="adb-kicker">Citas con IA</p>
            <h2 id="adb-ai-title">Asistente de citas con IA</h2>
            <p>Reserva, revisa o cambia tus citas dentales hablando con el asistente de AgendaClinic.</p>
            <ul className="adb-list adb-list--check">
              {BENEFITS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="adb-ai-cases">
              <p className="adb-ai-cases__title">Ejemplos de uso</p>
              <ul>
                {USE_CASES.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="adb-chip-row" aria-label="Acciones rápidas">
              {QUICK.map((item) => (
                <span key={item} className="adb-chip">
                  {item}
                </span>
              ))}
            </div>
            <a href="/citas-con-ia" className="adb-btn adb-btn--primary">
              Abrir asistente completo
              <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
            <p className="adb-ai-meta">
              <Bot className="h-3.5 w-3.5" aria-hidden />
              Gemini Pro solo en servidor
            </p>
          </aside>
          <div className="adb-ai-app">
            <div className="adb-ai-app__head">
              <MessageSquare className="h-4 w-4" aria-hidden />
              <span>Asistente AgendaClinic</span>
            </div>
            <div className="adb-ai-app__body">
              <AiAppointmentsAssistant variant="page" flow={flow} showHeader={false} />
            </div>
          </div>
        </div>
      </DentalContainer>
    </section>
  )
}

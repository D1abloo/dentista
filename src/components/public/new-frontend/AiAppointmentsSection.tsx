import { ArrowRight, Bot, MessageCircle, Search, Shield, Sparkles } from 'lucide-react'
import { openAiAppointmentsWidget } from '@/lib/public/aiWidget'
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
  const handleOpenWidget = () => openAiAppointmentsWidget()

  return (
    <section id="citas-online" className="ac-section ac-section--band ac-ai-promo" aria-labelledby="ac-ai-section-title">
      <ResponsiveContainer wide>
        <div className="ac-ai-promo__card">
          <div className="ac-ai-promo__copy">
            <p className="ac-kicker">Citas con IA</p>
            <h2 id="ac-ai-section-title">Citas con IA: reserva, revisa o cambia tus citas</h2>
            <p>
              Abre el asistente en la esquina inferior derecha. Reserva una cita nueva o consulta las existentes con
              email, DNI o NHC.
            </p>
            <ul className="ac-list ac-list--check">
              {FEATURES.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="ac-ai-split__cases" aria-label="Acciones habituales del asistente">
              <p className="ac-ai-split__cases-title">Acciones habituales</p>
              <div className="ac-ai-split__chips">
                {USE_CASES.map((item) => (
                  <span key={item} className="ac-chip">
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="ac-ai-promo__actions">
              <button type="button" className="ac-btn ac-btn--primary ac-btn--pill" onClick={handleOpenWidget}>
                <Sparkles className="h-4 w-4" aria-hidden />
                Abrir asistente
              </button>
              <a href="/citas-con-ia" className="ac-btn ac-btn--secondary ac-btn--pill">
                Versión completa
                <ArrowRight className="h-4 w-4" aria-hidden />
              </a>
            </div>
            <div className="ac-lookup-card" id="consulta-cita">
              <h3>
                <Search className="h-4 w-4" aria-hidden />
                Consulta rápida de citas
              </h3>
              <p>Introduce tu email, DNI o NHC en el asistente para ver tu próxima cita.</p>
              <p className="ac-lookup-card__note">
                <Shield className="h-3.5 w-3.5" aria-hidden />
                Para más detalles, inicia sesión en el Portal del Paciente.
              </p>
              <button type="button" className="ac-btn ac-btn--ghost ac-btn--pill" onClick={handleOpenWidget}>
                Abrir desde el popup
              </button>
            </div>
            <p className="ac-ai-split__meta">
              <Bot className="h-3.5 w-3.5" aria-hidden />
              Gemini Pro solo en servidor · sin inventar citas ni huecos
            </p>
          </div>
          <div className="ac-ai-promo__visual" aria-hidden>
            <div className="ac-ai-promo__mock">
              <div className="ac-ai-promo__mock-panel">
                <header>
                  <Sparkles className="h-4 w-4" />
                  <span>Citas con IA</span>
                </header>
                <p>Hola, ¿qué necesitas hacer hoy?</p>
                <div className="ac-ai-promo__mock-chips">
                  <span>Reservar cita</span>
                  <span>Mis citas</span>
                  <span>Próxima cita</span>
                </div>
              </div>
              <div className="ac-ai-promo__mock-fab">
                <MessageCircle className="h-4 w-4" aria-hidden />
                Citas con IA
              </div>
            </div>
          </div>
        </div>
      </ResponsiveContainer>
    </section>
  )
}
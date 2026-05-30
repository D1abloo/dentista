import { Bell, Calendar, FileText, Receipt, RefreshCw, Sparkles } from 'lucide-react'
import { DENTAL_IMAGE_ALTS, DENTAL_IMAGES } from './constants'
import { DentalContainer } from './DentalContainer'

const CARDS = [
  { title: 'Reservar cita', Icon: Sparkles },
  { title: 'Consultar próxima cita', Icon: Calendar },
  { title: 'Cambiar horario', Icon: RefreshCw },
  { title: 'Recibir recordatorios', Icon: Bell },
  { title: 'Ver informes', Icon: FileText },
  { title: 'Consultar facturas', Icon: Receipt }
] as const

export const PatientExperienceSection = () => (
  <section className="adb-section adb-section--tint" aria-labelledby="adb-patient-title">
    <DentalContainer wide>
      <div className="adb-patient-split">
        <div>
          <header className="adb-section-head">
            <p className="adb-kicker">Experiencia paciente</p>
            <h2 id="adb-patient-title">Una experiencia sencilla para tus pacientes</h2>
            <p>Menos llamadas, más autonomía y acceso privado a su información.</p>
          </header>
          <div className="adb-grid adb-grid--2 adb-grid--compact">
            {CARDS.map((card) => {
              const Icon = card.Icon
              return (
                <article key={card.title} className="adb-mini-card">
                  <Icon className="h-4 w-4" aria-hidden />
                  <h3>{card.title}</h3>
                </article>
              )
            })}
          </div>
        </div>
        <div className="adb-patient-phone-wrap">
          <img
            src={DENTAL_IMAGES.portal}
            alt={DENTAL_IMAGE_ALTS.portal}
            loading="lazy"
            width={280}
            height={560}
            className="adb-patient-phone-img"
          />
          <div className="adb-patient-phone-ui" aria-hidden>
            <nav>
              <span className="is-active">Inicio</span>
              <span>Mis citas</span>
              <span>Reservar</span>
              <span>Mensajes</span>
              <span>Perfil</span>
            </nav>
          </div>
        </div>
      </div>
    </DentalContainer>
  </section>
)

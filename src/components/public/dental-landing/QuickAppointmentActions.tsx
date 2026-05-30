import { CalendarClock, CalendarX, Search, Sparkles } from 'lucide-react'
import { DENTAL_IMAGE_ALTS, DENTAL_IMAGES } from './constants'
import { DentalContainer } from './DentalContainer'

const ACTIONS = [
  {
    title: 'Reservar una cita',
    text: 'Elige clínica, tratamiento, profesional, fecha y hora disponible.',
    cta: 'Reservar ahora',
    href: '/citas-con-ia',
    Icon: Sparkles,
    image: DENTAL_IMAGES.citas,
    alt: DENTAL_IMAGE_ALTS.citas
  },
  {
    title: 'Consultar mi cita',
    text: 'Introduce tu email, DNI o NHC para ver si tienes una cita próxima.',
    cta: 'Consultar cita',
    href: '#consulta-cita',
    Icon: Search,
    image: DENTAL_IMAGES.portal,
    alt: DENTAL_IMAGE_ALTS.portal
  },
  {
    title: 'Cambiar una cita',
    text: 'Solicita un nuevo horario si no puedes asistir.',
    cta: 'Cambiar cita',
    href: '/citas-con-ia',
    Icon: CalendarClock,
    image: DENTAL_IMAGES.mensajes,
    alt: 'Cambio de cita dental online'
  },
  {
    title: 'Cancelar una cita',
    text: 'Cancela una cita existente según la política de la clínica.',
    cta: 'Cancelar cita',
    href: '/citas-con-ia',
    Icon: CalendarX,
    image: DENTAL_IMAGES.informes,
    alt: 'Cancelación de cita dental'
  }
] as const

export const QuickAppointmentActions = () => (
  <section id="citas-online" className="adb-section adb-section--band" aria-labelledby="adb-actions-title">
    <DentalContainer wide>
      <header className="adb-section-head adb-section-head--center">
        <h2 id="adb-actions-title">¿Qué necesitas hacer?</h2>
        <p>Gestiona tus citas dentales online sin llamadas innecesarias.</p>
      </header>
      <div className="adb-grid adb-grid--4">
        {ACTIONS.map((action) => {
          const Icon = action.Icon
          return (
            <article key={action.title} className="adb-action-card">
              <div className="adb-action-card__media">
                <img src={action.image} alt={action.alt} loading="lazy" width={320} height={200} />
                <span className="adb-action-card__icon">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
              </div>
              <h3>{action.title}</h3>
              <p>{action.text}</p>
              <a href={action.href} className="adb-btn adb-btn--primary adb-btn--block">
                {action.cta}
              </a>
            </article>
          )
        })}
      </div>
    </DentalContainer>
  </section>
)

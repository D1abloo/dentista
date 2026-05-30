import { Check, X } from 'lucide-react'
import { DentalContainer } from './DentalContainer'

const STEPS = [
  {
    n: 1,
    title: 'El paciente elige tratamiento',
    text: 'Selecciona limpieza, revisión, urgencia, ortodoncia u otro servicio disponible.'
  },
  {
    n: 2,
    title: 'El sistema consulta disponibilidad',
    text: 'AgendaClinic revisa horarios de clínica, profesionales activos, citas ocupadas y bloqueos.'
  },
  {
    n: 3,
    title: 'Se muestran huecos reales',
    text: 'El paciente solo ve horas disponibles para reservar.'
  },
  {
    n: 4,
    title: 'La cita se confirma',
    text: 'La clínica puede confirmar automáticamente o revisar la solicitud según su configuración.'
  },
  {
    n: 5,
    title: 'Todo queda conectado',
    text: 'La cita aparece en la agenda clínica y en el Portal del Paciente.'
  }
] as const

const WITHOUT = [
  'Llamadas repetidas',
  'Horarios duplicados',
  'Errores de agenda',
  'Pacientes sin información',
  'Facturación desconectada'
] as const

const WITH = [
  'Reserva online',
  'Disponibilidad real',
  'Agenda actualizada',
  'Portal paciente',
  'Citas, informes y facturas conectadas'
] as const

export const BookingWorkflowSection = () => (
  <section id="como-funciona" className="adb-section adb-section--band" aria-labelledby="adb-workflow-title">
    <DentalContainer wide>
      <header className="adb-section-head adb-section-head--center">
        <p className="adb-kicker">Reserva online</p>
        <h2 id="adb-workflow-title">Cómo funciona la reserva online</h2>
        <p>Desde que el paciente busca un hueco hasta que la clínica confirma la cita.</p>
      </header>

      <ol className="adb-steps">
        {STEPS.map((step) => (
          <li key={step.n} className="adb-step">
            <span className="adb-step__n">{step.n}</span>
            <div>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="adb-compare">
        <article className="adb-compare__col adb-compare__col--bad">
          <h3>Sin AgendaClinic</h3>
          <ul>
            {WITHOUT.map((item) => (
              <li key={item}>
                <X className="h-4 w-4" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </article>
        <article className="adb-compare__col adb-compare__col--good">
          <h3>Con AgendaClinic</h3>
          <ul>
            {WITH.map((item) => (
              <li key={item}>
                <Check className="h-4 w-4" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
          <a href="/citas-con-ia" className="adb-btn adb-btn--primary">
            Probar reserva online
          </a>
        </article>
      </div>
    </DentalContainer>
  </section>
)

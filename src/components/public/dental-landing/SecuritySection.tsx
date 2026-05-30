import { Eye, FileLock, Lock, Shield, ShieldCheck, Users } from 'lucide-react'
import { DentalContainer } from './DentalContainer'

const CARDS = [
  { title: 'Acceso por rol', text: 'Recepción, clínica, administración y pacientes con permisos distintos.', Icon: Users },
  { title: 'Portal paciente privado', text: 'Cada paciente accede solo a sus citas y documentos.', Icon: Lock },
  { title: 'Aislamiento por clínica', text: 'Datos separados por clínica y tenant.', Icon: Shield },
  { title: 'Descargas seguras', text: 'Informes y facturas con acceso controlado.', Icon: FileLock },
  { title: 'Auditoría de acciones', text: 'Registro de consultas y cambios sensibles.', Icon: Eye },
  { title: 'Sin cruce de pacientes', text: 'Imposible ver datos de otros pacientes.', Icon: ShieldCheck }
] as const

export const SecuritySection = () => (
  <section className="adb-section adb-section--band" aria-labelledby="adb-security-title">
    <DentalContainer wide>
      <header className="adb-section-head adb-section-head--center">
        <p className="adb-kicker">Seguridad</p>
        <h2 id="adb-security-title">Citas y datos protegidos</h2>
        <p>Cada paciente solo accede a sus datos y cada clínica trabaja dentro de su propio entorno.</p>
      </header>
      <div className="adb-grid adb-grid--3">
        {CARDS.map((card) => {
          const Icon = card.Icon
          return (
            <article key={card.title} className="adb-security-card">
              <span className="adb-security-card__icon">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <h3>{card.title}</h3>
              <p>{card.text}</p>
            </article>
          )
        })}
      </div>
    </DentalContainer>
  </section>
)

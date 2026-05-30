import { Building2, FileText, Stethoscope, Users } from 'lucide-react'
import { DENTAL_IMAGE_ALTS, DENTAL_IMAGES } from './constants'
import { DentalContainer } from './DentalContainer'

const ROLES = [
  { title: 'Recepción', text: 'Gestiona agenda y pacientes del día.', Icon: Users },
  { title: 'Doctores', text: 'Documentan informes y tratamientos.', Icon: Stethoscope },
  { title: 'Administración', text: 'Emite facturas y registra pagos.', Icon: FileText },
  { title: 'Dirección', text: 'Consulta métricas y rendimiento.', Icon: Building2 }
] as const

export const ClinicManagementSection = () => (
  <section className="adb-section" aria-labelledby="adb-mgmt-title">
    <DentalContainer wide>
      <div className="adb-mgmt-split">
        <div className="adb-mgmt-split__copy">
          <header className="adb-section-head">
            <p className="adb-kicker">Gestión clínica</p>
            <h2 id="adb-mgmt-title">Control completo para la clínica</h2>
            <p>Desde recepción hasta administración, AgendaClinic organiza cada parte del proceso de citas.</p>
          </header>
          <ul className="adb-role-list">
            {ROLES.map((role) => {
              const Icon = role.Icon
              return (
                <li key={role.title}>
                  <Icon className="h-4 w-4" aria-hidden />
                  <div>
                    <strong>{role.title}</strong>
                    <span>{role.text}</span>
                  </div>
                </li>
              )
            })}
          </ul>
          <a href="/login/admin" className="adb-btn adb-btn--primary">
            Acceder al panel clínica
          </a>
        </div>
        <figure className="adb-mgmt-split__visual">
          <img
            src={DENTAL_IMAGES.doctor}
            alt={DENTAL_IMAGE_ALTS.doctor}
            loading="lazy"
            width={640}
            height={400}
          />
        </figure>
      </div>
    </DentalContainer>
  </section>
)

import { Building2, FileText, Stethoscope, Users } from 'lucide-react'
import { ResponsiveContainer } from './ResponsiveContainer'

const MODULES = [
  {
    title: 'Recepción',
    items: ['agenda', 'pacientes', 'bloqueos', 'recordatorios', 'búsqueda rápida'],
    Icon: Users
  },
  {
    title: 'Doctores',
    items: ['informes', 'documentos', 'firma profesional', 'historial', 'plantillas'],
    Icon: Stethoscope
  },
  {
    title: 'Administración',
    items: ['facturas', 'pagos', 'recibos', 'reportes', 'suscripciones'],
    Icon: Building2
  },
  {
    title: 'Pacientes',
    items: ['reservar cita', 'mis citas', 'informes', 'documentos', 'facturas', 'consentimientos', 'mensajes'],
    Icon: FileText
  }
] as const

export function RoleModulesSection() {
  return (
    <section className="ac-section ac-section--surface" aria-labelledby="ac-roles-title">
      <ResponsiveContainer wide>
        <header className="ac-section__head">
          <p className="ac-kicker">Módulos por rol</p>
          <h2 id="ac-roles-title">Cada equipo trabaja con su espacio</h2>
        </header>

        <div className="ac-grid ac-grid--4">
          {MODULES.map((module) => {
            const Icon = module.Icon
            return (
              <article key={module.title} className="ac-card">
                <span className="ac-card__icon">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h3>{module.title}</h3>
                <ul className="ac-list">
                  {module.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            )
          })}
        </div>
      </ResponsiveContainer>
    </section>
  )
}

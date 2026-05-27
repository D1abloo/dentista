import { Building2, FileText, Stethoscope, Users } from 'lucide-react'
import { ResponsiveContainer } from './ResponsiveContainer'

const MODULES = [
  {
    title: 'Recepción',
    items: ['Agenda día, semana y mes', 'Pacientes y NHC', 'Bloqueos horarios', 'Recordatorios', 'Búsqueda rápida'],
    Icon: Users
  },
  {
    title: 'Doctores',
    items: ['Informes odontológicos', 'Plantillas clínicas', 'Documentos', 'Firma profesional', 'Historial de visitas'],
    Icon: Stethoscope
  },
  {
    title: 'Administración',
    items: ['Facturas PDF', 'Pagos y recibos', 'Reportes', 'Suscripciones', 'Exportaciones'],
    Icon: Building2
  },
  {
    title: 'Pacientes',
    items: [
      'Reservar cita',
      'Mis citas',
      'Mis informes',
      'Mis documentos',
      'Mis facturas',
      'Consentimientos',
      'Mensajes'
    ],
    Icon: FileText
  }
] as const

export function RoleModulesSection() {
  return (
    <section className="ac-section ac-section--tint" aria-labelledby="ac-roles-title">
      <ResponsiveContainer wide>
        <header className="ac-section__head ac-section__head--center">
          <p className="ac-kicker">Módulos por rol</p>
          <h2 id="ac-roles-title">Cada equipo tiene su espacio</h2>
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

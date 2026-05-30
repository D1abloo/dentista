import {
  Bell,
  Calendar,
  CreditCard,
  LayoutGrid,
  Stethoscope,
  Users
} from 'lucide-react'
import { DENTAL_IMAGE_ALTS, DENTAL_IMAGES } from './constants'
import { DentalContainer } from './DentalContainer'

const FEATURES = [
  {
    title: 'Agenda clínica',
    text: 'Vista diaria, semanal y mensual con citas, profesionales, huecos disponibles y bloqueos horarios.',
    bullets: ['Vista día/semana/mes', 'Estados de cita', 'Bloqueos visibles'],
    image: DENTAL_IMAGES.hero,
    alt: DENTAL_IMAGE_ALTS.hero,
    Icon: Calendar,
    href: '/login/admin'
  },
  {
    title: 'Disponibilidad real',
    text: 'Los pacientes solo pueden reservar horarios disponibles. Las citas ocupadas y los bloqueos no se muestran como libres.',
    bullets: ['Sin huecos duplicados', 'Bloqueos respetados', 'Profesionales activos'],
    image: DENTAL_IMAGES.citas,
    alt: DENTAL_IMAGE_ALTS.citas,
    Icon: LayoutGrid,
    href: '/citas-con-ia'
  },
  {
    title: 'Profesionales y tratamientos',
    text: 'Configura doctores, tratamientos, duración de cada cita y horarios de atención.',
    bullets: ['Doctores por clínica', 'Duración por tratamiento', 'Horarios personalizados'],
    image: DENTAL_IMAGES.doctor,
    alt: DENTAL_IMAGE_ALTS.doctor,
    Icon: Stethoscope,
    href: '/login/admin'
  },
  {
    title: 'Recordatorios automáticos',
    text: 'Reduce ausencias enviando avisos y recordatorios antes de la cita.',
    bullets: ['SMS y email', 'Menos no-shows', 'Avisos configurables'],
    image: DENTAL_IMAGES.mensajes,
    alt: DENTAL_IMAGE_ALTS.mensajes,
    Icon: Bell,
    href: '/login/admin'
  },
  {
    title: 'Portal del paciente',
    text: 'El paciente consulta citas, informes, documentos, facturas, pagos y mensajes desde su espacio privado.',
    bullets: ['Mis citas', 'Informes y docs', 'Facturas y pagos'],
    image: DENTAL_IMAGES.portal,
    alt: DENTAL_IMAGE_ALTS.portal,
    Icon: Users,
    href: '/portal-paciente'
  },
  {
    title: 'Facturación vinculada',
    text: 'Vincula citas con facturas, pagos y recibos para tener todo organizado.',
    bullets: ['Facturas PDF', 'Pagos registrados', 'Historial por paciente'],
    image: DENTAL_IMAGES.informes,
    alt: DENTAL_IMAGE_ALTS.informes,
    Icon: CreditCard,
    href: '/login/admin'
  }
] as const

export const ClinicFeaturesSection = () => (
  <section id="para-clinicas" className="adb-section" aria-labelledby="adb-clinic-title">
    <DentalContainer wide>
      <header className="adb-section-head adb-section-head--center">
        <p className="adb-kicker">Para clínicas dentales</p>
        <h2 id="adb-clinic-title">Todo lo que necesita una clínica dental para gestionar citas</h2>
        <p>
          AgendaClinic centraliza reservas online, agenda, pacientes, profesionales, recordatorios y portal del paciente.
        </p>
      </header>
      <div className="adb-grid adb-grid--3">
        {FEATURES.map((feature) => {
          const Icon = feature.Icon
          return (
            <article key={feature.title} className="adb-feature-card">
              <div className="adb-feature-card__img">
                <img src={feature.image} alt={feature.alt} loading="lazy" width={400} height={240} />
              </div>
              <span className="adb-feature-card__icon">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
              <ul className="adb-list">
                {feature.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
              <a href={feature.href} className="adb-btn adb-btn--ghost adb-btn--sm">
                Ver más
              </a>
            </article>
          )
        })}
      </div>
    </DentalContainer>
  </section>
)

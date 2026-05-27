import { Building2, LayoutDashboard, ShieldCheck } from 'lucide-react'
import { ResponsiveContainer } from './ResponsiveContainer'

const ITEMS = [
  {
    title: 'Portal paciente',
    text: 'Consulta tus citas, informes, documentos, facturas, pagos y consentimientos.',
    bullets: ['Mis citas e informes', 'Documentos y facturas', 'Pagos y consentimientos'],
    cta: 'Entrar al portal',
    href: '/portal-paciente',
    Icon: LayoutDashboard
  },
  {
    title: 'Panel clínica',
    text: 'Gestiona agenda, pacientes, informes, documentos, facturación y pagos.',
    bullets: ['Agenda y bloqueos', 'Pacientes y NHC', 'Facturación integrada'],
    cta: 'Acceder al panel',
    href: '/login/admin',
    Icon: Building2
  },
  {
    title: 'Plataforma',
    text: 'Administra clínicas, usuarios, suscripciones, seguridad y auditoría.',
    bullets: ['Multi-clínica', 'Usuarios y roles', 'Auditoría y seguridad'],
    cta: 'Acceder a plataforma',
    href: '/platform/login',
    Icon: ShieldCheck
  }
] as const

export function QuickAccessCards() {
  return (
    <section id="funciones" className="ac-section ac-section--compact" aria-labelledby="ac-quick-title">
      <ResponsiveContainer wide>
        <header className="ac-section__head ac-section__head--center">
          <p className="ac-kicker">Acceso por perfil</p>
          <h2 id="ac-quick-title">Accede a AgendaClinic según tu perfil</h2>
          <p>Elige el espacio que corresponde a tu rol: paciente, clínica o administración de plataforma.</p>
        </header>
        <div className="ac-grid ac-grid--3">
          {ITEMS.map((item) => {
            const Icon = item.Icon
            return (
              <article key={item.title} className="ac-card ac-card--dense">
                <span className="ac-card__icon">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                <ul className="ac-list">
                  {item.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
                <a href={item.href} className="ac-btn ac-btn--primary">
                  {item.cta}
                </a>
              </article>
            )
          })}
        </div>
      </ResponsiveContainer>
    </section>
  )
}

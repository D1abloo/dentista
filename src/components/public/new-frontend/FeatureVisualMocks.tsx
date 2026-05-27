import { Calendar, CreditCard, FileText, Lock, Receipt, Shield, Users } from 'lucide-react'
import { LandingDashboardPreview } from '@/components/public/LandingDashboardPreview'

type Variant = 'agenda' | 'portal' | 'billing' | 'security'

type Props = {
  variant: Variant
  title: string
}

export function FeatureVisualMocks({ variant, title }: Props) {
  if (variant === 'agenda') {
    return (
      <div className="ac-feature-visual ac-feature-visual--laptop" role="img" aria-label={title}>
        <LandingDashboardPreview />
      </div>
    )
  }

  if (variant === 'portal') {
    return (
      <div className="ac-feature-visual ac-feature-visual--portal" role="img" aria-label={title}>
        <div className="ac-feature-visual__phone">
          <header>
            <span>EV</span>
            <div>
              <small>Portal paciente</small>
              <strong>Mis citas</strong>
            </div>
          </header>
          <div className="ac-feature-visual__phone-card">
            <Calendar className="h-4 w-4" aria-hidden />
            <div>
              <span>Próxima cita</span>
              <strong>18 mar · 10:30</strong>
            </div>
          </div>
          <ul>
            <li>
              <FileText className="h-3.5 w-3.5" aria-hidden /> Informes clínicos
            </li>
            <li>
              <Receipt className="h-3.5 w-3.5" aria-hidden /> Facturas y pagos
            </li>
          </ul>
        </div>
        <div className="ac-feature-visual__float ac-feature-visual__float--a">Informe listo</div>
        <div className="ac-feature-visual__float ac-feature-visual__float--b">Pago pendiente</div>
        <div className="ac-feature-visual__float ac-feature-visual__float--c">Mensaje clínica</div>
      </div>
    )
  }

  if (variant === 'billing') {
    return (
      <div className="ac-feature-visual ac-feature-visual--billing" role="img" aria-label={title}>
        <div className="ac-billing-mock">
          <header>
            <CreditCard className="h-4 w-4" aria-hidden />
            <span>Facturación</span>
            <strong>Marzo 2026</strong>
          </header>
          <div className="ac-billing-mock__kpis">
            <article>
              <small>Facturado</small>
              <strong>€12.480</strong>
            </article>
            <article>
              <small>Cobrado</small>
              <strong>€11.920</strong>
            </article>
            <article>
              <small>Pendiente</small>
              <strong>€560</strong>
            </article>
          </div>
          <ul className="ac-billing-mock__list">
            <li>
              <span>Factura #204</span>
              <em>Pagada</em>
            </li>
            <li>
              <span>Factura #205</span>
              <em>Pendiente</em>
            </li>
            <li>
              <span>Recibo #89</span>
              <em>Enviado</em>
            </li>
          </ul>
        </div>
      </div>
    )
  }

  return (
    <div className="ac-feature-visual ac-feature-visual--security" role="img" aria-label={title}>
      <div className="ac-security-mock">
        <header>
          <Shield className="h-4 w-4" aria-hidden />
          <span>Plataforma multi-clínica</span>
        </header>
        <div className="ac-security-mock__grid">
          <article>
            <Lock className="h-3.5 w-3.5" aria-hidden />
            <strong>RLS activo</strong>
            <small>Aislamiento por clínica</small>
          </article>
          <article>
            <Users className="h-3.5 w-3.5" aria-hidden />
            <strong>24 roles</strong>
            <small>Permisos granulares</small>
          </article>
          <article>
            <FileText className="h-3.5 w-3.5" aria-hidden />
            <strong>Auditoría</strong>
            <small>Registro de acciones</small>
          </article>
        </div>
        <p>Multi-sede · SSO · Copias de seguridad</p>
      </div>
    </div>
  )
}

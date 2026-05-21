import { Building2, ChevronRight, ClipboardPlus, Lock, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
import { PortalLoginShell } from './PortalLoginShell';

const TRUST_ITEMS = [
  { icon: ShieldCheck, label: 'Sesión cifrada' },
  { icon: Lock, label: 'Datos aislados por clínica' },
  { icon: Sparkles, label: 'RGPD · trazabilidad' }
] as const;

export function LoginHubPage() {
  return (
    <PortalLoginShell
      variant="hub"
      eyebrow="Dentista+ · Acceso seguro"
      title="Elige tu portal"
      lead="Accede al panel de tu centro o al espacio personal del paciente. Sin cruces entre clínicas."
      footer={
        <div className="login-portal__foot-grid">
          <a href="/">← Inicio público</a>
          <a href="/registro-clinica">Registrar mi clínica</a>
          <a href="/platform/login" className="login-portal__foot-muted">
            Equipo plataforma
          </a>
        </div>
      }
    >
      <ul className="login-portal__trust" aria-label="Garantías de seguridad">
        {TRUST_ITEMS.map(({ icon: Icon, label }) => (
          <li key={label}>
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {label}
          </li>
        ))}
      </ul>

      <ul className="login-portal__options login-portal__options--hub">
        <li className="login-portal__option-wrap" style={{ animationDelay: '0.05s' }}>
          <a href="/login/admin" className="login-portal__option login-portal__option--admin login-portal__link">
            <span className="login-portal__option-icon" aria-hidden>
              <Building2 className="h-5 w-5" />
            </span>
            <span className="login-portal__option-text">
              <span className="login-portal__option-row">
                <span className="login-portal__option-title">Panel clínica</span>
                <span className="login-portal__option-badge login-portal__option-badge--blue">Staff</span>
              </span>
              <span className="login-portal__option-meta">Agenda, pacientes, facturación y equipo</span>
            </span>
            <span className="login-portal__option-cta">
              Administración
              <ChevronRight className="h-4 w-4" />
            </span>
          </a>
        </li>
        <li className="login-portal__option-wrap" style={{ animationDelay: '0.12s' }}>
          <a
            href="/login/paciente"
            className="login-portal__option login-portal__option--patient login-portal__option--highlight login-portal__link"
          >
            <span className="login-portal__option-icon login-portal__option-icon--teal" aria-hidden>
              <UserRound className="h-5 w-5" />
            </span>
            <span className="login-portal__option-text">
              <span className="login-portal__option-row">
                <span className="login-portal__option-title">Portal paciente</span>
                <span className="login-portal__option-badge login-portal__option-badge--teal">Paciente</span>
              </span>
              <span className="login-portal__option-meta">Citas, informes clínicos y pagos</span>
            </span>
            <span className="login-portal__option-cta">
              Mi cuenta
              <ChevronRight className="h-4 w-4" />
            </span>
          </a>
        </li>
      </ul>

      <p className="login-portal__hint">
        ¿Primera vez? Solicita el alta de tu centro en{' '}
        <a href="/registro-clinica">registro de clínica</a>. Tras la aprobación recibirás acceso solo a tu panel.
      </p>

      <div className="login-portal__secondary">
        <a href="/registro-clinica" className="login-portal__secondary-link">
          <ClipboardPlus className="h-4 w-4" aria-hidden />
          <span>
            <strong>Registrar clínica</strong>
            <small>Solicitud de alta al SaaS</small>
          </span>
          <ChevronRight className="h-4 w-4" />
        </a>
      </div>
    </PortalLoginShell>
  );
}

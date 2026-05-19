import { Building2, ChevronRight, UserRound } from 'lucide-react';
import { isClientDemoMode } from '@/lib/appMode';
import { DEMO_TENANTS } from '@/lib/tenantIds';
import { PortalLoginShell } from './PortalLoginShell';

export function LoginHubPage() {
  const demo = isClientDemoMode();

  return (
    <PortalLoginShell
      variant="patient"
      eyebrow="Dentista+ · Acceso seguro"
      title="Elige tu portal"
      lead={
        demo
          ? 'Modo demo: entra como clínica o como paciente. Sin inicio automático.'
          : 'Inicia sesión en el panel de tu clínica o en el espacio del paciente.'
      }
      footer={
        <a href="/">Volver al inicio público</a>
      }
    >
      <ul className="login-portal__options">
        <li>
          <a href="/login/admin" className="login-portal__option login-portal__option--admin login-portal__link">
            <span className="login-portal__option-icon" aria-hidden>
              <Building2 className="h-5 w-5" />
            </span>
            <span className="login-portal__option-text">
              <span className="login-portal__option-title">Panel clínica</span>
              <span className="login-portal__option-meta">
                {DEMO_TENANTS.map((t) => t.label).join(' · ')}
              </span>
            </span>
            <span className="login-portal__option-cta">
              Administración
              <ChevronRight className="h-4 w-4" />
            </span>
          </a>
        </li>
        <li>
          <a href="/login/paciente" className="login-portal__option login-portal__option--patient login-portal__option--highlight login-portal__link">
            <span className="login-portal__option-icon login-portal__option-icon--teal" aria-hidden>
              <UserRound className="h-5 w-5" />
            </span>
            <span className="login-portal__option-text">
              <span className="login-portal__option-title">Portal paciente</span>
              <span className="login-portal__option-meta">Elena Vidal Romero · DNI 45678912K</span>
            </span>
            <span className="login-portal__option-cta">
              Mi cuenta
              <ChevronRight className="h-4 w-4" />
            </span>
          </a>
        </li>
      </ul>
    </PortalLoginShell>
  );
}

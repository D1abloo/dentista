import { LiveLoginForm } from './LiveLoginForm';
import { LoginAccessFoot } from './LoginAccessChrome';
import { PortalLoginShell } from './PortalLoginShell';

export function AdminLoginPage() {
  return (
    <PortalLoginShell
      variant="admin"
      barBadge="Panel clínica"
      eyebrow="Dentista+ · Administración"
      title="Acceso a tu clínica"
      lead="Gestiona agenda, pacientes, informes y facturación."
      backHref="/login"
      backLabel="Elegir portal"
      footer={
        <LoginAccessFoot
          links={[
            { href: '/login/paciente', label: 'Portal paciente' },
            { href: '/platform/login', label: 'Plataforma' },
            { href: '/', label: 'Inicio' }
          ]}
        />
      }
    >
      <LiveLoginForm apiRole="admin" variant="admin" />
    </PortalLoginShell>
  );
}

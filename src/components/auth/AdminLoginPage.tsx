import { LiveLoginForm } from './LiveLoginForm';
import { PortalLoginShell } from './PortalLoginShell';

export function AdminLoginPage() {
  return (
    <PortalLoginShell
      variant="admin"
      eyebrow="Panel clínica · Dentista+"
      title="Acceso administración"
      lead="Inicia sesión para gestionar citas, pacientes y facturación."
      footer={
        <div className="login-portal__foot-grid login-portal__foot-grid--compact">
          <a href="/login">← Elegir portal</a>
          <a href="/login/paciente">Portal paciente</a>
          <a href="/">Inicio</a>
        </div>
      }
    >
      <LiveLoginForm apiRole="admin" variant="admin" />
    </PortalLoginShell>
  );
}

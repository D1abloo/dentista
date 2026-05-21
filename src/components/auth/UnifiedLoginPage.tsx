import { PortalLoginShell } from './PortalLoginShell';
import { UnifiedLoginForm } from './UnifiedLoginForm';

export function UnifiedLoginPage() {
  return (
    <PortalLoginShell
      variant="hub"
      eyebrow="Dentista+ · Acceso"
      title="Inicia sesión"
      lead="Un solo formulario para pacientes y personal de clínica. Detectamos tu cuenta y te llevamos al espacio correcto."
      footer={
        <div className="login-portal__foot-grid">
          <a href="/">← Inicio</a>
          <a href="/registro-clinica">Registrar clínica</a>
          <a href="/reserva">Reservar cita</a>
        </div>
      }
    >
      <UnifiedLoginForm />
    </PortalLoginShell>
  );
}

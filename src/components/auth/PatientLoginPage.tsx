import { LiveLoginForm } from './LiveLoginForm';
import { PortalLoginShell } from './PortalLoginShell';

export function PatientLoginPage() {
  return (
    <PortalLoginShell
      variant="patient"
      eyebrow="Portal del paciente · Dentista+"
      title="Tu espacio de salud dental"
      lead="Consulta citas, documentos y facturas de forma segura."
      footer={
        <div className="login-portal__foot-grid login-portal__foot-grid--compact">
          <a href="/login">← Acceso unificado</a>
          <a href="/">Inicio</a>
        </div>
      }
    >
      <LiveLoginForm apiRole="patient" variant="patient" />
    </PortalLoginShell>
  );
}

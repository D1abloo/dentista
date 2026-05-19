import { useState } from 'react';
import { ChevronRight, FlaskConical, UserRound } from 'lucide-react';
import { isClientDemoMode } from '@/lib/appMode';
import { signInAs } from '@/lib/demoAuth';
import { DEMO_PATIENT_LOGIN_ID } from '@/data/demoData';
import { LiveLoginForm } from './LiveLoginForm';
import { PortalLoginShell } from './PortalLoginShell';

const PATIENT_LABEL = 'María González';

export function PatientLoginPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const demo = isClientDemoMode();

  async function enterDemo(ephemeral: boolean) {
    const key = ephemeral ? 'ephemeral' : 'save';
    setLoading(key);
    const path = await signInAs('paciente', { ephemeral });
    window.location.href = path;
  }

  return (
    <PortalLoginShell
      variant="patient"
      eyebrow="Portal del paciente · Dentista+"
      title="Tu espacio de salud dental"
      lead={
        demo
          ? `Accede como ${PATIENT_LABEL} (${DEMO_PATIENT_LOGIN_ID}) y revisa citas, informes y pagos.`
          : 'Consulta citas, documentos y facturas de forma segura.'
      }
      footer={
        <>
          <a href="/login/admin">Panel clínica</a>
          <span aria-hidden>·</span>
          <a href="/">Inicio</a>
        </>
      }
    >
      {demo ? (
        <ul className="login-portal__options">
          <li>
            <button
              type="button"
              className="login-portal__option login-portal__option--patient login-portal__option--highlight"
              disabled={!!loading}
              onClick={() => enterDemo(true)}
            >
              <span className="login-portal__option-icon login-portal__option-icon--teal" aria-hidden>
                <FlaskConical className="h-5 w-5" />
              </span>
              <span className="login-portal__option-text">
                <span className="login-portal__option-title">Modo prueba</span>
                <span className="login-portal__option-meta">Explora sin guardar al recargar</span>
              </span>
              <span className="login-portal__option-cta">
                {loading === 'ephemeral' ? 'Entrando…' : 'Probar'}
                <ChevronRight className="h-4 w-4" />
              </span>
            </button>
          </li>
          <li>
            <button
              type="button"
              className="login-portal__option login-portal__option--patient"
              disabled={!!loading}
              onClick={() => enterDemo(false)}
            >
              <span className="login-portal__option-icon login-portal__option-icon--teal" aria-hidden>
                <UserRound className="h-5 w-5" />
              </span>
              <span className="login-portal__option-text">
                <span className="login-portal__option-title">Entrar con mi cuenta</span>
                <span className="login-portal__option-meta font-mono">{DEMO_PATIENT_LOGIN_ID}</span>
              </span>
              <span className="login-portal__option-cta">
                {loading === 'save' ? 'Entrando…' : 'Continuar'}
                <ChevronRight className="h-4 w-4" />
              </span>
            </button>
          </li>
        </ul>
      ) : (
        <LiveLoginForm apiRole="patient" variant="patient" />
      )}
    </PortalLoginShell>
  );
}

import { ArrowLeft, Shield, UserCog } from 'lucide-react';
import { usePortalAccess } from '@/hooks/usePortalAccess';

export function PatientStaffHub() {
  const portalAccess = usePortalAccess();

  return (
    <div className="patient-staff-hub stack gap-4">
      <p className="m-0 text-sm text-slate-600">
        Zona administrativa dentro del portal del paciente. Usa estas herramientas solo con autorización y deja
        trazabilidad en auditoría.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="patient-staff-hub__card patient-staff-hub__card--muted">
          <span className="patient-staff-hub__icon" aria-hidden>
            <UserCog className="h-5 w-5" />
          </span>
          <span>
            <strong>Acceso autorizado</strong>
            <small>
              Genera tokens desde «Acceso PdP» en el panel de clínica (menú lateral). No hay enlaces externos desde
              esta vista.
            </small>
          </span>
        </div>

        {portalAccess.active ? (
          <button
            type="button"
            className="patient-staff-hub__card patient-staff-hub__card--action"
            onClick={() => void portalAccess.closeAccess()}
          >
            <span className="patient-staff-hub__icon" aria-hidden>
              <ArrowLeft className="h-5 w-5" />
            </span>
            <span>
              <strong>Cerrar vista de paciente</strong>
              <small>Finaliza el acceso clínico a {portalAccess.patientName ?? 'este paciente'}</small>
            </span>
          </button>
        ) : (
          <div className="patient-staff-hub__card patient-staff-hub__card--muted">
            <span className="patient-staff-hub__icon" aria-hidden>
              <UserCog className="h-5 w-5" />
            </span>
            <span>
              <strong>Sesión de administrador</strong>
              <small>
                Estás en el PdP con tu cuenta de clínica. Para ver datos de un paciente, activa un token desde el panel
                de clínica.
              </small>
            </span>
          </div>
        )}

        <div className="patient-staff-hub__card patient-staff-hub__card--muted sm:col-span-2">
          <span className="patient-staff-hub__icon" aria-hidden>
            <Shield className="h-5 w-5" />
          </span>
          <span>
            <strong>Privacidad</strong>
            <small>
              El panel administrativo no aparece en la web pública. Solo personal autorizado puede acceder con
              credenciales válidas.
            </small>
          </span>
        </div>
      </div>
    </div>
  );
}

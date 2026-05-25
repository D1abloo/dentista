import { Calendar, FileText, MessageSquare, Receipt, ShieldCheck } from 'lucide-react';

const NAV = [
  { id: 'inicio', label: 'Inicio', active: true },
  { id: 'citas', label: 'Citas' },
  { id: 'informes', label: 'Informes' },
  { id: 'documentos', label: 'Documentos' },
  { id: 'perfil', label: 'Perfil' }
] as const;

const FLOATS = [
  { id: 'cita', label: 'Próxima cita', icon: Calendar, pos: 'tl' },
  { id: 'informe', label: 'Informe disponible', icon: FileText, pos: 'tr' },
  { id: 'factura', label: 'Factura pendiente', icon: Receipt, pos: 'bl' },
  { id: 'mensaje', label: 'Mensaje de la clínica', icon: MessageSquare, pos: 'br' }
] as const;

/** Mockup ilustrativo — no datos clínicos reales. */
export function PatientPortalPhoneMockup() {
  return (
    <div className="ppp-v2-mockup" aria-hidden="true">
      {FLOATS.map((f) => {
        const Icon = f.icon;
        return (
          <div key={f.id} className={`ppp-v2-mockup__float ppp-v2-mockup__float--${f.pos}`}>
            <Icon className="h-3.5 w-3.5" aria-hidden />
            <span>{f.label}</span>
          </div>
        );
      })}

      <div className="ppp-v2-mockup__device">
        <div className="ppp-v2-mockup__bezel">
          <div className="ppp-v2-mockup__screen">
            <header className="ppp-v2-mockup__header">
              <span className="ppp-v2-mockup__status" />
              <span className="ppp-v2-mockup__title">Inicio</span>
            </header>

            <p className="ppp-v2-mockup__patient">Elena Vidal Romero · DNI 45678912K</p>

            <div className="ppp-v2-mockup__card ppp-v2-mockup__card--alert">
              <p>Tienes 1 consentimiento por firmar antes de tu próxima visita.</p>
              <span className="ppp-v2-mockup__btn">Firmar ahora</span>
            </div>

            <div className="ppp-v2-mockup__card">
              <Receipt className="h-4 w-4" aria-hidden />
              <span>3 factura(s) pendiente(s)</span>
            </div>

            <div className="ppp-v2-mockup__card">
              <MessageSquare className="h-4 w-4" aria-hidden />
              <span>2 mensaje(s) sin leer</span>
            </div>

            <div className="ppp-v2-mockup__card ppp-v2-mockup__card--dark">
              <p>Toda tu información dental en un solo lugar</p>
            </div>

            <nav className="ppp-v2-mockup__nav">
              {NAV.map((item) => (
                <span
                  key={item.id}
                  className={
                    'active' in item && item.active
                      ? 'ppp-v2-mockup__nav-item ppp-v2-mockup__nav-item--active'
                      : 'ppp-v2-mockup__nav-item'
                  }
                >
                  {item.label}
                </span>
              ))}
            </nav>
          </div>
        </div>
      </div>

      <p className="ppp-v2-mockup__pill">
        <ShieldCheck className="h-4 w-4" aria-hidden />
        Datos protegidos · solo tú
      </p>

      <span className="sr-only">
        Vista ilustrativa del portal del paciente en móvil: inicio, citas, informes, documentos y perfil.
      </span>
    </div>
  );
}

import type { WorkflowMock } from '@/lib/landing/productExperienceContent';

type Props = { variant: WorkflowMock };

export function WorkflowStepMock({ variant }: Props) {
  switch (variant) {
    case 'booking':
      return (
        <div className="ps-flow-mock ps-flow-mock--booking" aria-hidden>
          <div className="ps-flow-mock__cal-head">
            <span>Mayo 2024</span>
          </div>
          <div className="ps-flow-mock__slots">
            <span>09:00</span>
            <span className="ps-flow-mock__slot--on">11:00</span>
            <span>16:30</span>
          </div>
        </div>
      );
    case 'agenda':
      return (
        <div className="ps-flow-mock ps-flow-mock--agenda" aria-hidden>
          <small>Hoy, 21 mayo</small>
          <ul>
            <li>
              <span className="ps-flow-mock__dot ps-flow-mock__dot--a" /> María López · 09:30
            </li>
            <li>
              <span className="ps-flow-mock__dot ps-flow-mock__dot--b" /> Carlos Ruiz · 11:00
            </li>
            <li>
              <span className="ps-flow-mock__dot ps-flow-mock__dot--c" /> Ana Torres · 16:00
            </li>
          </ul>
        </div>
      );
    case 'report':
      return (
        <div className="ps-flow-mock ps-flow-mock--report" aria-hidden>
          <strong>Informe odontológico</strong>
          <span>Paciente: María López</span>
          <span className="ps-flow-mock__badge">Completado</span>
          <span className="ps-flow-mock__sign">Firma profesional</span>
        </div>
      );
    case 'invoice':
      return (
        <div className="ps-flow-mock ps-flow-mock--invoice" aria-hidden>
          <span>Factura #FAC-2026-0158</span>
          <strong>120,00 €</strong>
          <span className="ps-flow-mock__badge ps-flow-mock__badge--paid">Pagada</span>
        </div>
      );
    case 'portal':
      return (
        <div className="ps-flow-mock ps-flow-mock--portal" aria-hidden>
          <strong>Mis documentos</strong>
          <ul>
            <li>
              Informe clínico <span>Ver</span>
            </li>
            <li>
              Factura <span>Ver</span>
            </li>
            <li>
              Consentimiento <span>Ver</span>
            </li>
          </ul>
        </div>
      );
    default:
      return null;
  }
}

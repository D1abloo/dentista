import { Calendar, FileText, Receipt, Shield, Smartphone } from 'lucide-react';

/** Composición decorativa del CTA final (sin controles interactivos). */
export function FinalCtaVisual() {
  return (
    <div
      className="ps-final-cta__visual"
      aria-label="Vista previa: panel clínica, portal paciente, factura PDF, agenda y seguridad"
      role="img"
    >
      <div className="ps-final-cta__card ps-final-cta__card--dash ps-final-cta__float ps-final-cta__float--1">
        <span className="ps-final-cta__card-label">
          <Calendar className="h-3 w-3" aria-hidden />
          Panel clínica
        </span>
        <div className="ps-final-cta__mini-bars" aria-hidden>
          <span style={{ height: '55%' }} />
          <span style={{ height: '80%' }} />
          <span style={{ height: '45%' }} />
          <span style={{ height: '70%' }} />
        </div>
      </div>
      <div className="ps-final-cta__card ps-final-cta__card--phone ps-final-cta__float ps-final-cta__float--2">
        <span className="ps-final-cta__card-label">
          <Smartphone className="h-3 w-3" aria-hidden />
          Portal paciente
        </span>
        <ul className="ps-final-cta__mini-list" aria-hidden>
          <li>Citas</li>
          <li>Informes</li>
          <li>Facturas</li>
        </ul>
      </div>
      <div className="ps-final-cta__card ps-final-cta__card--invoice ps-final-cta__float ps-final-cta__float--3">
        <span className="ps-final-cta__card-label">
          <Receipt className="h-3 w-3" aria-hidden />
          Factura PDF
        </span>
        <strong aria-hidden>120,00 €</strong>
        <span className="ps-final-cta__paid" aria-hidden>Pagada</span>
      </div>
      <div className="ps-final-cta__card ps-final-cta__card--cal ps-final-cta__float ps-final-cta__float--4">
        <span className="ps-final-cta__card-label">
          <FileText className="h-3 w-3" aria-hidden />
          Agenda
        </span>
        <div className="ps-final-cta__cal-grid" aria-hidden>
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={i} className={i === 5 ? 'is-on' : undefined} />
          ))}
        </div>
      </div>
      <span className="ps-final-cta__badge ps-final-cta__float ps-final-cta__float--5" aria-hidden>
        <Shield className="h-3.5 w-3.5" />
        Multi-tenant seguro
      </span>
    </div>
  );
}

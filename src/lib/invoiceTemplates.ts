/** Plantillas de factura por clínica (solo datos demo / formulario admin). */
export type InvoiceTemplate = {
  id: string;
  name: string;
  concept: string;
  amount: number;
  description: string;
  lines?: { label: string; qty: number; unit: number }[];
};

export const INVOICE_TEMPLATES: InvoiceTemplate[] = [
  {
    id: 'tpl-limpieza',
    name: 'Limpieza dental',
    concept: 'Limpieza dental profesional',
    amount: 80,
    description: 'Profilaxis y revisión básica',
    lines: [{ label: 'Limpieza dental', qty: 1, unit: 80 }]
  },
  {
    id: 'tpl-revision',
    name: 'Revisión general',
    concept: 'Revisión odontológica general',
    amount: 55,
    description: 'Exploración y plan de tratamiento',
    lines: [{ label: 'Revisión', qty: 1, unit: 55 }]
  },
  {
    id: 'tpl-ortodoncia',
    name: 'Ortodoncia mensual',
    concept: 'Ortodoncia · sesión de control',
    amount: 120,
    description: 'Control de brackets o alineadores',
    lines: [{ label: 'Sesión ortodoncia', qty: 1, unit: 120 }]
  },
  {
    id: 'tpl-endodoncia',
    name: 'Endodoncia',
    concept: 'Endodoncia unirradicular',
    amount: 320,
    description: 'Tratamiento de conductos',
    lines: [
      { label: 'Endodoncia', qty: 1, unit: 280 },
      { label: 'Radiografía control', qty: 1, unit: 40 }
    ]
  },
  {
    id: 'tpl-implantes',
    name: 'Implantes fase 1',
    concept: 'Implantes · valoración y cirugía',
    amount: 600,
    description: 'Estudio y primera fase quirúrgica',
    lines: [
      { label: 'Valoración CBCT', qty: 1, unit: 150 },
      { label: 'Cirugía implante', qty: 1, unit: 450 }
    ]
  },
  {
    id: 'tpl-blanqueamiento',
    name: 'Blanqueamiento',
    concept: 'Blanqueamiento dental en gabinete',
    amount: 250,
    description: 'Sesión única con protector gingival',
    lines: [{ label: 'Blanqueamiento', qty: 1, unit: 250 }]
  },
  {
    id: 'tpl-carillas',
    name: 'Carillas estéticas',
    concept: 'Carillas de composite / porcelana',
    amount: 450,
    description: 'Presupuesto por unidad (demo)',
    lines: [{ label: 'Carilla unitaria', qty: 1, unit: 450 }]
  },
  {
    id: 'tpl-urgencia',
    name: 'Urgencia dental',
    concept: 'Urgencia · consulta y tratamiento inicial',
    amount: 95,
    description: 'Atención preferente fuera de horario',
    lines: [{ label: 'Urgencia', qty: 1, unit: 95 }]
  }
];

export function invoiceTemplateById(id: string) {
  return INVOICE_TEMPLATES.find((t) => t.id === id);
}

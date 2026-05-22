export type ShowcaseItem = {
  src: string;
  title: string;
  description: string;
  tags: string[];
};

const m = (name: string) => `/images/guides/mobile/${name}.png`;

export const patientShowcases: ShowcaseItem[] = [
  {
    src: m('pdp-inicio'),
    title: 'Inicio del portal',
    description: 'Próxima cita, avisos de facturas pendientes, informes nuevos y accesos rápidos a reservar.',
    tags: ['CIT-XXXX', 'Avisos', 'Resumen']
  },
  {
    src: m('pdp-citas'),
    title: 'Mis citas',
    description: 'Listado con fecha, profesional, tratamiento y estado: confirmada, pendiente o cancelada.',
    tags: ['Agenda', 'Estados', 'Reprogramar']
  },
  {
    src: m('pdp-informes'),
    title: 'Informes clínicos',
    description: 'PDFs compartidos por tu clínica: diagnóstico, recomendaciones y descarga segura.',
    tags: ['INF-XXXX', 'PDF', 'Historial']
  },
  {
    src: m('pdp-documentos'),
    title: 'Documentos',
    description: 'Radiografías, fotos intraorales y archivos del expediente con vista previa.',
    tags: ['RX', 'Consentimientos', 'Archivos']
  },
  {
    src: m('pdp-facturas'),
    title: 'Facturas',
    description: 'Importe, vencimiento y PDF de cada FAC-XXXX. Consulta pagadas y pendientes.',
    tags: ['FAC-XXXX', 'IVA', 'PDF']
  },
  {
    src: m('pdp-pagos'),
    title: 'Pagos',
    description: 'Historial PAG-XXXX vinculado a facturas con método y fecha de cobro.',
    tags: ['PAG-XXXX', 'Recibos', 'Estado']
  }
];

export const clinicShowcases: ShowcaseItem[] = [
  {
    src: m('admin-dashboard'),
    title: 'Panel administrativo',
    description: 'KPIs del día: citas, ingresos, ocupación y accesos rápidos a módulos clave.',
    tags: ['Dashboard', 'KPIs', 'Multi-sede']
  },
  {
    src: m('admin-agenda'),
    title: 'Agenda clínica',
    description: 'Vista día/semana/mes, bloqueo de huecos, citas por dentista y gabinete.',
    tags: ['CIT-XXXX', 'Bloqueos', 'Profesional']
  },
  {
    src: m('admin-pacientes'),
    title: 'Pacientes',
    description: 'Búsqueda por NHC, DNI o nombre. Ficha PAT-XXXX con historial completo.',
    tags: ['PAT-XXXX', 'NHC', 'Expediente']
  },
  {
    src: m('admin-facturas'),
    title: 'Facturación',
    description: 'Emisión FAC-XXXX, cobros, estados y PDF con logo de la clínica.',
    tags: ['FAC-XXXX', 'Cobros', 'Reportes']
  },
  {
    src: m('admin-acceso'),
    title: 'Acceso al portal paciente',
    description: 'Token auditado para revisar lo que ve el paciente con trazabilidad legal.',
    tags: ['PdP', 'Auditoría', 'Token']
  }
];

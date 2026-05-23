import type { DemoState } from '@/types/demo';
import { fmtDate, fmtDateTime } from '@/lib/format';
import { patientDisplayCode } from '@/lib/nhc';
import { patientName } from '@/lib/selectors';

export type ReportTemplateId =
  | 'revision_general'
  | 'limpieza_dental'
  | 'endodoncia'
  | 'periodoncia'
  | 'odontopediatria'
  | 'cirugia_oral'
  | 'protesis'
  | 'ortodoncia'
  | 'implantes'
  | 'blanqueamiento';

export type AppointmentReportContext = {
  patientId: string;
  patientName: string;
  nhcLabel: string;
  clinicId: string;
  clinicName: string;
  appointmentId: string;
  appointmentDate: string;
  appointmentTime: string;
  dateLabel: string;
  treatmentName: string;
  dentistName: string;
};

export type ReportTemplateMeta = {
  id: ReportTemplateId;
  label: string;
  icon: string;
};

export const REPORT_TEMPLATES: ReportTemplateMeta[] = [
  { id: 'revision_general', label: 'Revisión general', icon: '🦷' },
  { id: 'limpieza_dental', label: 'Limpieza dental', icon: '✨' },
  { id: 'endodoncia', label: 'Endodoncia', icon: '🔬' },
  { id: 'periodoncia', label: 'Periodoncia', icon: '🩺' },
  { id: 'odontopediatria', label: 'Odontopediatría', icon: '👶' },
  { id: 'cirugia_oral', label: 'Cirugía oral', icon: '⚕️' },
  { id: 'protesis', label: 'Prótesis', icon: '🦿' },
  { id: 'ortodoncia', label: 'Ortodoncia', icon: '📐' },
  { id: 'implantes', label: 'Implantes', icon: '🔩' },
  { id: 'blanqueamiento', label: 'Blanqueamiento', icon: '💎' }
];

export function buildReportTitle(ctx: AppointmentReportContext): string {
  return `Informe odontológico - ${ctx.treatmentName} - ${ctx.dateLabel}`;
}

export function getAppointmentReportContext(
  state: DemoState,
  appointmentId: string
): AppointmentReportContext | null {
  const appt = state.appointments.find((a) => a.id === appointmentId);
  if (!appt) return null;
  const patient = state.patients.find((p) => p.id === appt.patientId);
  const clinic = state.clinics.find((c) => c.id === appt.clinicId);
  const treatment = state.treatments.find((t) => t.id === appt.treatmentId);
  const dentist = state.dentists.find((d) => d.id === appt.dentistId);
  if (!patient || !clinic) return null;

  return {
    patientId: patient.id,
    patientName: patient.fullName,
    nhcLabel: patientDisplayCode(patient),
    clinicId: clinic.id,
    clinicName: clinic.name,
    appointmentId: appt.id,
    appointmentDate: appt.date,
    appointmentTime: appt.time,
    dateLabel: fmtDate(appt.date),
    treatmentName: treatment?.name ?? 'Consulta',
    dentistName: dentist?.fullName ?? 'Profesional asignado'
  };
}

function descriptionBlock(ctx: AppointmentReportContext, extras?: { exploracion?: string; actuaciones?: string[] }) {
  const actuaciones = extras?.actuaciones ?? [
    '[Actuación 1]',
    '[Actuación 2]',
    '[Actuación 3]'
  ];
  const piezas = ['[Pieza / zona 1]', '[Pieza / zona 2]', '[Pieza / zona 3]'];
  const observaciones = ['[Observación 1]', '[Observación 2]', '[Observación 3]'];

  return `Paciente atendido en consulta el día ${ctx.dateLabel} en ${ctx.clinicName}.
Motivo de consulta: ${ctx.treatmentName}.

Durante la visita se realiza valoración clínica y se registra el estado bucodental actual del paciente.
${extras?.exploracion ?? 'Se revisan antecedentes relevantes, síntomas referidos y hallazgos observados durante la exploración.'}

Piezas o zona tratada/revisada:
${piezas.map((p) => `- ${p}`).join('\n')}

Actuación realizada:
${actuaciones.map((a) => `- ${a}`).join('\n')}

Observaciones clínicas:
${observaciones.map((o) => `- ${o}`).join('\n')}`;
}

function diagnosisBlock(notes?: string) {
  return `Diagnóstico principal:
${notes ?? '[Escribir diagnóstico principal]'}

Diagnósticos secundarios / hallazgos:
- [Hallazgo 1]
- [Hallazgo 2]
- [Hallazgo 3]

Estado general:
[Estable / En seguimiento / Requiere tratamiento / Requiere revisión]`;
}

function recommendationsBlock(followUp?: string) {
  return `Recomendaciones al paciente:
- [Recomendación 1]
- [Recomendación 2]
- [Recomendación 3]

Tratamiento recomendado:
[Tratamiento recomendado]

Seguimiento:
${followUp ?? '[Indicar si requiere revisión, control o nueva cita]'}

Próxima revisión sugerida:
[Fecha orientativa o plazo]

Indicaciones adicionales:
- [Indicación adicional 1]
- [Indicación adicional 2]`;
}

const TEMPLATE_BUILDERS: Record<
  ReportTemplateId,
  (ctx: AppointmentReportContext) => { description: string; diagnosis: string; recommendations: string }
> = {
  revision_general: (ctx) => ({
    description: descriptionBlock(ctx),
    diagnosis: diagnosisBlock(),
    recommendations: recommendationsBlock()
  }),
  limpieza_dental: (ctx) => ({
    description: descriptionBlock(ctx, {
      exploracion: 'Exploración periodontal y detección de placa/biofilm. Valoración de encías y superficies dentales.',
      actuaciones: [
        'Higiene dental profesional',
        'Eliminación de sarro supragingival',
        'Instrucciones de higiene oral'
      ]
    }),
    diagnosis: diagnosisBlock('Salud periodontal compatible con limpieza dental de mantenimiento.'),
    recommendations: recommendationsBlock('Control en 6 meses o según evolución clínica.')
  }),
  endodoncia: (ctx) => ({
    description: descriptionBlock(ctx, {
      exploracion: 'Exploración clínica y radiográfica de la pieza afectada. Valoración de síntomas y vitalidad.',
      actuaciones: [
        'Apertura cameral y acceso',
        'Instrumentación y desinfección del conducto',
        'Obturación provisional / definitiva según fase'
      ]
    }),
    diagnosis: diagnosisBlock('Pulpitis / necrosis pulpar en pieza tratada (completar según hallazgos).'),
    recommendations: recommendationsBlock('Revisión endodóntica según protocolo. Restauración definitiva recomendada.')
  }),
  periodoncia: (ctx) => ({
    description: descriptionBlock(ctx, {
      exploracion: 'Sondaje periodontal, índices de placa y evaluación de bolsas.',
      actuaciones: ['Raspado y alisado radicular', 'Instrucciones de higiene interproximal', 'Control de biofilm']
    }),
    diagnosis: diagnosisBlock('Enfermedad periodontal en estadio a completar según clasificación.'),
    recommendations: recommendationsBlock('Mantenimiento periodontal periódico.')
  }),
  odontopediatria: (ctx) => ({
    description: descriptionBlock(ctx, {
      exploracion: 'Exploración adaptada a edad. Valoración de erupción, caries y hábitos.',
      actuaciones: ['Exploración clínica', 'Aplicación de flúor si indicado', 'Educación al paciente/familia']
    }),
    diagnosis: diagnosisBlock('Estado bucodental pediátrico a completar.'),
    recommendations: recommendationsBlock('Control semestral o según riesgo de caries.')
  }),
  cirugia_oral: (ctx) => ({
    description: descriptionBlock(ctx, {
      exploracion: 'Valoración prequirúrgica. Revisión de antecedentes y zona quirúrgica.',
      actuaciones: ['Exodoncia / cirugía según plan', 'Control de hemostasia', 'Indicaciones postoperatorias']
    }),
    diagnosis: diagnosisBlock('Indicación quirúrgica documentada.'),
    recommendations: recommendationsBlock('Control postoperatorio en 7-10 días.')
  }),
  protesis: (ctx) => ({
    description: descriptionBlock(ctx, {
      exploracion: 'Valoración oclusal y de piezas pilares. Toma de impresiones si procede.',
      actuaciones: ['Prueba de estructura / ajuste', 'Entrega de prótesis', 'Instrucciones de cuidado']
    }),
    diagnosis: diagnosisBlock('Rehabilitación protésica en curso / completada.'),
    recommendations: recommendationsBlock('Revisión protésica según necesidad.')
  }),
  ortodoncia: (ctx) => ({
    description: descriptionBlock(ctx, {
      exploracion: 'Control de ortodoncia. Revisión de brackets/alineadores y oclusión.',
      actuaciones: ['Ajuste de aparatología', 'Registro de evolución', 'Indicaciones de higiene']
    }),
    diagnosis: diagnosisBlock('Tratamiento de ortodoncia en seguimiento.'),
    recommendations: recommendationsBlock('Próximo control según plan de tratamiento.')
  }),
  implantes: (ctx) => ({
    description: descriptionBlock(ctx, {
      exploracion: 'Valoración de tejidos blandos y duros. Control radiográfico del implante.',
      actuaciones: ['Colocación / revisión de implante', 'Control de osteointegración', 'Plan de carga protésica']
    }),
    diagnosis: diagnosisBlock('Implante en fase de osteointegración / rehabilitación.'),
    recommendations: recommendationsBlock('Control según protocolo de implantes.')
  }),
  blanqueamiento: (ctx) => ({
    description: descriptionBlock(ctx, {
      exploracion: 'Evaluación de coloración dental y contraindicaciones.',
      actuaciones: ['Sesión de blanqueamiento', 'Registro de color inicial/final', 'Indicaciones post-tratamiento']
    }),
    diagnosis: diagnosisBlock('Discromía dental tratada con blanqueamiento.'),
    recommendations: recommendationsBlock('Evitar pigmentos 48-72 h. Mantenimiento según indicación.')
  })
};

export function applyReportTemplate(
  templateId: ReportTemplateId,
  ctx: AppointmentReportContext
): { title: string; description: string; diagnosis: string; recommendations: string } {
  const parts = TEMPLATE_BUILDERS[templateId](ctx);
  return {
    title: buildReportTitle(ctx),
    ...parts
  };
}

export function appointmentBelongsToPatient(state: DemoState, appointmentId: string, patientId: string) {
  const appt = state.appointments.find((a) => a.id === appointmentId);
  return Boolean(appt && appt.patientId === patientId);
}

export function enrichReportListRow(state: DemoState, reportId: string) {
  const r = state.clinicalReports.find((x) => x.id === reportId);
  if (!r) return null;
  const patient = state.patients.find((p) => p.id === r.patientId);
  const appt = r.appointmentId ? state.appointments.find((a) => a.id === r.appointmentId) : null;
  const clinic = patient?.preferredClinicId
    ? state.clinics.find((c) => c.id === patient.preferredClinicId)
    : state.clinics[0];
  const dentist = appt ? state.dentists.find((d) => d.id === appt.dentistId) : null;
  const treatment = appt ? state.treatments.find((t) => t.id === appt.treatmentId) : null;

  return {
    report: r,
    patientName: patient ? patientName(state, r.patientId) : '—',
    nhc: patient ? patientDisplayCode(patient) : '—',
    clinicName: clinic?.name ?? '—',
    dateLabel: fmtDate(r.createdAt),
    appointmentLabel: appt ? `${fmtDateTime(appt.date, appt.time)} · ${treatment?.name ?? 'Cita'}` : 'Sin cita',
    dentistName: dentist?.fullName ?? r.uploadedBy,
    visibleLabel: r.visibleToPatient ? 'Sí' : 'No'
  };
}

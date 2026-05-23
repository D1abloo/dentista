import type { DemoState } from '@/types/demo';
import { settingsFor } from '@/lib/demoStore';
import { fmtDate, fmtDateTime } from '@/lib/format';
import { patientDisplayCode } from '@/lib/nhc';
import { patientName } from '@/lib/selectors';
import { REPORT_COLEGIO_FOOTER } from '@/lib/clinical/reportLegal';

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
  patientDni?: string;
  patientAllergies?: string;
  clinicId: string;
  clinicName: string;
  clinicAddress: string;
  clinicCity: string;
  clinicPhone: string;
  clinicEmail: string;
  clinicLogoUrl: string;
  appointmentId: string;
  appointmentDate: string;
  appointmentTime: string;
  dateLabel: string;
  treatmentName: string;
  dentistName: string;
  dentistHonorific: string;
  dentistCollegiateNumber: string;
  dentistSpecialty: string;
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

export function dentistHonorific(fullName: string): string {
  if (/^dra\.?\s/i.test(fullName) || /\bdra\.?\s/i.test(fullName)) return 'Dra.';
  return 'Dr.';
}

export function buildReportTitle(ctx: AppointmentReportContext): string {
  return `Informe odontológico - ${ctx.treatmentName} - ${ctx.dateLabel}`;
}

/** Sugiere plantilla según el motivo/tratamiento de la cita. */
export function inferReportTemplateFromTreatment(treatmentName: string): ReportTemplateId {
  const t = treatmentName.toLowerCase();
  if (t.includes('endodon')) return 'endodoncia';
  if (t.includes('implant')) return 'implantes';
  if (t.includes('ortodon') || t.includes('bracket') || t.includes('alineador')) return 'ortodoncia';
  if (t.includes('periodon') || t.includes('encía') || t.includes('encia')) return 'periodoncia';
  if (t.includes('limpieza') || t.includes('higiene') || t.includes('profilaxis')) return 'limpieza_dental';
  if (t.includes('blanque') || t.includes('estética') || t.includes('estetica')) return 'blanqueamiento';
  if (t.includes('prótesis') || t.includes('protesis') || t.includes('corona') || t.includes('puente')) return 'protesis';
  if (t.includes('cirug') || t.includes('exodon') || t.includes('extracc')) return 'cirugia_oral';
  if (t.includes('pediatr') || t.includes('niño') || t.includes('nino')) return 'odontopediatria';
  if (t.includes('revisión') || t.includes('revision') || t.includes('control') || t.includes('diagnóst')) {
    return 'revision_general';
  }
  return 'revision_general';
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

  const settings = settingsFor(state, clinic.tenantId);
  const honorific = dentist ? dentistHonorific(dentist.fullName) : 'Dr.';
  const dentistDisplay = dentist?.fullName.replace(/^(dr\.?|dra\.?)\s+/i, '').trim() ?? 'Profesional asignado';

  return {
    patientId: patient.id,
    patientName: patient.fullName,
    nhcLabel: patientDisplayCode(patient),
    patientDni: patient.dni,
    patientAllergies: patient.allergies,
    clinicId: clinic.id,
    clinicName: clinic.name,
    clinicAddress: clinic.address,
    clinicCity: clinic.city,
    clinicPhone: clinic.phone || settings.phone,
    clinicEmail: clinic.email || settings.email,
    clinicLogoUrl: settings.logoUrl ?? clinic.imageUrl ?? '/brand/clinic-shield.svg',
    appointmentId: appt.id,
    appointmentDate: appt.date,
    appointmentTime: appt.time,
    dateLabel: fmtDate(appt.date),
    treatmentName: treatment?.name ?? (appt.notes?.trim() || 'Consulta'),
    dentistName: dentistDisplay,
    dentistHonorific: honorific,
    dentistCollegiateNumber: dentist?.collegiateNumber ?? '[Nº colegiado]',
    dentistSpecialty: dentist?.specialty ?? 'Odontología general'
  };
}

export function buildReportLetterhead(ctx: AppointmentReportContext): string {
  const addressLine = [ctx.clinicAddress, ctx.clinicCity].filter(Boolean).join(', ');
  return [
    ctx.clinicName.toUpperCase(),
    addressLine || '[Dirección de la clínica]',
    `Tel. ${ctx.clinicPhone || '—'} · ${ctx.clinicEmail || '—'}`,
    '',
    `Paciente: ${ctx.patientName} · ${ctx.nhcLabel}${ctx.patientDni ? ` · DNI ${ctx.patientDni}` : ''}`,
    `Fecha de consulta: ${ctx.dateLabel} (${fmtDateTime(ctx.appointmentDate, ctx.appointmentTime)})`,
    `${ctx.dentistHonorific} ${ctx.dentistName} · ${ctx.dentistSpecialty} · Nº colegiado: ${ctx.dentistCollegiateNumber}`
  ].join('\n');
}

type TemplateExtras = {
  antecedentes?: string;
  fuentes?: string[];
  anamnesis?: string;
  piezas?: string[];
  actuaciones?: string[];
  noEjecutados?: string[];
  diagnosticoPrincipal?: string;
  seguimiento?: string;
};

function antecedentesBlock(ctx: AppointmentReportContext, custom?: string) {
  const lines = [
    custom ??
      `Paciente ${ctx.patientName}. ${ctx.patientDni ? `DNI: ${ctx.patientDni}. ` : ''}Sin antecedentes médicos de interés salvo los referidos en historia clínica.`,
    ctx.patientAllergies
      ? `Alergias / intolerancias declaradas: ${ctx.patientAllergies}.`
      : 'Alergias: no refiere / revisar historia.',
    'Medicación habitual: [completar si aplica].',
    'Hábitos (tabaco, bruxismo, higiene): [completar].'
  ];
  return lines.join('\n');
}

function formalDescription(ctx: AppointmentReportContext, extras: TemplateExtras = {}) {
  const piezas = extras.piezas ?? ['[Pieza / zona 1]', '[Pieza / zona 2]', '[Pieza / zona 3]'];
  const actuaciones = extras.actuaciones ?? ['[Actuación 1]', '[Actuación 2]', '[Actuación 3]'];
  const fuentes =
    extras.fuentes ??
    [
      'Historia clínica y ficha del paciente',
      'Exploración clínica intraoral y extraoral',
      'Registros radiográficos (si procede)',
      'Fotografías clínicas (si procede)'
    ];
  const noEjecutados =
    extras.noEjecutados ??
    [
      '[Tratamiento presupuestado 1 — no ejecutado en esta visita]',
      '[Tratamiento presupuestado 2 — pendiente de decisión del paciente]'
    ];

  return `${buildReportLetterhead(ctx)}

ANTECEDENTES
${antecedentesBlock(ctx, extras.antecedentes)}

INFORME CLÍNICO SOBRE TRATAMIENTO
Tratamiento / motivo de la consulta: ${ctx.treatmentName}.
Consulta realizada el ${ctx.dateLabel} en ${ctx.clinicName}.
${ctx.dentistHonorific} ${ctx.dentistName} (colegiado n.º ${ctx.dentistCollegiateNumber}) atiende al paciente en el marco de la cita ${ctx.appointmentId.slice(0, 8)}.

FUENTES DEL INFORME
${fuentes.map((f) => `- ${f}`).join('\n')}

ANÁMNESIS Y EXPLORACIÓN
${extras.anamnesis ?? `Motivo de consulta: ${ctx.treatmentName}.
El paciente acude para valoración y actuación acorde al plan de tratamiento.
Exploración: estado bucodental revisado; se documentan hallazgos y sintomatología referida.`}

Piezas o zonas tratadas / revisadas:
${piezas.map((p) => `- ${p}`).join('\n')}

Actuación realizada en esta visita:
${actuaciones.map((a) => `- ${a}`).join('\n')}

Observaciones clínicas:
- [Observación 1]
- [Observación 2]

TRATAMIENTOS PRESUPUESTADOS Y NO EJECUTADOS:
${noEjecutados.map((t) => `- ${t}`).join('\n')}`;
}

function diagnosisBlock(ctx: AppointmentReportContext, principal?: string) {
  return `Diagnóstico principal:
${principal ?? '[Escribir diagnóstico principal]'}

Diagnósticos secundarios / hallazgos:
- [Hallazgo 1]
- [Hallazgo 2]
- [Hallazgo 3]

Estado general:
[Estable / En seguimiento / Requiere tratamiento / Requiere revisión]

Profesional responsable: ${ctx.dentistHonorific} ${ctx.dentistName} · Colegiado n.º ${ctx.dentistCollegiateNumber}`;
}

function recommendationsBlock(ctx: AppointmentReportContext, followUp?: string) {
  return `Recomendaciones al paciente:
- [Recomendación 1]
- [Recomendación 2]
- [Recomendación 3]

Tratamiento recomendado:
[Tratamiento recomendado acorde a ${ctx.treatmentName}]

Seguimiento:
${followUp ?? '[Indicar si requiere revisión, control o nueva cita]'}

Próxima revisión sugerida:
[Fecha orientativa o plazo]

Indicaciones adicionales:
- [Indicación adicional 1]
- [Indicación adicional 2]

---
${REPORT_COLEGIO_FOOTER}`;
}

const TEMPLATE_BUILDERS: Record<
  ReportTemplateId,
  (ctx: AppointmentReportContext) => { description: string; diagnosis: string; recommendations: string }
> = {
  revision_general: (ctx) => ({
    description: formalDescription(ctx),
    diagnosis: diagnosisBlock(ctx),
    recommendations: recommendationsBlock(ctx)
  }),
  limpieza_dental: (ctx) => ({
    description: formalDescription(ctx, {
      anamnesis:
        'Motivo: higiene y mantenimiento periodontal. Exploración de encías, placa y cálculo. Índices de higiene valorados.',
      actuaciones: [
        'Higiene dental profesional',
        'Eliminación de sarro supragingival',
        'Instrucciones de higiene oral personalizada'
      ],
      piezas: ['Arcadas completas', 'Zonas con acumulación de biofilm']
    }),
    diagnosis: diagnosisBlock(ctx, 'Salud periodontal compatible con profilaxis / mantenimiento.'),
    recommendations: recommendationsBlock(ctx, 'Control higiénico en 6 meses o según riesgo.')
  }),
  endodoncia: (ctx) => ({
    description: formalDescription(ctx, {
      anamnesis:
        'Motivo: sintomatología pulpar / lesión periapical. Exploración clínica y radiográfica de la pieza afectada.',
      actuaciones: [
        'Apertura cameral y acceso',
        'Instrumentación y desinfección del conducto',
        'Obturación provisional o definitiva según fase'
      ],
      piezas: ['[Pieza endodonciada]']
    }),
    diagnosis: diagnosisBlock(ctx, 'Pulpitis / necrosis pulpar — completar según hallazgos.'),
    recommendations: recommendationsBlock(ctx, 'Revisión endodóntica y restauración definitiva.')
  }),
  periodoncia: (ctx) => ({
    description: formalDescription(ctx, {
      anamnesis: 'Valoración periodontal: sondaje, sangrado, movilidad y radiografía.',
      actuaciones: ['Raspado y alisado radicular', 'Instrucciones de higiene interproximal'],
      piezas: ['Cuadrantes afectados']
    }),
    diagnosis: diagnosisBlock(ctx, 'Enfermedad periodontal — estadio y grado a completar.'),
    recommendations: recommendationsBlock(ctx, 'Mantenimiento periodontal periódico.')
  }),
  odontopediatria: (ctx) => ({
    description: formalDescription(ctx, {
      anamnesis: 'Exploración adaptada a edad. Valoración de erupción, caries y hábitos.',
      actuaciones: ['Exploración clínica', 'Aplicación de flúor si indicado', 'Educación a paciente/tutor'],
      piezas: ['Dentición temporal / mixta / permanente joven']
    }),
    diagnosis: diagnosisBlock(ctx, 'Estado bucodental pediátrico — completar.'),
    recommendations: recommendationsBlock(ctx, 'Control semestral o según riesgo de caries.')
  }),
  cirugia_oral: (ctx) => ({
    description: formalDescription(ctx, {
      anamnesis: 'Valoración prequirúrgica. Consentimiento informado.',
      actuaciones: ['Intervención según plan quirúrgico', 'Control hemostasia', 'Indicaciones postoperatorias'],
      noEjecutados: ['Tratamientos diferidos por indicación médica o decisión del paciente']
    }),
    diagnosis: diagnosisBlock(ctx, 'Indicación quirúrgica documentada.'),
    recommendations: recommendationsBlock(ctx, 'Control postoperatorio en 7-10 días.')
  }),
  protesis: (ctx) => ({
    description: formalDescription(ctx, {
      anamnesis: 'Valoración oclusal y de pilares. Pruebas de estructura si procede.',
      actuaciones: ['Toma de impresiones / prueba', 'Ajuste oclusal', 'Entrega o fase intermedia']
    }),
    diagnosis: diagnosisBlock(ctx, 'Rehabilitación protésica en curso o completada.'),
    recommendations: recommendationsBlock(ctx, 'Revisión protésica según protocolo.')
  }),
  ortodoncia: (ctx) => ({
    description: formalDescription(ctx, {
      anamnesis: 'Control de ortodoncia. Revisión de aparatología y oclusión.',
      actuaciones: ['Ajuste de brackets / alineadores', 'Registro fotográfico de evolución']
    }),
    diagnosis: diagnosisBlock(ctx, 'Tratamiento de ortodoncia en seguimiento activo.'),
    recommendations: recommendationsBlock(ctx, 'Próximo control según plan.')
  }),
  implantes: (ctx) => ({
    description: formalDescription(ctx, {
      anamnesis: 'Valoración de tejidos blandos y duros. Control radiográfico.',
      actuaciones: ['Colocación o revisión de implante', 'Control de osteointegración']
    }),
    diagnosis: diagnosisBlock(ctx, 'Implante en fase de osteointegración / carga protésica.'),
    recommendations: recommendationsBlock(ctx, 'Control según protocolo de implantes.')
  }),
  blanqueamiento: (ctx) => ({
    description: formalDescription(ctx, {
      anamnesis: 'Evaluación de coloración dental y contraindicaciones.',
      actuaciones: ['Sesión de blanqueamiento', 'Registro de color inicial/final']
    }),
    diagnosis: diagnosisBlock(ctx, 'Discromía dental tratada con blanqueamiento.'),
    recommendations: recommendationsBlock(ctx, 'Evitar pigmentos 48-72 h. Mantenimiento según indicación.')
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

export function applyReportTemplateForAppointment(
  state: DemoState,
  appointmentId: string,
  templateId?: ReportTemplateId
): { title: string; description: string; diagnosis: string; recommendations: string } | null {
  const ctx = getAppointmentReportContext(state, appointmentId);
  if (!ctx) return null;
  const id = templateId ?? inferReportTemplateFromTreatment(ctx.treatmentName);
  return applyReportTemplate(id, ctx);
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
  const clinic = appt
    ? state.clinics.find((c) => c.id === appt.clinicId)
    : patient?.preferredClinicId
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

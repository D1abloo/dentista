export type ClinicalReportFormState = {
  patientId: string;
  appointmentId: string;
  dentistName: string;
  title: string;
  description: string;
  diagnosis: string;
  recommendations: string;
  visibleToPatient: boolean;
  uploadedBy: string;
};

export function validateClinicalReportForm(form: ClinicalReportFormState): string | null {
  if (!form.patientId?.trim()) return 'Selecciona un paciente.';
  if (!form.appointmentId?.trim()) return 'Selecciona una cita válida.';
  if (!form.title?.trim()) return 'Completa el título del informe.';
  if (!form.description?.trim()) return 'Completa la descripción.';
  if (!form.diagnosis?.trim()) return 'Completa el diagnóstico.';
  if (!form.recommendations?.trim()) return 'Completa las recomendaciones.';
  return null;
}

export const EMPTY_REPORT_FORM: ClinicalReportFormState = {
  patientId: '',
  appointmentId: '',
  dentistName: '',
  title: '',
  description: '',
  diagnosis: '',
  recommendations: '',
  visibleToPatient: true,
  uploadedBy: 'Admin clínica'
};

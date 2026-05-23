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

export function parseReportApiError(json: {
  error?: { message?: string; details?: { fieldErrors?: Record<string, string[]>; formErrors?: string[] } };
}): string {
  const details = json.error?.details;
  if (details && typeof details === 'object') {
    const fieldErrors = details.fieldErrors;
    if (fieldErrors) {
      const first = Object.values(fieldErrors).flat().find(Boolean);
      if (first) return first;
    }
    const formErrors = details.formErrors;
    if (formErrors?.[0]) return formErrors[0];
  }
  return json.error?.message ?? 'No se pudo guardar el informe.';
}

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

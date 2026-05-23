import {
  assembleClinicalDescription,
  assembleDiagnosis,
  assembleRecommendations,
  EMPTY_REPORT_SECTIONS,
  sectionsAreComplete,
  type ClinicalReportSections
} from '@/lib/clinical/reportSections';
import { collegiateRequiredMessage, isCollegiateNumberValid } from '@/lib/clinical/dentistCollegiate';
import type { AppointmentReportContext } from '@/lib/clinical/reportTemplates';

export type ClinicalReportFormState = {
  patientId: string;
  appointmentId: string;
  dentistName: string;
  title: string;
  sections: ClinicalReportSections;
  visibleToPatient: boolean;
  uploadedBy: string;
};

export function formToPersistedFields(
  form: ClinicalReportFormState,
  professionalLine?: string
): { description: string; diagnosis: string; recommendations: string } {
  return {
    description: assembleClinicalDescription(form.sections),
    diagnosis: assembleDiagnosis(form.sections, professionalLine),
    recommendations: assembleRecommendations(form.sections)
  };
}

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

export function validateClinicalReportForm(
  form: ClinicalReportFormState,
  apptContext?: AppointmentReportContext | null
): string | null {
  if (!form.patientId?.trim()) return 'Selecciona un paciente.';
  if (!form.appointmentId?.trim()) return 'Selecciona una cita válida.';
  if (!form.title?.trim()) return 'Completa el título del informe.';
  if (apptContext && !isCollegiateNumberValid(apptContext.dentistCollegiateNumber)) {
    return collegiateRequiredMessage(`${apptContext.dentistHonorific} ${apptContext.dentistName}`);
  }
  return sectionsAreComplete(form.sections);
}

export const EMPTY_REPORT_FORM: ClinicalReportFormState = {
  patientId: '',
  appointmentId: '',
  dentistName: '',
  title: '',
  sections: { ...EMPTY_REPORT_SECTIONS },
  visibleToPatient: true,
  uploadedBy: 'Admin clínica'
};

export type { ClinicalReportSections };

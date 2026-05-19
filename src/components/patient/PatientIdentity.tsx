import type { Patient } from '@/types/demo';

type Props = {
  patient: Pick<Patient, 'fullName' | 'dni'>;
  size?: 'sm' | 'md';
  className?: string;
};

/** Identidad visible en el portal paciente (sin códigos PAT-XXXX). */
export function PatientIdentity({ patient, size = 'md', className = '' }: Props) {
  return (
    <div className={`patient-identity patient-identity--${size} ${className}`.trim()}>
      <p className="patient-identity__name">{patient.fullName}</p>
      {patient.dni ? <p className="patient-identity__dni">DNI {patient.dni}</p> : null}
    </div>
  );
}

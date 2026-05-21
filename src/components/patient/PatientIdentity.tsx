import type { Patient } from '@/types/demo';

type Props = {
  patient: Pick<Patient, 'fullName' | 'dni' | 'nhc'>;
  size?: 'sm' | 'md';
  className?: string;
};

/** Identidad visible en el portal paciente (NHC, sin UUID interno). */
export function PatientIdentity({ patient, size = 'md', className = '' }: Props) {
  return (
    <div className={`patient-identity patient-identity--${size} ${className}`.trim()}>
      <p className="patient-identity__name">{patient.fullName}</p>
      {patient.nhc ? <p className="patient-identity__nhc">NHC {patient.nhc}</p> : null}
      {patient.dni ? <p className="patient-identity__dni">DNI {patient.dni}</p> : null}
    </div>
  );
}

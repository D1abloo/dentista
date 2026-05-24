import { HelpEmbedded } from '@/components/help/HelpEmbedded';
import { PatientConsentsCompact } from './consents';
export { PatientConsents } from './PatientConsents';
export {
  PatientAppointments,
  PatientCompletedAppointments,
  PatientPastAppointments
} from './PatientAppointments';
export { PatientHistory } from './PatientHistory';
export { PatientReports } from './PatientReports';
export { PatientDocuments } from './PatientDocuments';
export { PatientInvoices } from './PatientInvoices';
export { PatientPayments } from './PatientPayments';
export { PatientMessages } from './PatientMessages';
export { PatientProfile } from './PatientProfile';
export { PatientBook } from './PatientBook';
export { PatientDashboard } from './PatientHome';

export function PatientHelp() {
  return <HelpEmbedded audience="patient" />;
}

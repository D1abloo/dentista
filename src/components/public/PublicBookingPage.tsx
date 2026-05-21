import { useEffect } from 'react';
import { CalendarPlus, LogIn, ShieldCheck } from 'lucide-react';
import { NoticeProvider, useNotice } from '@/hooks/useNotice';
import { Toast } from '@/components/ui';
import { GuideDemoStoreProvider } from '@/components/guide/GuideDemoStore';
import { PatientBook } from '@/components/patient/views';
import { STORAGE_PATIENT_ID } from '@/lib/storage/keys';
import { DEMO_PATIENT_LOGIN_ID } from '@/data/demoData';
import { PublicFooter } from './PublicFooter';
import { PublicHeader } from './PublicHeader';

function SeedGuestPatient() {
  useEffect(() => {
    localStorage.setItem(STORAGE_PATIENT_ID, DEMO_PATIENT_LOGIN_ID);
  }, []);
  return null;
}

function BookingFlow() {
  const { notice, clear } = useNotice();
  return (
    <>
      <Toast notice={notice} onClose={clear} />
      <SeedGuestPatient />
      <PatientBook />
    </>
  );
}

export function PublicBookingPage() {
  return (
    <>
      <PublicHeader activeHref="/reserva" />
      <main className="public-booking">
        <section className="public-booking__hero shell">
          <span className="public-booking__badge">
            <CalendarPlus className="h-4 w-4" aria-hidden />
            Reserva online
          </span>
          <h1>Reserva tu cita dental</h1>
          <p>
            Elige clínica, tratamiento, profesional y horario en un flujo guiado. Si ya tienes cuenta, inicia sesión al
            final para confirmar la cita en tu portal.
          </p>
          <ul className="public-booking__trust">
            <li>
              <ShieldCheck className="h-4 w-4" aria-hidden />
              Sin registro para explorar horarios
            </li>
            <li>
              <LogIn className="h-4 w-4" aria-hidden />
              Confirmación con tu cuenta de paciente
            </li>
          </ul>
        </section>
        <section className="shell public-booking__flow">
          <GuideDemoStoreProvider>
            <NoticeProvider>
              <BookingFlow />
            </NoticeProvider>
          </GuideDemoStoreProvider>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}

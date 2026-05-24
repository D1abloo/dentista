import { useEffect, useState } from 'react';
import { CalendarPlus, LogIn, UserPlus } from 'lucide-react';
import { PasswordChangeGate } from '@/components/auth/PasswordChangeGate';
import { PatientPortalGate } from '@/components/auth/PatientPortalGate';
import { DemoStoreProvider } from '@/hooks/useDemoStore';
import { NoticeProvider, useNotice } from '@/hooks/useNotice';
import { Toast } from '@/components/ui';
import { PatientBook } from '@/components/patient/views';
import { PublicFooter } from './PublicFooter';
import { PublicHeader } from './PublicHeader';

function BookingRegisterGate() {
  return (
    <article className="booking-gate">
      <div className="booking-gate__icon" aria-hidden>
        <UserPlus className="h-8 w-8" />
      </div>
      <h2>Cuenta de paciente obligatoria</h2>
      <p>
        Para reservar cita online debes <strong>registrarte</strong> y <strong>activar tu cuenta</strong> desde el
        correo que te enviaremos. Después podrás iniciar sesión y elegir día y hora.
      </p>
      <div className="booking-gate__actions">
        <a href="/registro-paciente" className="btn btn--primary btn--lg no-underline">
          <UserPlus className="h-5 w-5" aria-hidden />
          Crear cuenta
        </a>
        <a href="/login?next=/reserva" className="btn btn--outline btn--lg no-underline">
          <LogIn className="h-5 w-5" aria-hidden />
          Ya tengo cuenta
        </a>
      </div>
    </article>
  );
}

function BookingInner() {
  const { notice, clear } = useNotice();
  return (
    <>
      <Toast notice={notice} onClose={clear} />
      <PatientBook />
    </>
  );
}

function AuthenticatedBooking() {
  return (
    <PatientPortalGate>
      <PasswordChangeGate>
        <DemoStoreProvider>
          <NoticeProvider>
            <BookingInner />
          </NoticeProvider>
        </DemoStoreProvider>
      </PasswordChangeGate>
    </PatientPortalGate>
  );
}

export function PublicBookingPage() {
  const [auth, setAuth] = useState<'loading' | 'guest' | 'patient'>('loading');

  useEffect(() => {
    const check = async () => {
      try {
        const pdpRes = await fetch('/api/portal-access/me', { credentials: 'include' });
        const pdpJson = (await pdpRes.json()) as { data?: { active?: boolean } };
        if (pdpRes.ok && pdpJson.data?.active) {
          setAuth('patient');
          return;
        }
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        const json = (await res.json()) as {
          data?: { role?: string; platformInspect?: boolean; inspectMode?: string };
        };
        const role = json.data?.role;
        const inspectPdP =
          json.data?.platformInspect && json.data.inspectMode === 'patient_portal';
        if (
          res.ok &&
          (role === 'patient' || role === 'admin' || role === 'super_admin' || inspectPdP)
        ) {
          setAuth('patient');
          return;
        }
        setAuth('guest');
      } catch {
        setAuth('guest');
      }
    };
    void check();
  }, []);

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
            {auth === 'patient'
              ? 'Elige clínica, tratamiento, profesional y horario. Tu cita quedará registrada en el portal del paciente.'
              : 'Regístrate como paciente, activa tu cuenta por correo e inicia sesión para reservar.'}
          </p>
        </section>
        <section className="shell public-booking__flow">
          {auth === 'loading' ? (
            <p className="text-center text-sm font-bold text-slate-600">Comprobando sesión…</p>
          ) : auth === 'guest' ? (
            <BookingRegisterGate />
          ) : (
            <AuthenticatedBooking />
          )}
        </section>
      </main>
      <PublicFooter />
    </>
  );
}

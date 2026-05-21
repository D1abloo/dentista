import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui';

export function ActivationPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-premium ring-1 ring-slate-100">
        <Logo />
        <h1 className="mt-6 font-display text-2xl text-dental-950">Activación de cuenta</h1>
        <p className="mt-3 text-sm text-slate-600">
          Si recibiste un enlace de activación, ábrelo desde el correo. Si ya tienes credenciales, inicia sesión.
        </p>
        <a href="/login" className="mt-6 inline-block">
          <Button>Ir al login</Button>
        </a>
      </div>
    </main>
  );
}

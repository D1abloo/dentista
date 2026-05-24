import { useState } from 'react';
import { LogIn, Loader2 } from 'lucide-react';
import { resolvePublicEnter } from '@/lib/clinicCenters';

type Props = {
  className?: string;
  onNavigate?: () => void;
};

/** Botón único «Entrar»: redirige según sesión (login, paciente, plataforma o centro clínico). */
export function PublicEnterButton({ className = '', onNavigate }: Props) {
  const [loading, setLoading] = useState(false);

  async function onClick() {
    if (loading) return;
    setLoading(true);
    onNavigate?.();
    try {
      await resolvePublicEnter();
    } catch {
      window.location.href = '/login';
    }
  }

  return (
    <button
      type="button"
      className={`ps-btn ps-btn--primary ps-btn--sm ps-enter-btn${className ? ` ${className}` : ''}`}
      onClick={() => void onClick()}
      disabled={loading}
      aria-busy={loading}
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <LogIn className="h-3.5 w-3.5" aria-hidden />}
      Entrar
    </button>
  );
}

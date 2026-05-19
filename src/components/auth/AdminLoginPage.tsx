import { useState } from 'react';
import { Building2, ChevronRight } from 'lucide-react';
import { isClientDemoMode } from '@/lib/appMode';
import { signInAs } from '@/lib/demoAuth';
import { DEMO_TENANTS } from '@/lib/tenantIds';
import { LiveLoginForm } from './LiveLoginForm';
import { PortalLoginShell } from './PortalLoginShell';

export function AdminLoginPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const demo = isClientDemoMode();

  async function enterDemo(tenantId: string) {
    setLoading(tenantId);
    const path = await signInAs('admin', { tenantId, ephemeral: false });
    window.location.href = path;
  }

  return (
    <PortalLoginShell
      variant="admin"
      eyebrow="Panel clínica · Dentista+"
      title="Acceso administración"
      lead={
        demo
          ? 'Elige la sede que gestionarás. Cada clínica ve solo sus datos.'
          : 'Inicia sesión para gestionar citas, pacientes y facturación.'
      }
      footer={
        <>
          <a href="/login/paciente">Portal paciente</a>
          <span aria-hidden>·</span>
          <a href="/">Inicio</a>
        </>
      }
    >
      {demo ? (
        <ul className="login-portal__options">
          {DEMO_TENANTS.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                className="login-portal__option login-portal__option--admin"
                disabled={!!loading}
                onClick={() => enterDemo(t.id)}
              >
                <span className="login-portal__option-icon" aria-hidden>
                  <Building2 className="h-5 w-5" />
                </span>
                <span className="login-portal__option-text">
                  <span className="login-portal__option-title">{t.label}</span>
                  <span className="login-portal__option-meta">{t.id}</span>
                </span>
                <span className="login-portal__option-cta">
                  {loading === t.id ? 'Entrando…' : 'Entrar'}
                  <ChevronRight className="h-4 w-4" />
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <LiveLoginForm apiRole="admin" variant="admin" />
      )}
    </PortalLoginShell>
  );
}

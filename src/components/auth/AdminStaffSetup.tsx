import { useState } from 'react';
import { LogOut, UserRound } from 'lucide-react';
import { useLogout } from '@/components/auth/RoleGate';
import { getStoredTenantId } from '@/lib/demoStore';
import { organizationDisplayName, saveStaffProfile } from '@/lib/organization';
import { useDemoStore } from '@/hooks/useDemoStore';
import { Button, Field, Input } from '@/components/ui';

/** Pide nombre del usuario admin la primera vez en cada centro clínico. */
export function AdminStaffSetup({ onDone }: { onDone: () => void }) {
  const { state } = useDemoStore();
  const tenantId = getStoredTenantId();
  const orgName = organizationDisplayName(state, tenantId);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const logout = useLogout();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError('Escribe tu nombre (mínimo 2 caracteres).');
      return;
    }
    saveStaffProfile(tenantId, { fullName: trimmed, role: 'admin' });
    onDone();
  }

  return (
    <div className="staff-setup">
      <div className="staff-setup__card">
        <div className="staff-setup__icon" aria-hidden>
          <UserRound className="h-8 w-8" />
        </div>
        <h2 className="staff-setup__title">Bienvenido a {orgName}</h2>
        <p className="staff-setup__lead">Indica tu nombre para personalizar el panel. Se recordará en este centro clínico.</p>
        <form onSubmit={submit} className="staff-setup__form">
          <Field label="Tu nombre" error={error}>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder="Ej. Laura Sánchez"
              autoFocus
            />
          </Field>
          <Button type="submit" className="w-full">
            Entrar al panel
          </Button>
        </form>
        <button type="button" className="admin-logout-btn staff-setup__logout" onClick={logout}>
          <LogOut className="h-4 w-4" /> Cerrar sesión
        </button>
      </div>
    </div>
  );
}

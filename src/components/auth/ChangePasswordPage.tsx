import { useEffect, useState } from 'react';
import { KeyRound, Lock } from 'lucide-react';
import { Button, Card, Field, Input } from '@/components/ui';

export function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState<'first' | 'expired' | 'change'>('first');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('expired') === '1') setReason('expired');
    else if (params.get('optional') === '1') setReason('change');
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message ?? 'No se pudo actualizar');
      const me = await fetch('/api/auth/me', { credentials: 'include' });
      const meJson = (await me.json()) as { data?: { role?: string } };
      const role = meJson.data?.role;
      window.location.href = role === 'patient' ? '/paciente' : '/admin';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar contraseña.');
    } finally {
      setLoading(false);
    }
  }

  const title =
    reason === 'expired'
      ? 'Tu contraseña ha caducado'
      : reason === 'change'
        ? 'Cambiar contraseña'
        : 'Configura tu contraseña';

  const lead =
    reason === 'expired'
      ? 'Las contraseñas de personal y pacientes caducan cada 3 meses. Los administradores de clínica no caducan.'
      : reason === 'change'
        ? 'Elige una contraseña nueva y segura.'
        : 'Es tu primer acceso. Debes elegir una contraseña personal antes de continuar.';

  return (
    <main className="grid min-h-screen place-items-center bg-gradient-to-br from-slate-100 to-slate-200 p-4">
      <Card className="w-full max-w-md p-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--blue)]/10 text-[var(--blue)]">
            <KeyRound className="h-6 w-6" />
          </span>
          <div>
            <h1 className="font-[family-name:var(--display)] text-xl font-semibold text-[var(--navy)]">{title}</h1>
            <p className="mt-1 text-sm text-slate-600">{lead}</p>
          </div>
        </div>
        <form onSubmit={submit} className="grid gap-4">
          <Field label="Contraseña actual">
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </Field>
          <Field label="Nueva contraseña (mín. 8 caracteres)">
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </Field>
          <Field label="Confirmar nueva contraseña">
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </Field>
          {error ? (
            <p className="text-sm font-semibold text-rose-600" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={loading}>
            <Lock className="h-4 w-4" />
            {loading ? 'Guardando…' : 'Guardar y continuar'}
          </Button>
        </form>
      </Card>
    </main>
  );
}

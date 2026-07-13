import { useEffect, useState } from 'react'
import { isPortalTokenLoginEnabled } from '@/lib/featureFlags'
import { Button, Card, Field, Input } from '@/components/ui'

export function PortalAccessEntry({ initialToken }: { initialToken?: string }) {
  const tokenLoginEnabled = isPortalTokenLoginEnabled()
  const [token, setToken] = useState(initialToken ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!tokenLoginEnabled) return
    if (initialToken) void activate(initialToken)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al montar con token en URL
  }, [initialToken, tokenLoginEnabled])

  async function activate(raw: string) {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/portal-access/exchange', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token: raw.trim() })
      })
      const json = (await res.json()) as {
        data?: { redirectTo?: string; patientId?: string }
        error?: { message?: string }
      }
      if (!res.ok) throw new Error(json.error?.message ?? 'Token no válido')
      window.location.href = json.data?.redirectTo ?? '/paciente'
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo validar el token.')
    } finally {
      setBusy(false)
    }
  }

  if (!tokenLoginEnabled) {
    return (
      <Card title="Acceso al portal del paciente">
        <p className="mb-4 text-sm text-slate-600">
          El acceso con token está desactivado temporalmente. Inicia sesión con tu email y contraseña.
        </p>
        <Button onClick={() => { window.location.href = '/login/paciente' }}>
          Ir al login de paciente
        </Button>
      </Card>
    )
  }

  return (
    <Card title="Acceso autorizado al portal del paciente">
      <p className="mb-4 text-sm text-slate-600">
        Introduce el token que te ha facilitado administración para consultar informes con registro de actividad.
      </p>
      <Field label="Token">
        <Input value={token} onChange={(e) => setToken(e.target.value)} disabled={busy} />
      </Field>
      {error ? (
        <p className="mt-3 text-sm font-semibold text-rose-600" role="alert">
          {error}
        </p>
      ) : null}
      <Button className="mt-3" disabled={busy} onClick={() => void activate(token)}>
        {busy ? 'Validando…' : 'Entrar'}
      </Button>
    </Card>
  )
}

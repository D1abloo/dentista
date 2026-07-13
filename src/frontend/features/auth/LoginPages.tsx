import { useEffect, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { useLoginWithPortalChoice } from '@/components/auth/useLoginWithPortalChoice'
import { BRAND_ACCESS_PLATFORM, BRAND_NAME } from '@/lib/brand/identity'
import { Alert, Button, Input } from '@/frontend/ds'
import { AuthCard, PortalChoiceList } from './AuthUi'

type Props = {
  forcedRole?: 'admin' | 'patient'
  title?: string
  description?: string
}

export const LoginForm = ({
  forcedRole,
  title = 'Iniciar sesión',
  description = 'Introduce tu email y contraseña. Si tienes varios portales, podrás elegir después.'
}: Props) => {
  const {
    email,
    setEmail,
    password,
    setPassword,
    error,
    loading,
    portalLoading,
    portalChoice,
    submitForm,
    pickPortal,
    resetChoice
  } = useLoginWithPortalChoice(forcedRole)

  if (portalChoice) {
    return (
      <AuthCard title="Selecciona tu portal">
        <PortalChoiceList
          email={portalChoice.email}
          options={portalChoice.options}
          loading={portalLoading}
          onSelect={pickPortal}
        />
        {error ? <Alert tone="danger" className="mt-4">{error}</Alert> : null}
        <Button variant="ghost" className="mt-4 w-full" onClick={resetChoice}>
          ← Cambiar credenciales
        </Button>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title={title}
      description={description}
      footer={
        <div className="flex flex-col gap-2 text-slate-600">
          <a href="/" className="text-brand-700 hover:underline">
            ← Volver al inicio
          </a>
          {!forcedRole ? (
            <a href="/registro-paciente" className="text-brand-700 hover:underline">
              Registrarse como paciente
            </a>
          ) : null}
        </div>
      }
    >
      <form onSubmit={submitForm} className="space-y-4" noValidate>
        <Input
          id="login-email"
          name="email"
          type="email"
          label="Email"
          autoComplete="username"
          required
          requiredMark
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
        />
        <Input
          id="login-password"
          name="password"
          type="password"
          label="Contraseña"
          autoComplete="current-password"
          required
          requiredMark
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <Button type="submit" className="w-full" loading={loading}>
          Iniciar sesión
        </Button>
      </form>
    </AuthCard>
  )
}

export const UnifiedLoginPage = () => <LoginForm />

export const AdminLoginPage = () => (
  <LoginForm
    forcedRole="admin"
    title="Panel de clínica"
    description="Acceso para administración, recepción y personal clínico."
  />
)

export const PlatformLoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem('df_platform_remember') === '1') {
        setRemember(true)
        const saved = localStorage.getItem('df_platform_remember_email')
        if (saved) setEmail(saved)
      }
    } catch {
      /* ignore */
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const normalized = email.trim().toLowerCase()
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ role: 'super_admin', email: normalized, password, remember })
      })
      const json = (await res.json()) as { error?: { message?: string } }
      if (!res.ok) {
        setError(json.error?.message ?? 'Credenciales incorrectas.')
        return
      }
      try {
        if (remember) {
          localStorage.setItem('df_platform_remember', '1')
          localStorage.setItem('df_platform_remember_email', normalized)
        } else {
          localStorage.removeItem('df_platform_remember')
          localStorage.removeItem('df_platform_remember_email')
        }
      } catch {
        /* ignore */
      }
      window.location.href = '/platform'
    } catch {
      setError('No se pudo iniciar sesión. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard
      title={BRAND_ACCESS_PLATFORM}
      description={`${BRAND_NAME} · Super administración SaaS`}
      footer={
        <a href="/" className="text-brand-700 hover:underline">
          ← Volver al inicio
        </a>
      }
    >
      <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-800">
        <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
        Super Admin
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="platform-email"
          type="email"
          label="Email"
          autoComplete="username"
          required
          requiredMark
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          id="platform-password"
          type="password"
          label="Contraseña"
          autoComplete="current-password"
          required
          requiredMark
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          Recordar sesión
        </label>
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <Button type="submit" className="w-full" loading={loading}>
          Entrar al panel
        </Button>
      </form>
    </AuthCard>
  )
}
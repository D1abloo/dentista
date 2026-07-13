import { useState } from 'react'
import {
  ArrowRight,
  Bot,
  CalendarCheck,
  ClipboardList,
  Shield,
  Sparkles,
  Stethoscope,
  Users
} from 'lucide-react'
import { PublicShell } from '@/frontend/layouts/PublicShell'
import { Badge, Button, Card, Container } from '@/frontend/ds'
import { resolveHomeSectionHref } from '@/lib/public/routes'

const modules = [
  { icon: CalendarCheck, title: 'Agenda inteligente', text: 'Vista día, semana y mes con bloqueos y huecos reales.' },
  { icon: Users, title: 'Pacientes', text: 'Historial, documentos, consentimientos y portal unificado.' },
  { icon: ClipboardList, title: 'Facturación', text: 'Cobros, facturas y seguimiento financiero en un solo panel.' },
  { icon: Bot, title: 'Citas con IA', text: 'Reserva, consulta y reprogramación con verificación segura.' }
]

const steps = [
  'El paciente reserva online o con el asistente IA',
  'La clínica confirma y gestiona la agenda en tiempo real',
  'Recordatorios, historial y facturación conectados'
]

export const LandingPage = () => {
  const [demoOpen, setDemoOpen] = useState(false)

  return (
    <PublicShell onOpenDemo={() => setDemoOpen(true)}>
      <main id="main-content">
        <section
          id="inicio"
          className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-brand-50/80 via-white to-white"
        >
          <Container className="grid gap-10 py-16 lg:grid-cols-2 lg:items-center lg:py-24">
            <div className="animate-fade-up">
              <Badge tone="brand" className="mb-4">
                AgendaClinic · SaaS dental
              </Badge>
              <h1 className="font-display text-4xl font-semibold leading-tight text-ink sm:text-5xl">
                La clínica dental que tus pacientes esperan. El panel que tu equipo necesita.
              </h1>
              <p className="mt-5 max-w-xl text-base text-slate-600 sm:text-lg">
                Agenda, pacientes, facturación y portal en una plataforma rápida, accesible y preparada
                para producción con PostgreSQL.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  size="lg"
                  rightIcon={<ArrowRight className="h-4 w-4" aria-hidden />}
                  onClick={() => {
                    document.getElementById('widget-citas')?.scrollIntoView({ behavior: 'smooth' })
                  }}
                >
                  Reservar cita
                </Button>
                <Button variant="outline" size="lg" onClick={() => setDemoOpen(true)}>
                  Solicitar demo
                </Button>
              </div>
              <ul className="mt-8 flex flex-wrap gap-4 text-sm text-slate-600" aria-label="Ventajas">
                <li className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-brand-600" aria-hidden /> RGPD y auditoría
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-brand-600" aria-hidden /> IA en servidor
                </li>
                <li className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-brand-600" aria-hidden /> Multi-clínica
                </li>
              </ul>
            </div>

            <Card elevated padding="lg" className="animate-fade-up border-brand-100 bg-white/90 backdrop-blur">
              <p className="text-sm font-semibold text-brand-700">Panel en vivo</p>
              <h2 className="mt-2 font-display text-2xl font-semibold text-ink">Hoy en tu clínica</h2>
              <dl className="mt-6 grid grid-cols-2 gap-4">
                {[
                  ['Citas hoy', '24'],
                  ['Ocupación', '78%'],
                  ['Pacientes activos', '1.2k'],
                  ['Facturación mes', '€18.4k']
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl bg-slate-50 p-4">
                    <dt className="text-xs text-slate-500">{label}</dt>
                    <dd className="mt-1 text-xl font-semibold text-ink">{value}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 text-xs text-slate-500">Datos de ejemplo · conecta tu clínica para métricas reales</p>
            </Card>
          </Container>
        </section>

        <section id="para-clinicas" className="border-b border-slate-200 py-16 sm:py-20">
          <Container>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-3xl font-semibold text-ink">Todo el flujo clínico, sin fricción</h2>
              <p className="mt-3 text-slate-600">
                Módulos pensados para recepción, clínica y dirección. Una sola sesión, permisos por rol.
              </p>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {modules.map(({ icon: Icon, title, text }) => (
                <Card key={title} className="h-full transition hover:border-brand-200 hover:shadow-soft">
                  <Icon className="h-6 w-6 text-brand-600" aria-hidden />
                  <h3 className="mt-4 font-semibold text-ink">{title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{text}</p>
                </Card>
              ))}
            </div>
          </Container>
        </section>

        <section id="citas-online" className="border-b border-slate-200 bg-slate-50 py-16 sm:py-20">
          <Container className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="font-display text-3xl font-semibold text-ink">Citas online con asistente IA</h2>
              <p className="mt-3 text-slate-600">
                Reserva pública, consulta de citas propias, reprogramación y cancelación con verificación de
                identidad. Sin inventar huecos: solo disponibilidad real de tu agenda.
              </p>
              <Button className="mt-6" onClick={() => (window.location.href = '/citas-con-ia')}>
                Probar asistente
              </Button>
            </div>
            <Card id="widget-citas" padding="lg" elevated>
              <ol className="space-y-4">
                {steps.map((step, i) => (
                  <li key={step} className="flex gap-3 text-sm text-slate-700">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-800">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </Card>
          </Container>
        </section>

        <section id="como-funciona" className="border-b border-slate-200 py-16 sm:py-20">
          <Container>
            <h2 className="text-center font-display text-3xl font-semibold text-ink">Cómo funciona</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {[
                { t: 'Configura tu clínica', d: 'Profesionales, tratamientos, horarios y permisos por rol.' },
                { t: 'Activa reservas', d: 'Widget público, IA y portal paciente con la misma base de datos.' },
                { t: 'Opera y crece', d: 'Métricas, facturación, auditoría y soporte multi-sede.' }
              ].map((item) => (
                <Card key={item.t}>
                  <h3 className="font-semibold text-ink">{item.t}</h3>
                  <p className="mt-2 text-sm text-slate-600">{item.d}</p>
                </Card>
              ))}
            </div>
          </Container>
        </section>

        <section id="planes" className="bg-ink py-16 text-white sm:py-20">
          <Container className="text-center">
            <h2 className="font-display text-3xl font-semibold">Planes para clínicas y grupos</h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-300">
              Desde un solo gabinete hasta organizaciones multi-sede. Escala sin cambiar de herramienta.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Button size="lg" onClick={() => setDemoOpen(true)}>
                Hablar con ventas
              </Button>
              <a
                href={resolveHomeSectionHref('consulta-cita')}
                className="inline-flex h-12 items-center rounded-xl border border-white/30 px-5 text-sm font-semibold hover:bg-white/10"
              >
                Consultar mi cita
              </a>
            </div>
          </Container>
        </section>

        <section id="consulta-cita" className="py-12">
          <Container>
            <Card className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="font-display text-xl font-semibold text-ink">¿Ya tienes cita?</h2>
                <p className="mt-1 text-sm text-slate-600">Consulta, cambia o cancela con verificación segura.</p>
              </div>
              <Button variant="secondary" onClick={() => (window.location.href = '/citas-con-ia')}>
                Ir al asistente
              </Button>
            </Card>
          </Container>
        </section>
      </main>

      {demoOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="demo-title"
        >
          <Card className="w-full max-w-md">
            <h2 id="demo-title" className="font-display text-xl font-semibold">
              Solicitar demo
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Escríbenos en <a className="font-medium text-brand-700 underline" href="/contacto">contacto</a> o
              accede al panel con tu cuenta de prueba.
            </p>
            <div className="mt-6 flex gap-2">
              <Button className="flex-1" onClick={() => (window.location.href = '/contacto')}>
                Contacto
              </Button>
              <Button variant="ghost" onClick={() => setDemoOpen(false)}>
                Cerrar
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </PublicShell>
  )
}

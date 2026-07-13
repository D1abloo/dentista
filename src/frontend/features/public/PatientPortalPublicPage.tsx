import { CalendarCheck, Shield, UserRound } from 'lucide-react'
import { PublicShell } from '@/frontend/layouts/PublicShell'
import { Button, Card, Container, PageHeader } from '@/frontend/ds'

const features = [
  { icon: CalendarCheck, title: 'Reserva y consulta', text: 'Gestiona citas con verificación segura.' },
  { icon: UserRound, title: 'Tu historial', text: 'Informes, documentos y facturas en un solo lugar.' },
  { icon: Shield, title: 'Privacidad', text: 'Datos protegidos con RGPD y auditoría.' }
]

export const PatientPortalPublicPage = () => (
  <PublicShell>
    <main id="main-content" className="py-10 sm:py-14">
      <Container>
        <PageHeader
          eyebrow="Portal del paciente"
          title="Tu salud dental, siempre a mano"
          description="Accede a citas, informes, documentos y pagos con la misma cuenta que usas para reservar."
        />
        <div className="grid gap-4 md:grid-cols-3">
          {features.map(({ icon: Icon, title, text }) => (
            <Card key={title}>
              <Icon className="h-6 w-6 text-brand-600" aria-hidden />
              <h2 className="mt-3 font-semibold text-ink">{title}</h2>
              <p className="mt-2 text-sm text-slate-600">{text}</p>
            </Card>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button size="lg" onClick={() => (window.location.href = '/login/paciente?next=/paciente')}>
            Acceder al portal
          </Button>
          <Button variant="outline" size="lg" onClick={() => (window.location.href = '/registro-paciente')}>
            Crear cuenta
          </Button>
          <Button variant="ghost" size="lg" onClick={() => (window.location.href = '/citas-con-ia')}>
            Reservar con IA
          </Button>
        </div>
      </Container>
    </main>
  </PublicShell>
)

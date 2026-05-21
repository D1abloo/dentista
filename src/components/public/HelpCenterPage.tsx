import { useEffect, useState } from 'react';
import { ArrowRight, BookOpen, Building2, Calendar, FileText, UserRound } from 'lucide-react';
import { PublicFooter } from './PublicFooter';
import { PublicHeader } from './PublicHeader';
import { GuideViewer } from '@/components/shared/GuideViewer';
import { adminGuideSections, patientGuideSections } from '@/lib/guide/content';

type Tab = 'paciente' | 'admin';

export function HelpCenterPage() {
  const [tab, setTab] = useState<Tab>('paciente');

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash === 'panel-admin' || hash === 'admin') setTab('admin');
    if (hash === 'portal-paciente' || hash === 'paciente') setTab('paciente');
  }, []);

  function selectTab(next: Tab) {
    setTab(next);
    const id = next === 'admin' ? 'panel-admin' : 'portal-paciente';
    window.history.replaceState(null, '', `/ayuda#${id}`);
  }

  return (
    <>
      <PublicHeader activeHref="/ayuda" />
      <main className="help-center">
        <section className="help-center__hero shell">
          <span className="help-center__badge">
            <BookOpen className="h-4 w-4" aria-hidden />
            Centro de ayuda
          </span>
          <h1>Cómo usar Dentista+</h1>
          <p>
            Tutoriales con imágenes para el portal del paciente (citas, informes ficticios de ejemplo, facturas) y
            el panel administrativo de tu clínica.
          </p>
          <div className="help-center__tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'paciente'}
              className={tab === 'paciente' ? 'help-center__tab--active' : ''}
              onClick={() => selectTab('paciente')}
            >
              <UserRound className="h-4 w-4" aria-hidden />
              Portal paciente
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'admin'}
              className={tab === 'admin' ? 'help-center__tab--active' : ''}
              onClick={() => selectTab('admin')}
            >
              <Building2 className="h-4 w-4" aria-hidden />
              Panel clínica
            </button>
          </div>
          <div className="help-center__quick">
            <a href="#portal-paciente" className="help-center__quick-card" onClick={() => selectTab('paciente')}>
              <UserRound className="h-5 w-5" aria-hidden />
              <span>
                <strong>Portal paciente</strong>
                <small>Citas, informes y pagos</small>
              </span>
              <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
            <a href="#panel-admin" className="help-center__quick-card" onClick={() => selectTab('admin')}>
              <Building2 className="h-5 w-5" aria-hidden />
              <span>
                <strong>Panel clínica</strong>
                <small>Agenda, pacientes y facturación</small>
              </span>
              <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
            <a href="/reserva" className="help-center__quick-card help-center__quick-card--muted">
              <Calendar className="h-5 w-5" aria-hidden />
              <span>
                <strong>Reservar cita</strong>
                <small>Flujo público sin registro previo</small>
              </span>
              <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
            <a href="/contacto" className="help-center__quick-card help-center__quick-card--muted">
              <FileText className="h-5 w-5" aria-hidden />
              <span>
                <strong>Contacto</strong>
                <small>Soporte y consultas comerciales</small>
              </span>
              <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
          </div>
        </section>
        <section className="shell help-center__body">
          {tab === 'paciente' ? (
            <GuideViewer
              intro="Guía para pacientes: acceso, citas de ejemplo, informes clínicos, documentos y pagos."
              sections={patientGuideSections}
            />
          ) : (
            <GuideViewer
              intro="Guía para el equipo de la clínica: agenda, pacientes, informes, facturación y acceso supervisado al PdP."
              sections={adminGuideSections}
            />
          )}
        </section>
      </main>
      <PublicFooter />
    </>
  );
}

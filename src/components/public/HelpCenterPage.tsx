import { useCallback, useEffect, useState } from 'react';
import {
  ArrowUpRight,
  BookOpen,
  Building2,
  CalendarPlus,
  Headphones,
  MessageCircle,
  UserRound
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PublicFooter } from './PublicFooter';
import { PublicHeader } from './PublicHeader';
import { GuideViewer } from '@/components/shared/GuideViewer';
import { adminGuideSections, patientGuideSections } from '@/lib/guide/content';

type Tab = 'paciente' | 'admin';

type HelpAction = {
  id: string;
  title: string;
  description: string;
  cta: string;
  icon: LucideIcon;
  tone: 'teal' | 'blue' | 'amber' | 'violet';
  href?: string;
  tab?: Tab;
  sectionId?: string;
};

const actions: HelpAction[] = [
  {
    id: 'paciente',
    title: 'Guía portal paciente',
    description: 'Acceso, citas, informes, documentos, facturas y consentimientos con capturas en móvil.',
    cta: 'Ver tutorial paciente',
    icon: UserRound,
    tone: 'teal',
    tab: 'paciente',
    sectionId: 'acceso'
  },
  {
    id: 'admin',
    title: 'Guía panel clínica',
    description: 'Dashboard, agenda, pacientes, facturación y acceso supervisado al portal del paciente.',
    cta: 'Ver tutorial clínica',
    icon: Building2,
    tone: 'blue',
    tab: 'admin',
    sectionId: 'panel'
  },
  {
    id: 'reserva',
    title: 'Reservar cita',
    description: 'Requiere cuenta de paciente activada por correo. Luego elige clínica, tratamiento y horario.',
    cta: 'Registro o reserva',
    icon: CalendarPlus,
    tone: 'amber',
    href: '/reserva'
  },
  {
    id: 'contacto',
    title: 'Contacto y soporte',
    description: 'Consultas comerciales, incidencias técnicas o ayuda para registrar tu clínica.',
    cta: 'Contactar',
    icon: Headphones,
    tone: 'violet',
    href: '/contacto'
  }
];

export function HelpCenterPage() {
  const [tab, setTab] = useState<Tab>('paciente');

  const scrollToSection = useCallback((sectionId: string) => {
    window.requestAnimationFrame(() => {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  const applyHash = useCallback(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash === 'panel-admin' || hash === 'admin' || hash === 'panel') {
      setTab('admin');
      if (hash === 'panel') setTimeout(() => scrollToSection('panel'), 120);
      return;
    }
    if (hash === 'portal-paciente' || hash === 'paciente' || hash === 'acceso') {
      setTab('paciente');
      if (hash === 'acceso') setTimeout(() => scrollToSection('acceso'), 120);
    }
  }, [scrollToSection]);

  useEffect(() => {
    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, [applyHash]);

  function selectTab(next: Tab) {
    setTab(next);
    const id = next === 'admin' ? 'panel-admin' : 'portal-paciente';
    window.history.replaceState(null, '', `/ayuda#${id}`);
  }

  function runAction(action: HelpAction) {
    if (action.href) {
      window.location.href = action.href;
      return;
    }
    if (action.tab) {
      selectTab(action.tab);
      if (action.sectionId) {
        const sectionId = action.sectionId;
        window.history.replaceState(null, '', `/ayuda#${sectionId}`);
        setTimeout(() => scrollToSection(sectionId), 80);
      }
    }
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
            Tutoriales detallados con capturas del móvil para pacientes y equipos de clínica. Elige una acción rápida o
            explora la guía completa más abajo.
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
        </section>

        <section className="shell help-center__actions-wrap">
          <header className="help-center__actions-head">
            <MessageCircle className="h-5 w-5" aria-hidden />
            <div>
              <h2>Acciones rápidas</h2>
              <p>Accede a la guía, reserva una cita o contacta con soporte en un clic.</p>
            </div>
          </header>
          <div className="help-actions">
            {actions.map((action) => (
              <button
                key={action.id}
                type="button"
                className={`help-actions__card help-actions__card--${action.tone}`}
                onClick={() => runAction(action)}
              >
                <span className="help-actions__icon" aria-hidden>
                  <action.icon className="h-6 w-6" />
                </span>
                <span className="help-actions__copy">
                  <strong>{action.title}</strong>
                  <span>{action.description}</span>
                </span>
                <span className="help-actions__cta">
                  {action.cta}
                  <ArrowUpRight className="h-4 w-4" aria-hidden />
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="shell help-center__body">
          {tab === 'paciente' ? (
            <GuideViewer
              intro="Guía detallada con capturas reales del portal en móvil: acceso, citas, informes, documentos, facturas y consentimientos."
              sections={patientGuideSections}
            />
          ) : (
            <GuideViewer
              intro="Manual del panel administrativo con capturas en formato móvil: dashboard, agenda, pacientes, facturación y acceso auditado al portal del paciente."
              sections={adminGuideSections}
            />
          )}
        </section>
      </main>
      <PublicFooter />
    </>
  );
}

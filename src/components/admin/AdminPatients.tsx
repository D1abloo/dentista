import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Calendar,
  ChevronDown,
  FileText,
  Grid3x3,
  MoreHorizontal,
  Plus,
  Search,
  Shield,
  Upload,
  Users,
  X
} from 'lucide-react';
import { getPrimaryClinic } from '@/lib/clinic';
import { isClientDemoMode } from '@/lib/appMode';
import { fmtDate, fmtDateTime } from '@/lib/format';
import { savePatient } from '@/lib/demoStore';
import { patientsForClinic, patientsForTenant } from '@/lib/tenant';
import {
  computePatientKpis,
  enrichPatientRow,
  filterPatientRows,
  prefillPatientForBooking,
  searchPatientRows,
  sortPatientRows,
  type PatientFilter,
  type PatientRow,
  type PatientSort
} from '@/lib/patientAdmin';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useDemoStore } from '@/hooks/useDemoStore';
import { useNotice } from '@/hooks/useNotice';
import { useTenant } from '@/hooks/useTenant';
import { email, phone, required } from '@/lib/validation';
import { isTokenFeaturesEnabled } from '@/lib/featureFlags';
import { Button, Field, Input, Modal, Textarea } from '@/components/ui';
import { formatNhcDisplay } from '@/lib/nhc';
import { CreatePatientModal } from './CreatePatientModal';
import { ImportPatientsModal } from './ImportPatientsModal';
import { AdminEmptyState } from './ui';

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function badgeLabel(kind: PatientRow['badges'][number]) {
  if (kind === 'next') return 'Con cita próxima';
  if (kind === 'pending') return 'Factura pendiente';
  if (kind === 'portal') return 'Portal activo';
  return 'Sin próxima cita';
}

function PtKpi({ label, value, icon: Icon, tone }: { label: string; value: number; icon: typeof Users; tone: 'teal' | 'blue' | 'amber' | 'green' }) {
  return (
    <div className="pt-kpi">
      <span className={`pt-kpi__icon pt-kpi__icon--${tone}`}>
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div>
        <p className="pt-kpi__label">{label}</p>
        <p className="pt-kpi__value">{value}</p>
      </div>
    </div>
  );
}

function RowMenu({
  row,
  onEdit,
  onArchive
}: {
  row: PatientRow;
  onEdit: () => void;
  onArchive: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function close(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div className="pt-menu-wrap" ref={ref}>
      <button type="button" className="pt-btn-ghost pt-btn-sm" aria-label="Más acciones" onClick={() => setOpen((v) => !v)}>
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open ? (
        <ul className="pt-menu" role="menu">
          <li>
            <button type="button" onClick={() => { onEdit(); setOpen(false); }}>
              Editar
            </button>
          </li>
          <li>
            <button type="button" onClick={() => { onArchive(); setOpen(false); }}>
              Archivar
            </button>
          </li>
        </ul>
      ) : null}
    </div>
  );
}

function ActionMenu({ row, onPick }: { row: PatientRow; onPick: (action: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function close(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const items = [
    { id: 'cita', label: 'Crear cita' },
    { id: 'factura', label: 'Emitir factura' },
    { id: 'documento', label: 'Subir documento' },
    { id: 'informe', label: 'Crear informe' },
    { id: 'pago', label: 'Registrar pago' },
    ...(isTokenFeaturesEnabled() ? [{ id: 'portal', label: 'Abrir portal' }] : [])
  ];

  return (
    <div className="pt-menu-wrap" ref={ref}>
      <button type="button" className="pt-btn-ghost pt-btn-sm" onClick={() => setOpen((v) => !v)}>
        Nueva acción
        <ChevronDown className="h-3.5 w-3.5" />
      </button>
      {open ? (
        <ul className="pt-menu" role="menu">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => {
                  onPick(item.id);
                  setOpen(false);
                }}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function AdminPatients() {
  const { state, commit, refresh, dataSource } = useDemoStore();
  const scope = useTenant();
  const { setNotice } = useNotice();
  const clinic = getPrimaryClinic(state, scope.tenantId);
  const loading = dataSource === 'loading';

  const [q, setQ] = useState('');
  const debouncedQ = useDebouncedValue(q);
  const [filter, setFilter] = useState<PatientFilter>('all');
  const [sort, setSort] = useState<PatientSort>('next_appt');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editPatient, setEditPatient] = useState<(typeof state.patients)[0] | null>(null);
  const [mobileQuick, setMobileQuick] = useState(false);

  const baseRows = useMemo(() => {
    const ids = new Set(patientsForTenant(state, scope.tenantId));
    const pool = state.patients.filter((p) => ids.has(p.id));
    const clinicPool = patientsForClinic(state, clinic.id);
    const merged = [...new Map([...pool, ...clinicPool].map((p) => [p.id, p])).values()];
    return merged.map((p) => enrichPatientRow(state, p));
  }, [state, scope.tenantId, clinic.id]);

  const visible = useMemo(() => {
    let rows = searchPatientRows(state, baseRows, debouncedQ);
    rows = filterPatientRows(rows, filter);
    return sortPatientRows(rows, sort);
  }, [state, baseRows, debouncedQ, filter, sort]);

  const kpis = useMemo(() => computePatientKpis(baseRows), [baseRows]);
  const selected = visible.find((r) => r.patient.id === selectedId) ?? visible[0] ?? null;

  useEffect(() => {
    if (!selectedId && visible[0]) setSelectedId(visible[0].patient.id);
  }, [visible, selectedId]);

  function runAction(action: string, row: PatientRow) {
    prefillPatientForBooking(row.patient.id);
    const labels: Record<string, string> = {
      cita: 'Agenda',
      factura: 'Facturas',
      documento: 'Documentos',
      informe: 'Informes clínicos',
      pago: 'Pagos',
      portal: 'Acceso PdP'
    };
    setNotice({
      type: 'ok',
      message: `Usa el menú lateral del panel para abrir «${labels[action] ?? action}». El paciente queda preseleccionado cuando aplique.`
    });
  }

  return (
    <div className={`pt-module${loading ? ' pt-module--loading' : ''}`}>
      <header className="pt-module__head">
        <div>
          <h1>Pacientes</h1>
          <p>Gestiona expedientes, citas, documentos, facturas y acceso al portal del paciente.</p>
        </div>
        <div className="pt-module__actions">
          <button type="button" className="pt-btn-ghost" onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4" aria-hidden />
            Importar
          </button>
          <button type="button" className="pt-btn-primary" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            Crear paciente
          </button>
        </div>
      </header>

      <div className="pt-kpis">
        <PtKpi label="Pacientes totales" value={kpis.total} icon={Users} tone="teal" />
        <PtKpi label="Con próxima cita" value={kpis.withNext} icon={Calendar} tone="blue" />
        <PtKpi label="Facturas pendientes" value={kpis.pendingInv} icon={FileText} tone="amber" />
        <PtKpi label="Portal activo" value={kpis.portalActive} icon={Shield} tone="green" />
      </div>

      <div className="pt-toolbar">
        <div className="pt-search">
          <Search className="h-4 w-4" aria-hidden />
          <Input
            className="field-control"
            placeholder="Buscar por NHC, DNI, nombre, email, teléfono o factura…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="pt-filters">
          <div className="pt-filters__chips">
            {(
              [
                ['all', 'Todos', Grid3x3],
                ['next_appt', 'Con cita próxima', Calendar],
                ['pending_inv', 'Facturas pendientes', FileText],
                ['no_appt', 'Sin próxima cita', Calendar],
                ['portal', 'Portal activo', Shield]
              ] as const
            ).map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                className={`pt-chip${filter === id ? ' pt-chip--active' : ''}`}
                onClick={() => setFilter(id)}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
                {label}
              </button>
            ))}
          </div>
          <div className="pt-sort">
            <select
              className="field-control"
              value={sort}
              onChange={(e) => setSort(e.target.value as PatientSort)}
              aria-label="Ordenar pacientes"
            >
              <option value="next_appt">Ordenar por: próxima cita</option>
              <option value="name">Ordenar por: nombre</option>
              <option value="pending_inv">Ordenar por: facturas pendientes</option>
              <option value="recent">Ordenar por: más recientes</option>
            </select>
          </div>
        </div>
      </div>

      <div className="pt-layout">
        <div className="pt-list">
          {visible.length ? (
            visible.map((row, i) => (
              <article
                key={row.patient.id}
                className={`pt-card${selected?.patient.id === row.patient.id ? ' pt-card--selected' : ''}`}
                style={{ animationDelay: `${i * 40}ms` }}
                onClick={() => {
                  setSelectedId(row.patient.id);
                  setMobileQuick(true);
                }}
              >
                <span className="pt-card__avatar">{initials(row.patient.fullName)}</span>
                <div className="pt-card__main">
                  <strong>
                    {row.patient.fullName}
                    <span className="pt-card__nhc">{formatNhcDisplay(row.patient.nhc)}</span>
                  </strong>
                  <p className="pt-card__contact">
                    {row.patient.email} · {row.patient.phone}
                  </p>
                  <div className="pt-card__meta">
                    <div>
                      <span>Próxima cita</span>
                      <strong>{row.nextAppt ? fmtDateTime(row.nextAppt.date, row.nextAppt.time) : '—'}</strong>
                    </div>
                    <div>
                      <span>Facturas pendientes</span>
                      <strong>{row.pendingInvoices}</strong>
                    </div>
                    <div>
                      <span>Informes</span>
                      <strong>{row.reportsCount}</strong>
                    </div>
                  </div>
                  <div className="pt-badges">
                    {row.badges.map((b) => (
                      <span
                        key={b}
                        className={`pt-badge pt-badge--${b === 'next' ? 'next' : b === 'pending' ? 'pending' : b === 'portal' ? 'portal' : 'muted'}`}
                      >
                        {badgeLabel(b)}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="pt-card__actions" onClick={(e) => e.stopPropagation()}>
                  <div className="pt-card__actions-row">
                    <Button className="pt-btn-sm" onClick={() => setSelectedId(row.patient.id)}>
                      Ver ficha
                    </Button>
                    <ActionMenu row={row} onPick={(a) => runAction(a, row)} />
                    <RowMenu
                      row={row}
                      onEdit={() => setEditPatient(row.patient)}
                      onArchive={() => setNotice({ type: 'ok', message: 'Archivado en tu flujo interno (demo).' })}
                    />
                  </div>
                </div>
              </article>
            ))
          ) : (
            <AdminEmptyState
              title="Sin pacientes en este listado"
              description="No hay pacientes que coincidan con la búsqueda o el filtro activo. Prueba otro término o crea un nuevo expediente."
              icon={Users}
              action={
                <Button type="button" onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4" /> Nuevo paciente
                </Button>
              }
            />
          )}
        </div>

        {selected ? (
          <aside className={`pt-quick${mobileQuick ? ' pt-quick--open' : ''}`}>
            <div className="pt-quick__head">
              <h2>Ficha rápida</h2>
              <button type="button" className="pt-quick__close lg:hidden" aria-label="Cerrar" onClick={() => setMobileQuick(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="pt-quick__hero">
              <span className="pt-card__avatar">{initials(selected.patient.fullName)}</span>
              <div>
                <strong className="block text-base text-slate-900">{selected.patient.fullName}</strong>
                <span className="pt-card__nhc">{formatNhcDisplay(selected.patient.nhc)}</span>
                {selected.portalActive ? <span className="pt-badge pt-badge--portal mt-1 inline-block">Portal activo</span> : null}
              </div>
            </div>
            <p className="text-xs font-semibold text-slate-600">{selected.patient.email}</p>
            <p className="text-xs font-semibold text-slate-600">{selected.patient.phone}</p>
            {selected.nextAppt ? (
              <div className="pt-appt-highlight">
                <div>
                  <span>Próxima cita</span>
                  <strong>{fmtDateTime(selected.nextAppt.date, selected.nextAppt.time)}</strong>
                </div>
              </div>
            ) : (
              <p className="text-sm font-semibold text-slate-500">Sin cita próxima programada.</p>
            )}
            <div className="pt-mini-grid">
              <div className="pt-mini">
                <span>Facturas pendientes</span>
                <strong>{selected.pendingInvoices}</strong>
              </div>
              <div className="pt-mini">
                <span>Informes</span>
                <strong>{selected.reportsCount}</strong>
              </div>
              <div className="pt-mini">
                <span>Documentos</span>
                <strong>{selected.documentsCount}</strong>
              </div>
              <div className="pt-mini">
                <span>Portal activo</span>
                <strong>{selected.portalActive ? 'Sí' : 'No'}</strong>
              </div>
            </div>
            <div className="pt-quick-actions">
              <button type="button" className="pt-quick-btn pt-quick-btn--teal" onClick={() => runAction('cita', selected)}>
                <Calendar className="h-4 w-4" /> Crear cita
              </button>
              <button type="button" className="pt-quick-btn" onClick={() => runAction('factura', selected)}>
                <FileText className="h-4 w-4" /> Emitir factura
              </button>
              <button type="button" className="pt-quick-btn" onClick={() => runAction('documento', selected)}>
                <Upload className="h-4 w-4" /> Subir documento
              </button>
              <button type="button" className="pt-quick-btn" onClick={() => runAction('pago', selected)}>
                Registrar pago
              </button>
              {isTokenFeaturesEnabled() ? (
                <button type="button" className="pt-quick-btn pt-quick-btn--teal" onClick={() => runAction('portal', selected)}>
                  <Shield className="h-4 w-4" /> Acceso portal
                </button>
              ) : null}
            </div>
          </aside>
        ) : null}
      </div>

      <CreatePatientModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(id) => {
          setSelectedId(id);
          void refresh();
        }}
      />
      <ImportPatientsModal open={importOpen} onClose={() => setImportOpen(false)} />

      {editPatient ? (
        <Modal
          open
          title={`Editar — ${editPatient.fullName}`}
          onClose={() => setEditPatient(null)}
          footer={
            <>
              <Button tone="ghost" onClick={() => setEditPatient(null)}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  const err =
                    required(editPatient.fullName, 'Nombre') ||
                    email(editPatient.email) ||
                    phone(editPatient.phone);
                  if (err) {
                    setNotice({ type: 'error', message: err });
                    return;
                  }
                  commit(savePatient(state, editPatient));
                  setNotice({ type: 'ok', message: 'Paciente actualizado.' });
                  setEditPatient(null);
                }}
              >
                Guardar
              </Button>
            </>
          }
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nombre">
              <Input value={editPatient.fullName} onChange={(e) => setEditPatient({ ...editPatient, fullName: e.target.value })} />
            </Field>
            <Field label="Email">
              <Input type="email" value={editPatient.email} onChange={(e) => setEditPatient({ ...editPatient, email: e.target.value })} />
            </Field>
            <Field label="Teléfono">
              <Input value={editPatient.phone} onChange={(e) => setEditPatient({ ...editPatient, phone: e.target.value })} />
            </Field>
            <Field label="DNI">
              <Input value={editPatient.dni ?? ''} onChange={(e) => setEditPatient({ ...editPatient, dni: e.target.value })} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Notas">
                <Textarea value={editPatient.notes ?? ''} onChange={(e) => setEditPatient({ ...editPatient, notes: e.target.value })} />
              </Field>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

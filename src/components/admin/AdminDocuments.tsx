import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Calendar,
  Check,
  ChevronDown,
  Clock,
  Download,
  Eye,
  FileText,
  Image as ImageIcon,
  Lock,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Upload,
  Users,
  X
} from 'lucide-react';
import { isClientDemoMode } from '@/lib/appMode';
import {
  addMessage,
  createPatientDocument,
  deletePatientDocument,
  savePatientDocument
} from '@/lib/demoStore';
import {
  downloadDemoFileRef,
  isImageMime,
  isPdfMime,
  resolveDemoFileUrl,
  saveDemoFile
} from '@/lib/demoFiles';
import {
  computeDocumentKpis,
  docFormatLabel,
  docTypeLabel,
  filterDocuments,
  formatDocDate,
  formatFileSize,
  formatNhcDisplay,
  lastUploadLabel,
  patientLine,
  sortDocuments,
  type DocFilter,
  type DocSort
} from '@/lib/documentAdmin';
import { patientDisplayCode } from '@/lib/nhc';
import { findPatientsByQuery } from '@/lib/patientSearch';
import { patientName } from '@/lib/selectors';
import { todayIso } from '@/lib/format';
import { getPrimaryClinic } from '@/lib/clinic';
import { patientsForClinic } from '@/lib/tenant';
import { required } from '@/lib/validation';
import { useCountUp } from '@/hooks/useCountUp';
import { useDemoStore } from '@/hooks/useDemoStore';
import { useNotice } from '@/hooks/useNotice';
import { useTenant } from '@/hooks/useTenant';
import type { DocumentType, Patient, PatientDocument } from '@/types/demo';
import { Field, Input, Modal, Select, Textarea } from '@/components/ui';

const PAGE_SIZE = 10;
const MAX_BYTES = 10_000_000;
const ACCEPT = 'application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png';

const FILTER_CHIPS: { id: DocFilter; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'consentimiento', label: 'Consentimientos' },
  { id: 'radiografia', label: 'Radiografías' },
  { id: 'recibo', label: 'Recibos' },
  { id: 'imagenes', label: 'Imágenes' },
  { id: 'visible', label: 'Visibles para paciente' },
  { id: 'privado', label: 'Privados' }
];

const DOC_TYPES: DocumentType[] = ['consentimiento', 'radiografia', 'recibo', 'informe', 'factura', 'otro'];

function typeBadgeClass(type: DocumentType) {
  if (type === 'consentimiento') return 'doc-badge--consent';
  if (type === 'radiografia') return 'doc-badge--radio';
  if (type === 'recibo') return 'doc-badge--recibo';
  if (type === 'informe') return 'doc-badge--informe';
  if (type === 'factura') return 'doc-badge--factura';
  return 'doc-badge--otro';
}

function DocKpi({
  label,
  value,
  display,
  icon: Icon,
  tone
}: {
  label: string;
  value: number;
  display?: string;
  icon: typeof FileText;
  tone: 'green' | 'teal' | 'amber' | 'blue';
}) {
  const n = useCountUp(value);
  return (
    <div className="doc-kpi">
      <span className={`doc-kpi__icon doc-kpi__icon--${tone}`}>
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div>
        <p className="doc-kpi__label">{label}</p>
        <p className="doc-kpi__value">{display ?? n}</p>
      </div>
    </div>
  );
}

function RowMenu({ onAction }: { onAction: (action: string) => void }) {
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
    <div className="doc-menu-wrap" ref={ref}>
      <button type="button" className="doc-btn-ghost" aria-label="Más acciones" onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}>
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open ? (
        <ul className="doc-menu" role="menu">
          <li><button type="button" onClick={() => { onAction('visibility'); setOpen(false); }}>Cambiar visibilidad</button></li>
          <li><button type="button" onClick={() => { onAction('duplicate'); setOpen(false); }}>Duplicar</button></li>
          <li><button type="button" onClick={() => { onAction('archive'); setOpen(false); }}>Archivar</button></li>
          <li><button type="button" className="doc-menu__danger" onClick={() => { onAction('delete'); setOpen(false); }}>Eliminar</button></li>
        </ul>
      ) : null}
    </div>
  );
}

function DocPatientPicker({
  patients,
  patientId,
  onSelect,
  state
}: {
  patients: Patient[];
  patientId: string;
  onSelect: (id: string) => void;
  state: ReturnType<typeof useDemoStore>['state'];
}) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const scoped = useMemo(() => ({ ...state, patients }), [state, patients]);
  const matches = useMemo(() => {
    const list = findPatientsByQuery(scoped, q);
    return q.trim() ? list.slice(0, 8) : patients.slice(0, 8);
  }, [scoped, patients, q]);
  const selected = patients.find((p) => p.id === patientId);

  return (
    <div className="doc-field doc-patient-picker">
      <label>Paciente</label>
      {selected ? (
        <div className="doc-patient-chip">
          <span className="doc-patient-chip__val">
            {formatNhcDisplay(selected.nhc)} — {selected.fullName}
            <button type="button" aria-label="Quitar paciente" onClick={() => onSelect('')}>
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
          <button type="button" className="doc-btn-ghost" aria-label="Cambiar paciente" onClick={() => setOpen(true)}>
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <Input
          placeholder="Buscar por NHC, DNI o nombre…"
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
        />
      )}
      {open && matches.length ? (
        <ul>
          {matches.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => {
                  onSelect(p.id);
                  setQ('');
                  setOpen(false);
                }}
              >
                {patientDisplayCode(p)} — {p.fullName}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function AdminDocuments() {
  const { state, commit, refresh } = useDemoStore();
  const scope = useTenant();
  const { setNotice } = useNotice();
  const clinic = getPrimaryClinic(state, scope.tenantId);
  const clinicPatients = useMemo(
    () => (clinic ? patientsForClinic(state, clinic.id) : state.patients),
    [state, clinic]
  );
  const dentists = scope.dentists;

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<DocFilter>('todos');
  const [sort, setSort] = useState<DocSort>('fecha');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<PatientDocument | null>(null);
  const [editDoc, setEditDoc] = useState<PatientDocument | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const uploadRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [docFile, setDocFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [uploadDone, setUploadDone] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    patientId: clinicPatients[0]?.id ?? '',
    type: 'consentimiento' as DocumentType,
    title: '',
    description: '',
    docDate: todayIso(),
    professional: '',
    visibility: 'paciente' as PatientDocument['visibility'],
    notify: true
  });

  const tenantDocs = useMemo(
    () => state.patientDocuments.filter((d) => d.tenantId === scope.tenantId),
    [state.patientDocuments, scope.tenantId]
  );

  const filtered = useMemo(() => {
    const f = filterDocuments(tenantDocs, state, filter, search);
    return sortDocuments(f, state, sort);
  }, [tenantDocs, state, filter, search, sort]);

  const kpis = useMemo(() => computeDocumentKpis(tenantDocs), [tenantDocs]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const pageItems = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  const selected = useMemo(() => {
    if (selectedId) return filtered.find((d) => d.id === selectedId) ?? tenantDocs.find((d) => d.id === selectedId) ?? null;
    return pageItems[0] ?? filtered[0] ?? null;
  }, [selectedId, filtered, pageItems, tenantDocs]);

  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 320);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => setPage(1), [search, filter, sort]);

  useEffect(() => {
    if (!docFile) {
      setUploadPct(0);
      setUploadDone(false);
      return;
    }
    setUploadDone(false);
    setUploadPct(0);
    const id = window.setInterval(() => {
      setUploadPct((p) => {
        if (p >= 65) {
          window.clearInterval(id);
          return 65;
        }
        return p + 8;
      });
    }, 80);
    return () => window.clearInterval(id);
  }, [docFile]);

  const pickFile = useCallback((file: File | null) => {
    setUploadError('');
    if (!file) {
      setDocFile(null);
      return;
    }
    if (file.size > MAX_BYTES) {
      setUploadError('El archivo supera 10 MB.');
      return;
    }
    const ok =
      isPdfMime(file.type, file.name) ||
      isImageMime(file.type, file.name);
    if (!ok) {
      setUploadError('Solo PDF, JPG o PNG.');
      return;
    }
    setDocFile(file);
  }, []);

  async function notifyPatient(patientId: string, title: string) {
    const patient = state.patients.find((p) => p.id === patientId);
    const clinicId = patient?.preferredClinicId;
    const body = `Se ha publicado un nuevo documento: ${title}.`;
    if (!isClientDemoMode() && clinicId) {
      await fetch('/api/records/message', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          clinicId,
          patientId,
          subject: 'Nuevo documento disponible',
          body,
          channel: 'email',
          type: 'clinica'
        })
      });
      return;
    }
    commit(
      addMessage(state, {
        patientId,
        subject: 'Nuevo documento disponible',
        body,
        channel: 'email',
        type: 'clinica',
        read: false,
        sentAt: new Date().toISOString()
      })
    );
  }

  async function saveUpload() {
    const err = required(form.patientId, 'Paciente') || required(form.title, 'Título');
    if (err) {
      setNotice({ type: 'error', message: err });
      return;
    }
    if (!docFile) {
      setNotice({ type: 'error', message: 'Selecciona un archivo PDF, JPG o PNG.' });
      return;
    }
    setSaving(true);
    setUploadPct(70);
    try {
      const fileRef = await saveDemoFile(docFile);
      setUploadPct(100);
      setUploadDone(true);
      const descParts = [
        form.professional ? `Profesional: ${form.professional}` : '',
        form.description.trim()
      ].filter(Boolean);
      const payload = {
        patientId: form.patientId,
        type: form.type,
        title: form.title.trim(),
        description: descParts.length ? descParts.join('\n') : undefined,
        fileName: docFile.name,
        fileRef,
        mimeType: docFile.type,
        visibility: form.visibility,
        createdAt: form.docDate
      };
      if (!isClientDemoMode()) {
        const clinicId = state.patients.find((p) => p.id === form.patientId)?.preferredClinicId;
        if (clinicId) {
          const res = await fetch('/api/records/document', {
            method: 'POST',
            credentials: 'include',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ clinicId, ...payload })
          });
          if (!res.ok) throw new Error('No se pudo guardar en el servidor.');
        }
      }
      commit(createPatientDocument(state, payload));
      if (!isClientDemoMode()) await refresh();
      if (form.notify) await notifyPatient(form.patientId, form.title.trim());
      setNotice({ type: 'ok', message: 'Documento subido y vinculado al paciente.' });
      setForm((f) => ({ ...f, title: '', description: '' }));
      setDocFile(null);
      setUploadDone(false);
      setUploadPct(0);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al subir.';
      setUploadError(msg);
      setNotice({ type: 'error', message: msg });
    } finally {
      setSaving(false);
    }
  }

  function updateDoc(doc: PatientDocument, patch: Partial<PatientDocument>) {
    const next = { ...doc, ...patch };
    commit(savePatientDocument(state, next));
    setNotice({ type: 'ok', message: 'Documento actualizado.' });
  }

  function handleRowAction(doc: PatientDocument, action: string) {
    if (action === 'visibility') {
      updateDoc(doc, { visibility: doc.visibility === 'paciente' ? 'admin' : 'paciente' });
      return;
    }
    if (action === 'duplicate') {
      commit(
        createPatientDocument(state, {
          patientId: doc.patientId,
          appointmentId: doc.appointmentId,
          type: doc.type,
          title: `${doc.title} (copia)`,
          description: doc.description,
          fileName: doc.fileName,
          fileRef: doc.fileRef,
          mimeType: doc.mimeType,
          visibility: doc.visibility
        })
      );
      setNotice({ type: 'ok', message: 'Documento duplicado.' });
      return;
    }
    if (action === 'archive') {
      updateDoc(doc, { title: `[Archivado] ${doc.title}`, visibility: 'admin' });
      return;
    }
    if (action === 'delete') setDeleteId(doc.id);
  }

  function scrollToUpload() {
    uploadRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    uploadRef.current?.classList.add('doc-side--focus');
    window.setTimeout(() => uploadRef.current?.classList.remove('doc-side--focus'), 1200);
  }

  const from = filtered.length ? (pageSafe - 1) * PAGE_SIZE + 1 : 0;
  const to = Math.min(pageSafe * PAGE_SIZE, filtered.length);

  return (
    <div className="doc-module">
      <header className="doc-module__head">
        <div>
          <h1>Documentos</h1>
          <p>Sube, clasifica y comparte documentos clínicos con cada paciente.</p>
        </div>
        <button type="button" className="doc-btn-primary" onClick={scrollToUpload}>
          <Plus className="h-4 w-4" aria-hidden />
          Subir documento
        </button>
      </header>

      {loading ? (
        <div className="doc-kpis">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="doc-skeleton" />
          ))}
        </div>
      ) : (
        <div className="doc-kpis">
          <DocKpi label="Documentos totales" value={kpis.total} icon={FileText} tone="green" />
          <DocKpi label="Visibles para paciente" value={kpis.visible} icon={Users} tone="teal" />
          <DocKpi label="Pendientes de revisar" value={kpis.pending} icon={Clock} tone="amber" />
          <DocKpi label="Última subida" value={0} display={lastUploadLabel(kpis.latest)} icon={Calendar} tone="blue" />
        </div>
      )}

      <div className="doc-toolbar">
        <div className="doc-search">
          <Search aria-hidden />
          <input
            type="search"
            placeholder="Buscar por paciente, DNI, NHC, título, tipo o ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="doc-toolbar__row">
          <div className="doc-chips doc-chips--scroll">
            {FILTER_CHIPS.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`doc-chip${filter === c.id ? ' doc-chip--active' : ''}`}
                onClick={() => setFilter(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="doc-sort">
            <label className="sr-only" htmlFor="doc-sort">Ordenar</label>
            <select
              id="doc-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as DocSort)}
            >
              <option value="fecha">Ordenar por: fecha de subida</option>
              <option value="titulo">Ordenar por: título</option>
              <option value="paciente">Ordenar por: paciente</option>
              <option value="tipo">Ordenar por: tipo</option>
            </select>
          </div>
        </div>
      </div>

      <div className="doc-grid">
        <section className="doc-card">
          <div className="doc-card__head">
            <h2>Listado de documentos</h2>
          </div>
          {loading ? (
            <div style={{ padding: '1rem' }}>
              <div className="doc-skeleton" />
            </div>
          ) : (
            <>
              <div className="doc-table-wrap">
                <table className="doc-table">
                  <thead>
                    <tr>
                      <th>Documento</th>
                      <th>Paciente</th>
                      <th>Tipo</th>
                      <th>Fecha</th>
                      <th>Formato / Visibilidad</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((d) => (
                      <tr
                        key={d.id}
                        className={`doc-row${selected?.id === d.id ? ' doc-row--selected' : ''}`}
                        onClick={() => setSelectedId(d.id)}
                      >
                        <td>
                          <p className="doc-row__title">{d.title}</p>
                        </td>
                        <td>
                          <p className="doc-row__sub">{patientLine(state, d.patientId)}</p>
                        </td>
                        <td>
                          <span className={`doc-badge ${typeBadgeClass(d.type)}`}>{docTypeLabel(d.type)}</span>
                        </td>
                        <td>{formatDocDate(d.createdAt)}</td>
                        <td>
                          <span className={`doc-badge ${docFormatLabel(d) === 'PDF' ? 'doc-badge--pdf' : 'doc-badge--img'}`}>
                            {docFormatLabel(d)}
                          </span>{' '}
                          <span className={`doc-badge ${d.visibility === 'paciente' ? 'doc-badge--visible' : 'doc-badge--private'}`}>
                            {d.visibility === 'paciente' ? (
                              <>Visible</>
                            ) : (
                              <>
                                <Lock className="mr-0.5 inline h-3 w-3" aria-hidden />
                                Privado
                              </>
                            )}
                          </span>
                        </td>
                        <td>
                          <div className="doc-actions" onClick={(e) => e.stopPropagation()}>
                            <button type="button" className="doc-btn-ghost" onClick={() => d.fileRef && setPreviewDoc(d)}>
                              <Eye className="h-3.5 w-3.5" /> Ver
                            </button>
                            <button
                              type="button"
                              className="doc-btn-ghost"
                              disabled={!d.fileRef}
                              onClick={() => d.fileRef && downloadDemoFileRef(d.fileRef, d.fileName)}
                            >
                              <Download className="h-3.5 w-3.5" /> Descargar
                            </button>
                            <button type="button" className="doc-btn-ghost" onClick={() => setEditDoc(d)}>
                              <Pencil className="h-3.5 w-3.5" /> Editar
                            </button>
                            <RowMenu onAction={(a) => handleRowAction(d, a)} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {pageItems.map((d) => (
                <div
                  key={`m-${d.id}`}
                  className={`doc-mobile-card${selected?.id === d.id ? ' doc-row--selected' : ''}`}
                  onClick={() => setSelectedId(d.id)}
                >
                  <p className="doc-row__title">{d.title}</p>
                  <p className="doc-row__sub">{patientLine(state, d.patientId)}</p>
                  <div className="doc-actions" style={{ marginTop: '0.5rem' }} onClick={(e) => e.stopPropagation()}>
                    <button type="button" className="doc-btn-ghost" onClick={() => d.fileRef && setPreviewDoc(d)}>
                      Ver
                    </button>
                    <button type="button" className="doc-btn-ghost" onClick={() => setEditDoc(d)}>
                      Editar
                    </button>
                  </div>
                </div>
              ))}
              {!pageItems.length ? (
                <p style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b', fontWeight: 600 }}>
                  No hay documentos con estos filtros.
                </p>
              ) : null}
            </>
          )}
          <footer className="doc-card__foot">
            <span>
              Mostrando {from} a {to} de {filtered.length} documento{filtered.length === 1 ? '' : 's'}
            </span>
            <div className="doc-pager">
              <button type="button" disabled={pageSafe <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} aria-label="Anterior">
                ‹
              </button>
              <span>{pageSafe}</span>
              <button type="button" disabled={pageSafe >= totalPages} onClick={() => setPage((p) => p + 1)} aria-label="Siguiente">
                ›
              </button>
            </div>
          </footer>
        </section>

        <aside className="doc-side" ref={uploadRef}>
          <div className="doc-card doc-upload">
            <h2>Subir documento</h2>
            <div className="doc-form-grid">
              <DocPatientPicker
                patients={clinicPatients}
                patientId={form.patientId}
                onSelect={(id) => setForm({ ...form, patientId: id })}
                state={state}
              />
              <div className="doc-form-grid doc-form-grid--2">
                <div className="doc-field">
                  <label htmlFor="doc-type">Tipo</label>
                  <select
                    id="doc-type"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as DocumentType })}
                  >
                    {DOC_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {docTypeLabel(t)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="doc-field">
                  <label htmlFor="doc-title">Título *</label>
                  <input
                    id="doc-title"
                    placeholder="Ej. Consentimiento implantes"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>
              </div>
              <div className="doc-form-grid doc-form-grid--2">
                <div className="doc-field">
                  <label htmlFor="doc-desc">Descripción</label>
                  <textarea
                    id="doc-desc"
                    placeholder="Describe el contenido del documento…"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
                <div className="doc-field">
                  <label htmlFor="doc-date">Fecha del documento</label>
                  <input
                    id="doc-date"
                    type="date"
                    value={form.docDate}
                    onChange={(e) => setForm({ ...form, docDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="doc-form-grid doc-form-grid--2">
                <div className="doc-field">
                  <label htmlFor="doc-pro">Profesional responsable</label>
                  <select
                    id="doc-pro"
                    value={form.professional}
                    onChange={(e) => setForm({ ...form, professional: e.target.value })}
                  >
                    <option value="">Selecciona profesional</option>
                    {dentists.map((d) => (
                      <option key={d.id} value={d.fullName}>
                        {d.fullName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="doc-field">
                  <label htmlFor="doc-vis">Visibilidad</label>
                  <select
                    id="doc-vis"
                    value={form.visibility}
                    onChange={(e) =>
                      setForm({ ...form, visibility: e.target.value as PatientDocument['visibility'] })
                    }
                  >
                    <option value="paciente">Visible para paciente</option>
                    <option value="admin">Solo administración (privado)</option>
                  </select>
                </div>
              </div>
              <div className="doc-switch-row">
                <div>
                  <p>Notificar al paciente</p>
                  <small>El paciente recibirá una notificación por correo o app.</small>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.notify}
                  className={`doc-switch${form.notify ? ' doc-switch--on' : ''}`}
                  onClick={() => setForm({ ...form, notify: !form.notify })}
                />
              </div>
              <div
                className={`doc-dropzone${dragOver ? ' doc-dropzone--drag' : ''}${uploadError ? ' doc-dropzone--error' : ''}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  pickFile(e.dataTransfer.files[0] ?? null);
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mx-auto h-6 w-6 text-teal-600" aria-hidden />
                <p>Arrastra archivos aquí o haz clic para seleccionar</p>
                <small>PDF, JPG, PNG · Máx. 10 MB</small>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPT}
                  className="sr-only"
                  onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                />
              </div>
              {uploadError ? (
                <p style={{ color: '#dc2626', fontSize: '0.78rem', fontWeight: 700 }}>{uploadError}</p>
              ) : null}
              {docFile ? (
                <div className="doc-file-preview">
                  {isPdfMime(docFile.type, docFile.name) ? (
                    <FileText className="h-8 w-8 text-red-500 shrink-0" />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-blue-500 shrink-0" />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 700, color: '#0f2742' }}>
                      {docFile.name} · {formatFileSize(docFile.size)}
                    </p>
                    <div className="doc-file-preview__bar">
                      <span style={{ width: `${uploadDone ? 100 : uploadPct}%` }} />
                    </div>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.7rem', color: '#64748b' }}>
                      {uploadDone ? 'Completado' : `${uploadPct}%`}
                    </p>
                  </div>
                  {uploadDone ? <Check className="doc-file-preview__ok h-5 w-5" aria-hidden /> : null}
                </div>
              ) : null}
              <button type="button" className="doc-btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={saving} onClick={() => void saveUpload()}>
                <Upload className="h-4 w-4" aria-hidden />
                Subir y vincular
              </button>
            </div>
          </div>

          {selected ? (
            <div className="doc-card doc-preview-card">
              <h3>Vista previa</h3>
              <div className="doc-preview-card__thumb">
                {selected.fileRef && isImageMime(selected.mimeType, selected.fileName) ? (
                  <img src={resolveDemoFileUrl(selected.fileRef) ?? ''} alt="" />
                ) : (
                  <FileText className="h-10 w-10 text-slate-300" aria-hidden />
                )}
              </div>
              <div className="doc-preview-card__meta">
                <p>
                  Documento seleccionado: <strong>{selected.title}</strong>
                </p>
                <p>
                  Paciente: <strong>{patientName(state, selected.patientId)}</strong>
                </p>
                <p>
                  <span className={`doc-badge ${docFormatLabel(selected) === 'PDF' ? 'doc-badge--pdf' : 'doc-badge--img'}`}>
                    {docFormatLabel(selected)}
                  </span>{' '}
                  <span className={`doc-badge ${selected.visibility === 'paciente' ? 'doc-badge--visible' : 'doc-badge--private'}`}>
                    {selected.visibility === 'paciente' ? 'Visible' : 'Privado'}
                  </span>
                </p>
              </div>
              <div className="doc-preview-card__actions">
                <button type="button" onClick={() => selected.fileRef && downloadDemoFileRef(selected.fileRef, selected.fileName)}>
                  Descargar
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateDoc(selected, {
                      visibility: selected.visibility === 'paciente' ? 'admin' : 'paciente'
                    })
                  }
                >
                  Cambiar visibilidad
                </button>
              </div>
            </div>
          ) : null}
        </aside>
      </div>

      {previewDoc?.fileRef ? (
        <Modal open title={previewDoc.title} onClose={() => setPreviewDoc(null)}>
          <div className="doc-preview-modal">
            {isImageMime(previewDoc.mimeType, previewDoc.fileName) ? (
              <img src={resolveDemoFileUrl(previewDoc.fileRef) ?? ''} alt={previewDoc.title} />
            ) : (
              <iframe title={previewDoc.title} src={resolveDemoFileUrl(previewDoc.fileRef) ?? ''} />
            )}
          </div>
        </Modal>
      ) : null}

      {editDoc ? (
        <Modal open title="Editar documento" onClose={() => setEditDoc(null)}>
          <div className="grid gap-3">
            <Field label="Título *">
              <Input
                value={editDoc.title}
                onChange={(e) => setEditDoc({ ...editDoc, title: e.target.value })}
              />
            </Field>
            <Field label="Tipo">
              <Select
                value={editDoc.type}
                onChange={(e) => setEditDoc({ ...editDoc, type: e.target.value as DocumentType })}
              >
                {DOC_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {docTypeLabel(t)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Descripción">
              <Textarea
                value={editDoc.description ?? ''}
                onChange={(e) => setEditDoc({ ...editDoc, description: e.target.value })}
              />
            </Field>
            <Field label="Visibilidad">
              <Select
                value={editDoc.visibility}
                onChange={(e) =>
                  setEditDoc({ ...editDoc, visibility: e.target.value as PatientDocument['visibility'] })
                }
              >
                <option value="paciente">Visible para paciente</option>
                <option value="admin">Privado (solo administración)</option>
              </Select>
            </Field>
            <button
              type="button"
              className="doc-btn-primary"
              onClick={() => {
                const err = required(editDoc.title, 'Título');
                if (err) {
                  setNotice({ type: 'error', message: err });
                  return;
                }
                updateDoc(editDoc, {
                  title: editDoc.title.trim(),
                  type: editDoc.type,
                  description: editDoc.description,
                  visibility: editDoc.visibility
                });
                setEditDoc(null);
              }}
            >
              Guardar cambios
            </button>
          </div>
        </Modal>
      ) : null}

      {deleteId ? (
        <Modal open title="Eliminar documento" onClose={() => setDeleteId(null)}>
          <p style={{ fontWeight: 600, color: '#475569' }}>¿Eliminar este documento del expediente? Esta acción no se puede deshacer.</p>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button type="button" className="doc-btn-ghost" onClick={() => setDeleteId(null)}>
              Cancelar
            </button>
            <button
              type="button"
              className="doc-btn-primary"
              style={{ background: '#dc2626' }}
              onClick={() => {
                commit(deletePatientDocument(state, deleteId));
                setDeleteId(null);
                if (selectedId === deleteId) setSelectedId(null);
                setNotice({ type: 'ok', message: 'Documento eliminado.' });
              }}
            >
              Eliminar
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

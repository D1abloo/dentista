import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Building2,
  Calendar,
  Check,
  Download,
  Eye,
  FileText,
  Lock,
  Mail,
  Paperclip,
  Receipt,
  Search,
  Send,
  Shield,
  Sparkles
} from 'lucide-react';
import { isClientDemoMode } from '@/lib/appMode';
import { useCountUp } from '@/hooks/useCountUp';
import { resolveFocusId, usePatientUrlParams } from '@/hooks/usePatientUrlParams';
import { PatientMessageViewer } from './PatientMessageViewer';
import { useDemoStore } from '@/hooks/useDemoStore';
import { useNotice } from '@/hooks/useNotice';
import { usePatient } from '@/hooks/usePatient';
import { logPortalAudit, usePortalAccess } from '@/hooks/usePortalAccess';
import { saveDemoFile } from '@/lib/demoFiles';
import { saveMessage } from '@/lib/demoStore';
import {
  clinicIdForMessage,
  clinicLabel,
  clinicsLinkedToPatient,
  type PatientClinicOption
} from '@/lib/patient/patientClinics';
import { sendPatientMessageToClinic } from '@/lib/patient/sendClinicMessage';
import { STORAGE_PATIENT_MESSAGE_CLINIC } from '@/lib/storage/keys';
import {
  ALLOWED_ATTACHMENT_TYPES,
  MAX_ATTACHMENT_BYTES,
  REPLY_TEMPLATES,
  appointmentLink,
  buildMessageKpis,
  documentLink,
  downloadMessagePdf,
  enrichPatientMessages,
  filterAndSortMessages,
  visibleMessagesForPatient,
  type MessageChip,
  type PatientMessageSort,
  type PatientMessageView
} from '@/lib/patient/messagesData';

const CHIPS: { id: MessageChip; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'unread', label: 'No leídos' },
  { id: 'recordatorio', label: 'Recordatorios' },
  { id: 'confirmacion', label: 'Confirmaciones' },
  { id: 'clinica', label: 'Clínica' },
  { id: 'factura', label: 'Facturas' },
  { id: 'documento', label: 'Documentos' },
  { id: 'citas', label: 'Citas' },
  { id: 'important', label: 'Importantes' },
  { id: '30d', label: 'Últimos 30 días' }
];

function typeClass(t: PatientMessageView['displayType']) {
  if (t === 'confirmacion') return 'pmsg-type--confirm';
  if (t === 'recordatorio') return 'pmsg-type--reminder';
  if (t === 'factura') return 'pmsg-type--invoice';
  if (t === 'documento') return 'pmsg-type--doc';
  return 'pmsg-type--clinic';
}

function KpiStat({
  label,
  value,
  delay,
  numeric
}: {
  label: string;
  value: string | number;
  delay: number;
  numeric?: boolean;
}) {
  const n = numeric && typeof value === 'number' ? useCountUp(value, 650) : value;
  return (
    <article className="pmsg-kpi" style={{ animationDelay: `${delay}ms` }}>
      <p className="pmsg-kpi__label">{label}</p>
      <p className="pmsg-kpi__value">{n}</p>
    </article>
  );
}

const DEFAULT_COMPOSE_SUBJECT = 'Consulta al equipo clínico';

export function PatientMessages() {
  const { state, commit, refresh } = useDemoStore();
  const patient = usePatient();
  const { setNotice } = useNotice();
  const portalAccess = usePortalAccess();
  const replyRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [q, setQ] = useState('');
  const [chip, setChip] = useState<MessageChip>('all');
  const [sort, setSort] = useState<PatientMessageSort>('recent');
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [composeSubject, setComposeSubject] = useState(DEFAULT_COMPOSE_SUBJECT);
  const [reply, setReply] = useState('');
  const [replyOpen, setReplyOpen] = useState(true);
  const [attachName, setAttachName] = useState<string | null>(null);
  const [attachRef, setAttachRef] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sendOk, setSendOk] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [linkedClinics, setLinkedClinics] = useState<PatientClinicOption[]>(() =>
    clinicsLinkedToPatient(state, patient)
  );
  const [selectedClinicId, setSelectedClinicId] = useState('');
  const [inboxClinicFilter, setInboxClinicFilter] = useState('');

  const urlParams = usePatientUrlParams();

  useEffect(() => {
    const local = clinicsLinkedToPatient(state, patient);
    if (isClientDemoMode()) {
      setLinkedClinics(local);
      return;
    }
    void (async () => {
      try {
        const res = await fetch('/api/patient/linked-clinics', { credentials: 'include' });
        const json = (await res.json()) as { data?: { clinics?: PatientClinicOption[] } };
        if (res.ok && json.data?.clinics?.length) {
          setLinkedClinics(json.data.clinics);
          return;
        }
      } catch {
        /* fallback */
      }
      setLinkedClinics(local);
    })();
  }, [state, patient.id, patient.preferredClinicId]);

  const replyClinicLockedId = useMemo(() => {
    if (!viewerId) return null;
    const v = state.messages.find((m) => m.id === viewerId);
    if (!v) return null;
    return clinicIdForMessage(state, v, patient) ?? null;
  }, [viewerId, state.messages, state, patient]);

  const composeClinicId = replyClinicLockedId ?? selectedClinicId;

  useEffect(() => {
    if (!linkedClinics.length) return;
    if (replyClinicLockedId) {
      setSelectedClinicId(replyClinicLockedId);
      return;
    }
    const stored =
      typeof window !== 'undefined' ? localStorage.getItem(STORAGE_PATIENT_MESSAGE_CLINIC) : null;
    const validStored = stored && linkedClinics.some((c) => c.id === stored) ? stored : null;
    const primary = linkedClinics.find((c) => c.isPrimary)?.id;
    const next = validStored ?? primary ?? linkedClinics[0].id;
    setSelectedClinicId((prev) =>
      prev && linkedClinics.some((c) => c.id === prev) ? prev : next
    );
  }, [linkedClinics, replyClinicLockedId]);

  useEffect(() => {
    if (composeClinicId && typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_PATIENT_MESSAGE_CLINIC, composeClinicId);
    }
  }, [composeClinicId]);

  const multipleClinics = linkedClinics.length > 1;
  const selectedClinic = linkedClinics.find((c) => c.id === composeClinicId);

  useEffect(() => {
    const asunto = urlParams.get('asunto');
    const contexto = urlParams.get('contexto');
    const factura = urlParams.get('factura');
    const documento = urlParams.get('documento');
    const informe = urlParams.get('informe');
    const cita = urlParams.get('cita');
    const consentimiento = urlParams.get('consentimiento');

    let draft = asunto?.trim() ?? contexto?.trim() ?? '';
    if (!draft && factura) draft = 'Hola, tengo una consulta sobre mi factura.';
    if (!draft && documento) draft = 'Hola, tengo una consulta sobre un documento compartido.';
    if (!draft && informe) draft = 'Hola, tengo una consulta sobre mi informe clínico.';
    if (!draft && cita) draft = 'Hola, tengo una consulta sobre mi cita.';
    if (!draft && consentimiento) draft = 'Hola, tengo una duda sobre un consentimiento informado.';

    if (draft) {
      setReply(draft);
      setReplyOpen(true);
    }
  }, [urlParams]);

  const baseMessages = useMemo(() => visibleMessagesForPatient(state, patient.id), [state, patient.id]);

  const views = useMemo(
    () => enrichPatientMessages(state, baseMessages, patient),
    [state, baseMessages, patient]
  );

  const kpis = useMemo(() => buildMessageKpis(baseMessages), [baseMessages]);

  const filtered = useMemo(
    () =>
      filterAndSortMessages(
        views,
        { q, chip, sort, clinicId: multipleClinics && inboxClinicFilter ? inboxClinicFilter : undefined },
        state
      ),
    [views, q, chip, sort, multipleClinics, inboxClinicFilter, state]
  );

  const focusId = resolveFocusId(urlParams, ['focus', 'mensaje', 'message']);

  const viewerMessage = useMemo(
    () => views.find((v) => v.message.id === viewerId) ?? null,
    [views, viewerId]
  );

  useEffect(() => {
    if (portalAccess.active) {
      void logPortalAudit({
        eventType: 'other',
        pagePath: '/paciente/mensajes',
        resourceLabel: 'Bandeja de mensajes'
      });
    }
  }, [portalAccess.active]);

  const openReplyTabFromUrl = Boolean(
    urlParams.get('contexto')?.trim() || urlParams.get('asunto')?.trim() || urlParams.get('informe')
  );

  useEffect(() => {
    if (focusId) {
      const match = views.find((v) => v.message.id === focusId);
      if (match) setViewerId(match.message.id);
      return;
    }
    if (openReplyTabFromUrl && filtered[0]) setViewerId(filtered[0].message.id);
  }, [focusId, views, openReplyTabFromUrl, filtered]);

  const openViewer = useCallback(
    (v: PatientMessageView) => {
      if (!v.message.read) {
        commit(saveMessage(state, { ...v.message, read: true }));
      }
      setViewerId(v.message.id);
      if (portalAccess.active) {
        void logPortalAudit({
          eventType: 'other',
          pagePath: '/paciente/mensajes',
          resourceLabel: v.message.subject,
          resourceId: v.message.id
        });
      }
    },
    [portalAccess.active, commit, state]
  );

  function markRead(v: PatientMessageView, e?: React.MouseEvent) {
    e?.stopPropagation();
    if (v.message.read) return;
    commit(saveMessage(state, { ...v.message, read: true }));
    setNotice({ type: 'ok', message: 'Mensaje marcado como leído.' });
    if (portalAccess.active) {
      void logPortalAudit({
        eventType: 'other',
        pagePath: '/paciente/mensajes',
        resourceLabel: `Leído: ${v.message.subject}`,
        resourceId: v.message.id
      });
    }
  }

  function archiveMessage(v: PatientMessageView) {
    commit(saveMessage(state, { ...v.message, archived: true, read: true }));
    setNotice({ type: 'ok', message: 'Mensaje archivado.' });
    if (viewerId === v.message.id) setViewerId(null);
    if (portalAccess.active) {
      void logPortalAudit({
        eventType: 'other',
        pagePath: '/paciente/mensajes',
        resourceLabel: `Archivado: ${v.message.subject}`,
        resourceId: v.message.id
      });
    }
  }

  async function downloadPdf(v: PatientMessageView, e?: React.MouseEvent) {
    e?.stopPropagation();
    setDownloadingId(v.message.id);
    try {
      const ok = await downloadMessagePdf(state, v);
      if (!ok) throw new Error('fail');
      setNotice({ type: 'ok', message: 'Descarga iniciada.' });
    } catch {
      setNotice({ type: 'error', message: 'No se pudo descargar el archivo.' });
    } finally {
      setDownloadingId(null);
    }
  }

  function contactClinic() {
    setViewerId(null);
    setReplyOpen(true);
    setComposeSubject(DEFAULT_COMPOSE_SUBJECT);
    window.setTimeout(() => replyRef.current?.focus(), 60);
  }

  async function onAttach(file: File | null) {
    if (!file) return;
    if (!ALLOWED_ATTACHMENT_TYPES.includes(file.type)) {
      setNotice({ type: 'error', message: 'Tipo de archivo no permitido.' });
      return;
    }
    if (file.size > MAX_ATTACHMENT_BYTES) {
      setNotice({ type: 'error', message: 'El archivo supera el tamaño permitido.' });
      return;
    }
    try {
      const ref = await saveDemoFile(file);
      setAttachRef(ref);
      setAttachName(file.name);
      setReplyOpen(true);
    } catch {
      setNotice({ type: 'error', message: 'No se pudo adjuntar el archivo.' });
    }
  }

  async function sendReply() {
    if (!composeClinicId) {
      setNotice({ type: 'error', message: 'Selecciona la clínica a la que quieres escribir.' });
      return;
    }
    setSending(true);
    setSendOk(false);
    try {
      const result = await sendPatientMessageToClinic({
        state,
        patient,
        clinicId: composeClinicId,
        input: {
          subject: viewerMessage ? `Re: ${viewerMessage.message.subject}` : composeSubject,
          body: reply,
          attachmentRef: attachRef ?? undefined,
          attachmentName: attachName ?? undefined,
          replyTo: viewerMessage?.message
        }
      });
      if (!result.ok) {
        setNotice({ type: 'error', message: result.error });
        return;
      }
      if (result.demoState) commit(result.demoState);
      else await refresh();
      setReply('');
      setComposeSubject(DEFAULT_COMPOSE_SUBJECT);
      setAttachName(null);
      setAttachRef(null);
      setSendOk(true);
      setTimeout(() => setSendOk(false), 2000);
      setNotice({
        type: 'ok',
        message: 'Mensaje enviado. La clínica lo recibirá y podrá responderte aquí.'
      });
      if (portalAccess.active) {
        void logPortalAudit({
          eventType: 'other',
          pagePath: '/paciente/mensajes',
          resourceLabel: 'Mensaje enviado a la clínica'
        });
      }
    } finally {
      setSending(false);
    }
  }

  const composeBlock = (
    <section className={`pmsg-compose${replyOpen ? ' pmsg-compose--open' : ''}`} id="contactar-clinica">
      <div className="pmsg-compose__head">
        <h3>Contactar con la clínica</h3>
        <p className="m-0 text-sm text-slate-600">
          Escribe tu consulta y el equipo te responderá en esta misma bandeja. Recibirán una notificación en el panel.
        </p>
      </div>
      {linkedClinics.length ? (
        <label className="block text-xs font-bold text-slate-600 mt-3">
          {multipleClinics ? 'Clínica destinataria' : 'Tu clínica'}
          {multipleClinics ? (
            <select
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800"
              value={composeClinicId}
              onChange={(e) => setSelectedClinicId(e.target.value)}
              disabled={Boolean(replyClinicLockedId)}
              aria-label="Seleccionar clínica destinataria"
              required
            >
              <option value="">Selecciona una clínica…</option>
              {linkedClinics.map((c) => (
                <option key={c.id} value={c.id}>
                  {clinicLabel(c)}
                  {c.isPrimary ? ' (principal)' : ''}
                </option>
              ))}
            </select>
          ) : (
            <p className="mt-1 flex items-center gap-2 rounded-lg border border-teal-100 bg-white px-3 py-2 text-sm font-semibold text-teal-950 m-0">
              <Building2 className="h-4 w-4 text-teal-700 shrink-0" aria-hidden />
              {selectedClinic ? clinicLabel(selectedClinic) : 'Clínica asociada'}
            </p>
          )}
          {replyClinicLockedId ? (
            <span className="block mt-1 text-[0.7rem] font-normal text-slate-500">
              Respondiendo en el hilo de esta clínica.
            </span>
          ) : null}
        </label>
      ) : (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mt-3 m-0">
          No hay ninguna clínica asociada a tu cuenta. Contacta con recepción para vincular tu perfil.
        </p>
      )}
      <label className="block text-xs font-bold text-slate-600 mt-3">
        Asunto
        <input
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          value={viewerMessage ? `Re: ${viewerMessage.message.subject}` : composeSubject}
          onChange={(e) => setComposeSubject(e.target.value)}
          disabled={Boolean(viewerMessage)}
          aria-label="Asunto del mensaje"
        />
      </label>
      <textarea
        ref={replyRef}
        className="pmsg-compose__input mt-2"
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        onFocus={() => setReplyOpen(true)}
        placeholder="Escribe tu mensaje para la clínica…"
        rows={4}
        aria-label="Mensaje para la clínica"
      />
      <div className="pmsg-templates">
        {REPLY_TEMPLATES.map((t) => (
          <button key={t} type="button" className="pmsg-template" onClick={() => setReply(t)}>
            {t}
          </button>
        ))}
      </div>
      <div className="pmsg-reply__foot">
        <button type="button" className="pmsg-btn pmsg-btn--outline" onClick={() => fileInputRef.current?.click()}>
          <Paperclip className="h-3.5 w-3.5" aria-hidden />
          Adjuntar archivo
        </button>
        {attachName ? <span className="pmsg-attach-name">{attachName}</span> : null}
        <button
          type="button"
          className={`pmsg-btn pmsg-btn--primary${sendOk ? ' pmsg-btn--success' : ''}`}
          disabled={sending || !composeClinicId || !linkedClinics.length}
          onClick={() => void sendReply()}
        >
          {sendOk ? <Check className="h-4 w-4" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
          {sending ? 'Enviando…' : 'Enviar a la clínica'}
        </button>
      </div>
    </section>
  );

  const showEmpty = views.length === 0;
  const showNoResults = !showEmpty && filtered.length === 0;

  const contextBanner = urlParams.get('informe')
    ? { text: 'Respondiendo en contexto de un informe clínico.', backHref: '/paciente/informes', backLabel: 'Volver a informes' }
    : urlParams.get('factura')
      ? { text: 'Respondiendo en contexto de una factura.', backHref: '/paciente/facturas', backLabel: 'Volver a facturas' }
      : urlParams.get('documento')
        ? { text: 'Respondiendo en contexto de un documento.', backHref: '/paciente/documentos', backLabel: 'Volver a documentos' }
        : urlParams.get('cita')
          ? { text: 'Respondiendo en contexto de una cita.', backHref: '/paciente/citas', backLabel: 'Volver a mis citas' }
          : urlParams.get('consentimiento')
            ? {
                text: 'Respondiendo en contexto de un consentimiento.',
                backHref: '/paciente/consentimientos',
                backLabel: 'Volver a consentimientos'
              }
            : null;

  return (
    <div className={`pmsg-page${viewerMessage ? ' pmsg-page--viewer-open' : ''}`}>
      {contextBanner ? (
        <div className="banner-alert flex flex-wrap items-center justify-between gap-2 mb-3">
          <span>{contextBanner.text}</span>
          <span className="text-xs font-bold text-teal-800 underline">
            {contextBanner.backLabel}
          </span>
        </div>
      ) : null}

      <header className="pmsg-header">
        <h2>Mensajes</h2>
        <p>Consulta comunicaciones de tu clínica, recordatorios, confirmaciones y respuestas del equipo.</p>
        <div className="pmsg-security">
          <div>
            <Shield className="inline h-4 w-4 text-teal-700 mr-1" aria-hidden />
            <strong className="text-[0.78rem] text-teal-900">Mensajería segura</strong>
            <p className="m-0 text-[0.72rem] text-slate-600">Tus mensajes solo son visibles para ti y tu clínica.</p>
          </div>
          <span className="prt-private-badge">
            <Lock className="h-3 w-3" aria-hidden />
            Acceso privado
          </span>
        </div>
      </header>

      {composeBlock}

      {!showEmpty ? (
        <div className="pmsg-kpis">
          <KpiStat label="Mensajes totales" value={kpis.total} delay={0} numeric />
          <KpiStat label="Sin leer" value={kpis.unread} delay={50} numeric />
          <KpiStat label="Recordatorios" value={kpis.recordatorios} delay={100} numeric />
          <KpiStat label="Confirmaciones" value={kpis.confirmaciones} delay={150} numeric />
          <KpiStat label="Mensajes de clínica" value={kpis.clinica} delay={200} numeric />
        </div>
      ) : null}

      {multipleClinics && !showEmpty ? (
        <div className="pmsg-clinic-filter mb-3 flex flex-wrap items-end gap-3">
          <label className="text-xs font-bold text-slate-600 min-w-[12rem] flex-1">
            Filtrar bandeja por clínica
            <select
              className="mt-1 w-full max-w-md rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={inboxClinicFilter}
              onChange={(e) => setInboxClinicFilter(e.target.value)}
              aria-label="Filtrar mensajes por clínica"
            >
              <option value="">Todas mis clínicas</option>
              {linkedClinics.map((c) => (
                <option key={c.id} value={c.id}>
                  {clinicLabel(c)}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}

      {!showEmpty ? (
        <div className="pmsg-toolbar">
          <label className="pmsg-search">
            <Search className="h-4 w-4 text-slate-400 shrink-0" aria-hidden />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por asunto, clínica, cita, factura o documento…"
              aria-label="Buscar mensajes"
            />
          </label>
          <div className="pmsg-toolbar__row">
            <div className="pmsg-chips" role="tablist">
              {CHIPS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="tab"
                  aria-selected={chip === c.id}
                  className={`pmsg-chip${chip === c.id ? ' pmsg-chip--active' : ''}`}
                  onClick={() => setChip(c.id)}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <div className="pmsg-sort">
              <select value={sort} onChange={(e) => setSort(e.target.value as PatientMessageSort)} aria-label="Ordenar">
                <option value="recent">Ordenar por: más recientes</option>
                <option value="oldest">Ordenar por: más antiguos</option>
              </select>
            </div>
          </div>
        </div>
      ) : null}

      {showEmpty ? (
        <section className="pmsg-empty">
          <div className="pmsg-empty__illus">
            <Mail className="h-9 w-9 text-teal-700" aria-hidden />
          </div>
          <h3>No tienes mensajes todavía</h3>
          <p>
            Cuando tu clínica confirme citas, comparta documentos, emita facturas o te envíe recordatorios, aparecerán
            aquí.
          </p>
          <div className="pmsg-empty__actions">
            <button type="button" className="pmsg-btn pmsg-btn--outline" onClick={contactClinic}>
              Contactar clínica
            </button>
<p className="panel-hint text-sm text-slate-500 m-0">Usa el menú lateral del portal para abrir otras secciones.</p>
          </div>
        </section>
      ) : (
        <div className="pmsg-list-wrap">
            <h3 className="pmsg-list-title">Bandeja</h3>
          {showNoResults ? (
            <p className="pmsg-no-results">No hay mensajes que coincidan con tu búsqueda o filtros.</p>
          ) : (
            <div className="pmsg-list">
              {filtered.map((v, i) => (
                <article
                  key={v.message.id}
                  className={`pmsg-card${viewerId === v.message.id ? ' pmsg-card--active' : ''}${!v.message.read ? ' pmsg-card--unread' : ''}`}
                  style={{ animationDelay: `${i * 45}ms` }}
                >
                  <div className="pmsg-card__head">
                    <h4>{v.message.subject}</h4>
                    <div className="pmsg-card__badges">
                      <span className={`pmsg-type ${typeClass(v.displayType)}`}>{v.typeLabel}</span>
                      <span className={`pmsg-read ${v.message.read ? 'pmsg-read--read' : 'pmsg-read--new'}`}>
                        {v.statusReadLabel}
                      </span>
                    </div>
                  </div>
                  <p className="pmsg-card__meta">
                    {v.clinicName} · {v.dateLabel}
                  </p>
                  <p className="pmsg-card__preview">
                    {v.message.fromPatient ? <span className="font-semibold text-teal-800">Tú: </span> : null}
                    {v.preview}
                  </p>
                  {v.relatedLabel !== '—' ? (
                    <p className="pmsg-card__related">
                      <span>{v.relatedLabel}</span>
                    </p>
                  ) : null}
                  <div className="pmsg-card__actions">
                    <button type="button" className="pmsg-btn pmsg-btn--primary" onClick={() => openViewer(v)}>
                      <Eye className="h-3.5 w-3.5" aria-hidden />
                      Ver mensaje
                    </button>
                    {v.message.appointmentId ? (
                      <span className="pmsg-btn pmsg-btn--outline no-underline" onClick={(e) => e.stopPropagation()}
                      >
                        <Calendar className="h-3.5 w-3.5" aria-hidden />
                        Ver cita
                      </span>
                    ) : null}
                    {v.message.invoiceId ? (
                      <span className="pmsg-btn pmsg-btn--outline no-underline" onClick={(e) => e.stopPropagation()}
                      >
                        <Receipt className="h-3.5 w-3.5" aria-hidden />
                        Ver factura
                      </span>
                    ) : null}
                    {v.message.documentId ? (
                      <span className="pmsg-btn pmsg-btn--outline no-underline" onClick={(e) => e.stopPropagation()}
                      >
                        <FileText className="h-3.5 w-3.5" aria-hidden />
                        Ver documento
                      </span>
                    ) : null}
                    {v.canDownloadPdf ? (
                      <button
                        type="button"
                        className="pmsg-btn pmsg-btn--outline"
                        disabled={downloadingId === v.message.id}
                        onClick={(e) => void downloadPdf(v, e)}
                      >
                        <Download className="h-3.5 w-3.5" aria-hidden />
                        Descargar PDF
                      </button>
                    ) : null}
                    {!v.message.read ? (
                      <button type="button" className="pmsg-btn pmsg-btn--ghost" onClick={(e) => markRead(v, e)}>
                        Marcar como leído
                      </button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        className="sr-only"
        accept=".pdf,image/*,.txt"
        onChange={(e) => void onAttach(e.target.files?.[0] ?? null)}
      />

      {viewerMessage ? (
        <PatientMessageViewer
          view={viewerMessage}
          downloading={downloadingId === viewerMessage.message.id}
          reply={reply}
          attachName={attachName}
          sending={sending}
          sendOk={sendOk}
          onClose={() => setViewerId(null)}
          onDownload={() => void downloadPdf(viewerMessage)}
          onMarkRead={() => markRead(viewerMessage)}
          onArchive={() => archiveMessage(viewerMessage)}
          onReplyChange={setReply}
          onSendReply={() => void sendReply()}
          onAttachClick={() => fileInputRef.current?.click()}
          onTemplate={(t) => {
            setReply(t);
            setReplyOpen(true);
          }}
          initialTab={openReplyTabFromUrl && reply.trim() ? 'reply' : 'message'}
        />
      ) : null}

      <div className="pmsg-privacy">
        <h4>Privacidad</h4>
        <p>Los mensajes solo están disponibles para tu usuario y tu clínica. Otros pacientes no pueden consultarlos.</p>
        <div className="prt-privacy-badges">
          <span>
            <Shield className="h-3 w-3" aria-hidden />
            Datos privados
          </span>
          <span>
            <Lock className="h-3 w-3" aria-hidden />
            Portal seguro
          </span>
          <span>
            <Sparkles className="h-3 w-3" aria-hidden />
            Comunicación segura
          </span>
        </div>
      </div>
    </div>
  );
}

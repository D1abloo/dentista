import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Archive,
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
  Sparkles,
  X
} from 'lucide-react';
import { useCountUp } from '@/hooks/useCountUp';
import { usePatientUrlParams } from '@/hooks/usePatientUrlParams';
import { useDemoStore } from '@/hooks/useDemoStore';
import { useNotice } from '@/hooks/useNotice';
import { usePatient } from '@/hooks/usePatient';
import { logPortalAudit, usePortalAccess } from '@/hooks/usePortalAccess';
import { saveDemoFile } from '@/lib/demoFiles';
import { addMessage, saveMessage } from '@/lib/demoStore';
import { isClientDemoMode } from '@/lib/appMode';
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

export function PatientMessages() {
  const { state, commit } = useDemoStore();
  const patient = usePatient();
  const { setNotice } = useNotice();
  const portalAccess = usePortalAccess();
  const replyRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [q, setQ] = useState('');
  const [chip, setChip] = useState<MessageChip>('all');
  const [sort, setSort] = useState<PatientMessageSort>('recent');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [replyOpen, setReplyOpen] = useState(false);
  const [attachName, setAttachName] = useState<string | null>(null);
  const [attachRef, setAttachRef] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sendOk, setSendOk] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const urlParams = usePatientUrlParams();

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

  const views = useMemo(() => enrichPatientMessages(state, baseMessages), [state, baseMessages]);

  const kpis = useMemo(() => buildMessageKpis(baseMessages), [baseMessages]);

  const filtered = useMemo(() => filterAndSortMessages(views, { q, chip, sort }), [views, q, chip, sort]);

  const selected = useMemo(
    () => filtered.find((v) => v.message.id === selectedId) ?? views.find((v) => v.message.id === selectedId) ?? null,
    [filtered, views, selectedId]
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

  useEffect(() => {
    if (!selectedId && filtered[0]) setSelectedId(filtered[0].message.id);
    if (selectedId && !filtered.some((v) => v.message.id === selectedId) && filtered[0]) {
      setSelectedId(filtered[0].message.id);
    }
  }, [filtered, selectedId]);

  const openDetail = useCallback(
    (v: PatientMessageView) => {
      setSelectedId(v.message.id);
      if (portalAccess.active) {
        void logPortalAudit({
          eventType: 'other',
          pagePath: '/paciente/mensajes',
          resourceLabel: v.message.subject,
          resourceId: v.message.id
        });
      }
    },
    [portalAccess.active]
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
    if (selectedId === v.message.id) setSelectedId(null);
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
    setReplyOpen(true);
    replyRef.current?.focus();
    if (!selected && filtered[0]) openDetail(filtered[0]);
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
    const body = reply.trim();
    if (!body) {
      setNotice({ type: 'error', message: 'Escribe un mensaje antes de enviar.' });
      return;
    }
    const tenantId = selected?.message.tenantId ?? state.clinics.find((c) => c.id === patient.preferredClinicId)?.tenantId;
    if (!tenantId) {
      setNotice({ type: 'error', message: 'No se pudo enviar el mensaje.' });
      return;
    }
    setSending(true);
    setSendOk(false);
    try {
      if (!isClientDemoMode()) {
        const clinic = state.clinics.find((c) => c.tenantId === tenantId);
        if (!clinic) throw new Error('clinic');
        const res = await fetch('/api/records/message', {
          method: 'POST',
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            clinicId: clinic.id,
            patientId: patient.id,
            subject: selected ? `Re: ${selected.message.subject}` : 'Mensaje del paciente',
            body,
            channel: 'app',
            type: 'clinica'
          })
        });
        if (!res.ok) throw new Error('api');
      } else {
        commit(
          addMessage(state, {
            tenantId,
            patientId: patient.id,
            subject: selected ? `Re: ${selected.message.subject}` : 'Mensaje del paciente',
            body,
            channel: 'app',
            type: 'clinica',
            read: true,
            fromPatient: true,
            sentAt: new Date().toISOString(),
            attachmentRef: attachRef ?? undefined,
            attachmentName: attachName ?? undefined
          })
        );
      }
      setReply('');
      setAttachName(null);
      setAttachRef(null);
      setSendOk(true);
      setTimeout(() => setSendOk(false), 2000);
      setNotice({ type: 'ok', message: 'Mensaje enviado correctamente.' });
      if (portalAccess.active) {
        void logPortalAudit({
          eventType: 'other',
          pagePath: '/paciente/mensajes',
          resourceLabel: 'Respuesta enviada a clínica'
        });
      }
    } catch {
      setNotice({ type: 'error', message: 'No se pudo enviar el mensaje.' });
    } finally {
      setSending(false);
    }
  }

  const showEmpty = views.length === 0;
  const showNoResults = !showEmpty && filtered.length === 0;

  function viewDetail(e: React.MouseEvent, v: PatientMessageView) {
    e.stopPropagation();
    openDetail(v);
  }

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
    <div className="pmsg-page">
      {contextBanner ? (
        <div className="banner-alert flex flex-wrap items-center justify-between gap-2 mb-3">
          <span>{contextBanner.text}</span>
          <a href={contextBanner.backHref} className="text-xs font-bold text-teal-800 underline">
            {contextBanner.backLabel}
          </a>
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

      {!showEmpty ? (
        <div className="pmsg-kpis">
          <KpiStat label="Mensajes totales" value={kpis.total} delay={0} numeric />
          <KpiStat label="Sin leer" value={kpis.unread} delay={50} numeric />
          <KpiStat label="Recordatorios" value={kpis.recordatorios} delay={100} numeric />
          <KpiStat label="Confirmaciones" value={kpis.confirmaciones} delay={150} numeric />
          <KpiStat label="Mensajes de clínica" value={kpis.clinica} delay={200} numeric />
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
            <a href="/paciente/reservar" className="pmsg-btn pmsg-btn--primary no-underline">
              Reservar cita
            </a>
          </div>
          <div className={`pmsg-reply pmsg-reply--empty${replyOpen ? ' pmsg-reply--open' : ''}`}>
            <h4>Responder a la clínica</h4>
            <textarea
              ref={replyRef}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onFocus={() => setReplyOpen(true)}
              placeholder="Escribe tu respuesta…"
              rows={3}
            />
            <div className="pmsg-templates">
              {REPLY_TEMPLATES.map((t) => (
                <button key={t} type="button" className="pmsg-template" onClick={() => setReply(t)}>
                  {t}
                </button>
              ))}
            </div>
            <div className="pmsg-reply__foot">
              <input
                ref={fileInputRef}
                type="file"
                className="sr-only"
                accept=".pdf,image/*,.txt"
                onChange={(e) => void onAttach(e.target.files?.[0] ?? null)}
              />
              <button type="button" className="pmsg-btn pmsg-btn--outline" onClick={() => fileInputRef.current?.click()}>
                <Paperclip className="h-3.5 w-3.5" aria-hidden />
                Adjuntar archivo
              </button>
              {attachName ? <span className="pmsg-attach-name">{attachName}</span> : null}
              <button
                type="button"
                className={`pmsg-btn pmsg-btn--primary${sendOk ? ' pmsg-btn--success' : ''}`}
                disabled={sending}
                onClick={() => void sendReply()}
              >
                {sendOk ? <Check className="h-4 w-4" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
                {sending ? 'Enviando…' : 'Enviar mensaje'}
              </button>
            </div>
          </div>
        </section>
      ) : (
        <div className="pmsg-layout">
          <div className="pmsg-inbox">
            <h3 className="pmsg-list-title">Bandeja</h3>
            {showNoResults ? (
              <p className="pmsg-no-results">No hay mensajes que coincidan con tu búsqueda o filtros.</p>
            ) : (
              filtered.map((v, i) => (
                <article
                  key={v.message.id}
                  className={`pmsg-card${selectedId === v.message.id ? ' pmsg-card--active' : ''}${!v.message.read ? ' pmsg-card--unread' : ''}`}
                  style={{ animationDelay: `${i * 45}ms` }}
                  onClick={() => openDetail(v)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') openDetail(v);
                  }}
                  role="button"
                  tabIndex={0}
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
                  <p className="pmsg-card__preview">{v.preview}</p>
                  {v.relatedLabel !== '—' ? (
                    <p className="pmsg-card__related">
                      <span>{v.relatedLabel}</span>
                    </p>
                  ) : null}
                  <div className="pmsg-card__actions">
                    <button type="button" className="pmsg-btn pmsg-btn--primary" onClick={(e) => viewDetail(e, v)}>
                      <Eye className="h-3.5 w-3.5" aria-hidden />
                      Ver mensaje
                    </button>
                    {v.message.appointmentId ? (
                      <a
                        href={appointmentLink(v.message.appointmentId)}
                        className="pmsg-btn pmsg-btn--outline no-underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Calendar className="h-3.5 w-3.5" aria-hidden />
                        Ver cita
                      </a>
                    ) : null}
                    {v.message.invoiceId ? (
                      <a
                        href={`/paciente/facturas?factura=${encodeURIComponent(v.message.invoiceId)}`}
                        className="pmsg-btn pmsg-btn--outline no-underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Receipt className="h-3.5 w-3.5" aria-hidden />
                        Ver factura
                      </a>
                    ) : null}
                    {v.message.documentId ? (
                      <a
                        href={documentLink(state, v.message.documentId)}
                        className="pmsg-btn pmsg-btn--outline no-underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FileText className="h-3.5 w-3.5" aria-hidden />
                        Ver documento
                      </a>
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
              ))
            )}
          </div>

          {selected ? (
            <>
              <div className="pmsg-detail__backdrop" onClick={() => setSelectedId(null)} aria-hidden />
              <aside className="pmsg-detail">
                <div className="pmsg-detail__top">
                  <h3>Detalle del mensaje</h3>
                  <button
                    type="button"
                    className="pmsg-btn pmsg-btn--outline pmsg-detail__close"
                    onClick={() => setSelectedId(null)}
                    aria-label="Cerrar"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="pmsg-detail__subject">{selected.message.subject}</p>
                <dl className="pmsg-detail__fields">
                  <div>
                    <dt>Clínica</dt>
                    <dd>{selected.clinicName}</dd>
                  </div>
                  <div>
                    <dt>Tipo</dt>
                    <dd>
                      <span className={`pmsg-type ${typeClass(selected.displayType)}`}>{selected.typeLabel}</span>
                    </dd>
                  </div>
                  <div>
                    <dt>Fecha</dt>
                    <dd>{selected.dateLabel}</dd>
                  </div>
                  <div>
                    <dt>Estado</dt>
                    <dd>{selected.statusReadLabel}</dd>
                  </div>
                  {selected.relatedLabel !== '—' ? (
                    <div>
                      <dt>Recurso relacionado</dt>
                      <dd>{selected.relatedLabel}</dd>
                    </div>
                  ) : null}
                </dl>
                <div className="pmsg-detail__body">{selected.message.body}</div>
                <div className="pmsg-detail__actions">
                  {selected.message.appointmentId ? (
                    <a href={appointmentLink(selected.message.appointmentId)} className="pmsg-btn pmsg-btn--primary w-full no-underline">
                      Ver cita
                    </a>
                  ) : null}
                  {selected.message.invoiceId ? (
                    <a
                      href={`/paciente/facturas?factura=${encodeURIComponent(selected.message.invoiceId)}`}
                      className="pmsg-btn pmsg-btn--outline w-full no-underline"
                    >
                      Ver factura
                    </a>
                  ) : null}
                  {selected.message.documentId ? (
                    <a href={documentLink(state, selected.message.documentId)} className="pmsg-btn pmsg-btn--outline w-full no-underline">
                      Ver documento
                    </a>
                  ) : null}
                  {selected.canDownloadPdf ? (
                    <button
                      type="button"
                      className="pmsg-btn pmsg-btn--outline w-full"
                      disabled={downloadingId === selected.message.id}
                      onClick={() => void downloadPdf(selected)}
                    >
                      <Download className="h-4 w-4" aria-hidden />
                      Descargar PDF
                    </button>
                  ) : null}
                  {!selected.message.read ? (
                    <button type="button" className="pmsg-btn pmsg-btn--outline w-full" onClick={() => markRead(selected)}>
                      Marcar como leído
                    </button>
                  ) : null}
                  <button type="button" className="pmsg-btn pmsg-btn--ghost w-full" onClick={() => archiveMessage(selected)}>
                    <Archive className="h-4 w-4" aria-hidden />
                    Archivar mensaje
                  </button>
                </div>

                <section className={`pmsg-reply${replyOpen ? ' pmsg-reply--open' : ''}`}>
                  <h4>Responder a la clínica</h4>
                  <label className="pmsg-field">
                    <span>Mensaje</span>
                    <textarea
                      ref={replyRef}
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      onFocus={() => setReplyOpen(true)}
                      placeholder="Escribe tu respuesta…"
                      rows={4}
                    />
                  </label>
                  <div className="pmsg-templates">
                    {REPLY_TEMPLATES.map((t) => (
                      <button key={t} type="button" className="pmsg-template" onClick={() => setReply(t)}>
                        {t}
                      </button>
                    ))}
                  </div>
                  <div className="pmsg-reply__foot">
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="sr-only"
                      accept=".pdf,image/*,.txt"
                      onChange={(e) => void onAttach(e.target.files?.[0] ?? null)}
                    />
                    <button type="button" className="pmsg-btn pmsg-btn--outline" onClick={() => fileInputRef.current?.click()}>
                      <Paperclip className="h-3.5 w-3.5" aria-hidden />
                      Adjuntar archivo
                    </button>
                    {attachName ? <span className="pmsg-attach-name">{attachName}</span> : null}
                    <button
                      type="button"
                      className={`pmsg-btn pmsg-btn--primary${sendOk ? ' pmsg-btn--success' : ''}`}
                      disabled={sending}
                      onClick={() => void sendReply()}
                    >
                      {sendOk ? <Check className="h-4 w-4" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
                      {sending ? 'Enviando…' : 'Enviar mensaje'}
                    </button>
                  </div>
                </section>
              </aside>
            </>
          ) : null}
        </div>
      )}

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

import { useEffect, useMemo, useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { isClientDemoMode, modeCopy } from '@/lib/appMode';
import { addMessage, saveMessage } from '@/lib/demoStore';
import { fmtDate, todayIso } from '@/lib/format';
import { formatMessageDate } from '@/lib/patient/messagesData';
import { useDemoStore } from '@/hooks/useDemoStore';
import { useNotice } from '@/hooks/useNotice';
import type { Message, Patient } from '@/types/demo';
import { Button, Field, Input, Textarea } from '@/components/ui';

function sortMessages(list: Message[]) {
  return [...list].sort((a, b) => b.sentAt.localeCompare(a.sentAt));
}

export function PatientMessageThread({
  patient,
  focusMessageId
}: {
  patient: Patient;
  focusMessageId?: string | null;
}) {
  const { state, commit, refresh } = useDemoStore();
  const { setNotice } = useNotice();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const thread = useMemo(
    () => sortMessages(state.messages.filter((m) => m.patientId === patient.id && !m.archived)),
    [state.messages, patient.id]
  );

  const unreadFromPatient = useMemo(
    () => thread.filter((m) => m.fromPatient && !m.read),
    [thread]
  );

  useEffect(() => {
    if (!unreadFromPatient.length) return;
    let next = state;
    for (const m of unreadFromPatient) {
      next = saveMessage(next, { ...m, read: true });
    }
    commit(next);
    if (!isClientDemoMode() && patient.preferredClinicId) {
      void fetch('/api/records/messages/read', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          clinicId: patient.preferredClinicId,
          messageIds: unreadFromPatient.map((m) => m.id)
        })
      }).catch(() => undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mark once when opening thread
  }, [patient.id]);

  useEffect(() => {
    if (!focusMessageId) return;
    const el = document.getElementById(`admin-msg-${focusMessageId}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [focusMessageId, thread.length]);

  async function sendReply() {
    if (!subject.trim() || !body.trim()) {
      setNotice({ type: 'error', message: 'Completa asunto y mensaje.' });
      return;
    }
    const clinicId = patient.preferredClinicId ?? state.clinics[0]?.id;
    if (!clinicId) {
      setNotice({ type: 'error', message: 'Sin clínica asignada al paciente.' });
      return;
    }
    setSending(true);
    try {
      if (!isClientDemoMode()) {
        const res = await fetch('/api/records/message', {
          method: 'POST',
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            clinicId,
            patientId: patient.id,
            subject: subject.trim(),
            body: body.trim(),
            type: 'clinica',
            channel: 'app',
            fromPatient: false
          })
        });
        if (!res.ok) throw new Error('api');
        await refresh();
      } else {
        commit(
          addMessage(state, {
            patientId: patient.id,
            subject: subject.trim(),
            body: body.trim(),
            type: 'clinica',
            channel: 'app',
            read: false,
            fromPatient: false,
            sentAt: todayIso()
          })
        );
      }
      setSubject('');
      setBody('');
      setNotice({
        type: 'ok',
        message: modeCopy('Respuesta enviada al portal del paciente.', 'Mensaje enviado al paciente.')
      });
    } catch {
      setNotice({ type: 'error', message: 'No se pudo enviar el mensaje.' });
    } finally {
      setSending(false);
    }
  }

  return (
    <section id="mensajes" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h3 className="m-0 flex items-center gap-2 text-base font-extrabold text-slate-900">
          <MessageSquare className="h-5 w-5 text-teal-700" aria-hidden />
          Conversación con el paciente
        </h3>
        {unreadFromPatient.length ? (
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-900">
            {unreadFromPatient.length} sin leer
          </span>
        ) : null}
      </div>
      <p className="text-sm text-slate-600 m-0 mb-4">
        Los mensajes que envía desde <strong>Mensajes</strong> en su portal aparecen aquí. Responde para que los vea
        en su bandeja.
      </p>

      {thread.length ? (
        <ul className="space-y-3 max-h-[min(420px,50vh)] overflow-y-auto mb-4 pr-1">
          {thread.map((m) => (
            <li
              key={m.id}
              id={`admin-msg-${m.id}`}
              className={`rounded-xl px-3 py-2.5 text-sm ${
                m.fromPatient
                  ? 'bg-teal-50 border border-teal-100 ml-0 mr-8'
                  : 'bg-slate-50 border border-slate-100 ml-8 mr-0'
              }${focusMessageId === m.id ? ' ring-2 ring-teal-400' : ''}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                <strong className="text-slate-900">{m.subject}</strong>
                <span className="text-[0.7rem] font-bold uppercase tracking-wide text-slate-500">
                  {m.fromPatient ? 'Paciente' : 'Clínica'} ·{' '}
                  {m.sentAt.includes('T') ? formatMessageDate(m.sentAt) : fmtDate(m.sentAt)}
                </span>
              </div>
              <p className="m-0 text-slate-700 whitespace-pre-wrap">{m.body}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500 mb-4">Aún no hay mensajes con este paciente.</p>
      )}

      <div className="grid gap-3 border-t border-slate-100 pt-4">
        <Field label="Asunto">
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Respuesta de la clínica…"
          />
        </Field>
        <Field label="Mensaje">
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} placeholder="Escribe tu respuesta…" />
        </Field>
        <Button disabled={sending} onClick={() => void sendReply()}>
          <Send className="h-4 w-4 mr-1" aria-hidden />
          {sending ? 'Enviando…' : 'Enviar al paciente'}
        </Button>
      </div>
    </section>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';

type ClinicUser = { id: string; full_name: string; email: string; role: string };

type LinkUserModalProps = {
  open: boolean;
  onClose: () => void;
  onLink: (profileId: string) => Promise<void>;
  linkedProfileIds: Set<string>;
};

export function LinkUserModal({ open, onClose, onLink, linkedProfileIds }: LinkUserModalProps) {
  const [users, setUsers] = useState<ClinicUser[]>([]);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    void fetch('/api/clinic/users', { credentials: 'include' })
      .then((r) => r.json())
      .then((j: { data?: { users?: ClinicUser[] } }) => setUsers(j.data?.users ?? []))
      .catch(() => setUsers([]));
  }, [open]);

  const candidates = useMemo(() => {
    const s = q.trim().toLowerCase();
    return users.filter((u) => {
      if (u.role === 'patient') return false;
      if (linkedProfileIds.has(u.id)) return false;
      if (!s) return true;
      return u.full_name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s);
    });
  }, [users, q, linkedProfileIds]);

  if (!open) return null;

  return (
    <div className="cp-modal-backdrop" role="presentation" onClick={onClose}>
      <div className="cp-modal cp-modal--narrow" role="dialog" onClick={(e) => e.stopPropagation()}>
        <header className="cp-modal__head">
          <h2>Vincular usuario existente</h2>
          <button type="button" className="cp-modal__close" onClick={onClose} aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </header>
        <input
          className="cp-search"
          placeholder="Buscar por nombre o email…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <ul className="cp-user-pick-list">
          {candidates.length ? (
            candidates.map((u) => (
              <li key={u.id}>
                <button
                  type="button"
                  className="cp-user-pick"
                  disabled={busy}
                  onClick={() => {
                    setBusy(true);
                    void onLink(u.id).finally(() => setBusy(false));
                  }}
                >
                  <strong>{u.full_name}</strong>
                  <span>
                    {u.email} · {u.role}
                  </span>
                </button>
              </li>
            ))
          ) : (
            <li className="cp-user-pick cp-user-pick--empty">No hay usuarios disponibles para vincular.</li>
          )}
        </ul>
      </div>
    </div>
  );
}

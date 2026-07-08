import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

export function Modal({
  open,
  title,
  children,
  onClose,
  footer
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-panel__head">
          <h2 id="modal-title" className="modal-panel__title">
            {title}
          </h2>
          <button type="button" onClick={onClose} className="modal-panel__close" aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="modal-panel__body">{children}</div>
        {footer ? <div className="modal-panel__footer">{footer}</div> : null}
      </div>
    </div>
  )
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  onConfirm,
  onClose
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button tone="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            tone="danger"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm font-medium text-slate-600">{message}</p>
    </Modal>
  );
}

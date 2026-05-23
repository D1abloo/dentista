import { useEffect, useRef, useState } from 'react';
import { Eraser, X } from 'lucide-react';

type SignatureDrawModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (dataUrl: string) => void;
};

export function SignatureDrawModal({ open, onClose, onSave }: SignatureDrawModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#0f2742';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    setDirty(false);
  }, [open]);

  if (!open) return null;

  function pos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height
    };
  }

  function start(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    drawing.current = true;
    const ctx = canvasRef.current?.getContext('2d');
    const p = pos(e);
    ctx?.beginPath();
    ctx?.moveTo(p.x, p.y);
  }

  function move(e: React.MouseEvent | React.TouchEvent) {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    const p = pos(e);
    ctx?.lineTo(p.x, p.y);
    ctx?.stroke();
    setDirty(true);
  }

  function end() {
    drawing.current = false;
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setDirty(false);
  }

  function save() {
    const canvas = canvasRef.current;
    if (!canvas || !dirty) return;
    onSave(canvas.toDataURL('image/png'));
    onClose();
  }

  return (
    <div className="cp-modal-backdrop" role="presentation" onClick={onClose}>
      <div className="cp-modal" role="dialog" aria-labelledby="sig-title" onClick={(e) => e.stopPropagation()}>
        <header className="cp-modal__head">
          <h2 id="sig-title">Dibujar firma</h2>
          <button type="button" className="cp-modal__close" onClick={onClose} aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </header>
        <canvas
          ref={canvasRef}
          width={560}
          height={200}
          className="cp-signature-canvas"
          onMouseDown={start}
          onMouseMove={move}
          onMouseUp={end}
          onMouseLeave={end}
          onTouchStart={start}
          onTouchMove={move}
          onTouchEnd={end}
        />
        <footer className="cp-modal__foot">
          <button type="button" className="cp-btn cp-btn--outline" onClick={clear}>
            <Eraser className="h-4 w-4" aria-hidden /> Limpiar
          </button>
          <button type="button" className="cp-btn cp-btn--primary" disabled={!dirty} onClick={save}>
            Guardar firma
          </button>
        </footer>
      </div>
    </div>
  );
}

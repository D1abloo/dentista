import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui';

type Props = {
  onSave: (dataUrl: string) => void;
  /** Se invoca cuando el lienzo está listo para firmar (tras permiso / resize). */
  onReady?: () => void;
  disabled?: boolean;
};

export function SignaturePad({ onSave, onReady, disabled }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [empty, setEmpty] = useState(true);
  const [active, setActive] = useState(false);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 8 || rect.height < 8) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.floor(rect.width);
    const h = Math.floor(rect.height);
    canvas.width = w * dpr;
    canvas.height = h * dpr;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f2742';
    onReady?.();
  }, [onReady]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    initCanvas();
    const ro = new ResizeObserver(() => initCanvas());
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [initCanvas]);

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    if (disabled) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      /* algunos navegadores rechazan capture en ciertos gestos */
    }
    drawing.current = true;
    setActive(true);
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    setEmpty(false);
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current || disabled) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const p = pos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }

  function end(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    drawing.current = false;
    setActive(false);
    try {
      canvasRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
  }

  function clear() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    initCanvas();
    setEmpty(true);
  }

  function save() {
    const canvas = canvasRef.current;
    if (!canvas || empty || disabled) return;
    onSave(canvas.toDataURL('image/png'));
  }

  return (
    <div className="sig-pad">
      <p className="sig-pad__hint">
        {active ? 'Firmando…' : 'Dibuja tu firma con el dedo o el ratón en el recuadro.'}
      </p>
      <canvas
        ref={canvasRef}
        className="sig-pad__canvas"
        aria-label="Lienzo de firma manuscrita"
        role="img"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        onPointerLeave={end}
      />
      <div className="sig-pad__actions">
        <Button type="button" tone="secondary" onClick={clear} disabled={disabled}>
          Borrar
        </Button>
        <Button type="button" onClick={save} disabled={empty || disabled}>
          Confirmar firma
        </Button>
      </div>
    </div>
  );
}


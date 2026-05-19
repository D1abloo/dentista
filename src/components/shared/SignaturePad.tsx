import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui';

export function SignaturePad({ onSave }: { onSave: (dataUrl: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [empty, setEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f2742';
  }, []);

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    drawing.current = true;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    setEmpty(false);
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const p = pos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }

  function end() {
    drawing.current = false;
  }

  function clear() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setEmpty(true);
  }

  function save() {
    const canvas = canvasRef.current;
    if (!canvas || empty) return;
    onSave(canvas.toDataURL('image/png'));
  }

  return (
    <div className="sig-pad">
      <canvas
        ref={canvasRef}
        className="sig-pad__canvas"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
      />
      <div className="sig-pad__actions">
        <Button type="button" tone="secondary" onClick={clear}>
          Borrar
        </Button>
        <Button type="button" onClick={save} disabled={empty}>
          Guardar firma
        </Button>
      </div>
    </div>
  );
}

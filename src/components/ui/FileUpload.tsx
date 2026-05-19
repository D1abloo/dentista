import { useRef, useState } from 'react';
import { FileUp, X } from 'lucide-react';
import { Button } from './Button';

type Props = {
  label: string;
  hint?: string;
  accept: string;
  required?: boolean;
  error?: string;
  file: File | null;
  onChange: (file: File | null) => void;
  previewUrl?: string | null;
};

export function FileUpload({ label, hint, accept, required, error, file, onChange, previewUrl }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  function pick(f: File | null) {
    onChange(f);
  }

  return (
    <div className="file-upload">
      <label className="text-sm font-bold text-slate-700">
        {label}
        {required ? <span className="text-rose-600"> *</span> : null}
      </label>
      {hint ? <p className="mt-1 text-xs font-medium text-slate-500">{hint}</p> : null}
      <div
        className={`file-upload__zone mt-2 ${drag ? 'file-upload__zone--drag' : ''} ${error ? 'file-upload__zone--error' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          const f = e.dataTransfer.files?.[0];
          if (f) pick(f);
        }}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        role="button"
        tabIndex={0}
      >
        <FileUp className="h-8 w-8 text-dental-600" />
        <p className="mt-2 text-sm font-semibold text-slate-700">
          {file ? file.name : 'Arrastra un archivo o haz clic para seleccionar'}
        </p>
        <p className="text-xs text-slate-500">{accept.replace(/,/g, ' · ')}</p>
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          accept={accept}
          onChange={(e) => pick(e.target.files?.[0] ?? null)}
        />
      </div>
      {previewUrl && file && /\.(jpe?g|png|webp|gif)$/i.test(file.name) ? (
        <img src={previewUrl} alt="" className="mt-3 max-h-40 rounded-xl border border-slate-200 object-contain" />
      ) : null}
      {file ? (
        <Button
          type="button"
          tone="ghost"
          className="mt-2 !text-xs"
          onClick={(e) => {
            e.stopPropagation();
            pick(null);
            if (inputRef.current) inputRef.current.value = '';
          }}
        >
          <X className="mr-1 inline h-3 w-3" /> Quitar archivo
        </Button>
      ) : null}
      {error ? <p className="mt-1 text-xs font-bold text-rose-600">{error}</p> : null}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { Button, Field } from '@/components/ui';
import { useNotice } from '@/hooks/useNotice';
import { settingsFor, saveSettings } from '@/lib/demoStore';
import { useDemoStore } from '@/hooks/useDemoStore';
import { useTenant } from '@/hooks/useTenant';

const MAX_BYTES = 400_000;

export function ClinicLogoUpload() {
  const { state, commit } = useDemoStore();
  const scope = useTenant();
  const { setNotice } = useNotice();
  const settings = settingsFor(state, scope.tenantId);
  const [preview, setPreview] = useState(settings.logoUrl ?? '/brand/dentista-logo.svg');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    void fetch('/api/clinic/branding', { credentials: 'include' })
      .then((r) => r.json())
      .then((j: { data?: { logoUrl?: string | null } }) => {
        if (j.data?.logoUrl) setPreview(j.data.logoUrl);
      })
      .catch(() => undefined);
  }, []);

  async function onFile(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setNotice({ type: 'error', message: 'Solo imágenes PNG, JPG o WebP.' });
      return;
    }
    if (file.size > MAX_BYTES) {
      setNotice({ type: 'error', message: 'Máximo 400 KB. Comprime la imagen e inténtalo de nuevo.' });
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
        reader.readAsDataURL(file);
      });
      const res = await fetch('/api/clinic/branding', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ logoDataUrl: dataUrl })
      });
      const json = (await res.json()) as { data?: { logoUrl?: string }; error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message ?? 'Error al subir');
      const url = json.data?.logoUrl ?? dataUrl;
      setPreview(url);
      commit(saveSettings(state, scope.tenantId, { ...settings, logoUrl: url }));
      setNotice({ type: 'ok', message: 'Logo guardado. Se muestra en la barra lateral.' });
    } catch (e) {
      setNotice({ type: 'error', message: e instanceof Error ? e.message : 'No se pudo subir el logo.' });
    } finally {
      setUploading(false);
    }
  }

  async function clearLogo() {
    setUploading(true);
    try {
      const res = await fetch('/api/clinic/branding', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ clear: true })
      });
      if (!res.ok) throw new Error('No se pudo quitar el logo.');
      const fallback = '/brand/dentista-logo.svg';
      setPreview(fallback);
      commit(saveSettings(state, scope.tenantId, { ...settings, logoUrl: fallback }));
      setNotice({ type: 'ok', message: 'Logo eliminado.' });
    } catch (e) {
      setNotice({ type: 'error', message: e instanceof Error ? e.message : 'Error.' });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="clinic-logo-upload">
      <div className="clinic-logo-upload__preview">
        <img src={preview} alt="Logo de la clínica" width={80} height={80} />
      </div>
      <div className="clinic-logo-upload__actions">
        <Field label="Logo de la clínica (sidebar y facturas)">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            disabled={uploading}
            onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
          />
          <p className="mt-1 text-xs text-slate-500">PNG/JPG/WebP, máx. 400 KB. Fondo transparente recomendado.</p>
        </Field>
        <div className="flex flex-wrap gap-2">
          <label className="btn btn--outline btn--sm cursor-pointer">
            <ImagePlus className="h-4 w-4" />
            {uploading ? 'Subiendo…' : 'Elegir imagen'}
            <input
              type="file"
              className="sr-only"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              disabled={uploading}
              onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <Button className="btn--outline btn--sm" onClick={() => void clearLogo()} disabled={uploading}>
            <Trash2 className="h-4 w-4" /> Quitar
          </Button>
        </div>
      </div>
    </div>
  );
}

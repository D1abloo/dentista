import { isClientDemoMode } from '@/lib/appMode';
import { saveDemoFile } from '@/lib/demoFiles';
import { saveDentist } from '@/lib/demoStore';
import type { DemoState, Dentist } from '@/types/demo';

const MAX_BYTES = 2_000_000;

export function validateProfessionalPhotoFile(file: File): string | null {
  if (file.size > MAX_BYTES) return 'El archivo supera 2 MB.';
  if (!/^image\/(png|jpeg|jpg|webp|svg\+xml)$/i.test(file.type) && !file.name.match(/\.(png|jpe?g|webp|svg)$/i)) {
    return 'Formato no válido. Usa PNG, JPG o WebP.';
  }
  return null;
}

export async function uploadProfessionalPhoto(
  state: DemoState,
  dentist: Dentist,
  file: File,
  opts?: { clinicId?: string; refresh?: () => Promise<void> }
): Promise<Dentist> {
  const err = validateProfessionalPhotoFile(file);
  if (err) throw new Error(err);

  const ref = await saveDemoFile(file);
  const patched: Dentist = {
    ...dentist,
    photoRef: ref,
    photoName: file.name,
    updatedAt: new Date().toISOString()
  };

  if (!isClientDemoMode() && opts?.clinicId) {
    const res = await fetch('/api/clinic/clinical-professionals', {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        clinicId: opts.clinicId,
        dentistId: dentist.id,
        photoRef: ref,
        fullName: patched.fullName,
        specialty: patched.specialty,
        email: patched.email,
        phone: patched.phone
      })
    });
    const json = (await res.json()) as { error?: { message?: string } };
    if (!res.ok) throw new Error(json.error?.message ?? 'No se pudo guardar la foto.');
    await opts.refresh?.();
    return patched;
  }

  const nextState = saveDentist(state, patched);
  return nextState.dentists.find((d) => d.id === dentist.id) ?? patched;
}

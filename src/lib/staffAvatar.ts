import { getStoredTenantId } from '@/lib/demoStore';

const AVATAR_KEY = 'dentista_staff_avatar';

const MAX_BYTES = 400_000;

function readMap(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(AVATAR_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function writeMap(map: Record<string, string>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AVATAR_KEY, JSON.stringify(map));
}

export function getStaffAvatarUrl(tenantId = getStoredTenantId()): string | null {
  const url = readMap()[tenantId];
  return url && url.startsWith('data:image/') ? url : null;
}

export function saveStaffAvatarUrl(dataUrl: string, tenantId = getStoredTenantId()) {
  const map = readMap();
  map[tenantId] = dataUrl;
  writeMap(map);
}

export function clearStaffAvatarUrl(tenantId = getStoredTenantId()) {
  const map = readMap();
  delete map[tenantId];
  writeMap(map);
}

export async function fileToAvatarDataUrl(file: File): Promise<string> {
  const ok = file.type.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(file.name);
  if (!ok) throw new Error('Usa una imagen PNG, JPG o WebP.');
  if (file.size > MAX_BYTES) throw new Error('La imagen supera 400 KB.');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    reader.readAsDataURL(file);
  });
}

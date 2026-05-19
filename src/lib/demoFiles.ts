import { STORAGE_FILES } from '@/lib/storage/fileKeys';

export type StoredFile = {
  id: string;
  name: string;
  mimeType: string;
  dataUrl: string;
  size: number;
  createdAt: string;
};

type FileStore = Record<string, StoredFile>;

function loadStore(): FileStore {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_FILES);
    return raw ? (JSON.parse(raw) as FileStore) : {};
  } catch {
    return {};
  }
}

function saveStore(store: FileStore) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_FILES, JSON.stringify(store));
}

export function saveDemoFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > 4_500_000) {
      reject(new Error('El archivo supera el límite demo de 4,5 MB.'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result ?? '');
      const id = `FILE-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const store = loadStore();
      store[id] = {
        id,
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        dataUrl,
        size: file.size,
        createdAt: new Date().toISOString()
      };
      saveStore(store);
      resolve(id);
    };
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.readAsDataURL(file);
  });
}

export function getDemoFile(fileRef: string): StoredFile | null {
  return loadStore()[fileRef] ?? null;
}

export function downloadDemoFileRef(fileRef: string, fallbackName?: string) {
  const f = getDemoFile(fileRef);
  if (!f || typeof window === 'undefined') return false;
  const a = document.createElement('a');
  a.href = f.dataUrl;
  a.download = fallbackName ?? f.name;
  a.click();
  return true;
}

export function openDemoFilePreview(fileRef: string) {
  const f = getDemoFile(fileRef);
  if (!f || typeof window === 'undefined') return;
  window.open(f.dataUrl, '_blank', 'noopener,noreferrer');
}

export function isPdfMime(mime?: string, name?: string) {
  if (mime === 'application/pdf') return true;
  return Boolean(name?.toLowerCase().endsWith('.pdf'));
}

export function isImageMime(mime?: string, name?: string) {
  if (mime?.startsWith('image/')) return true;
  const n = name?.toLowerCase() ?? '';
  return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].some((ext) => n.endsWith(ext));
}

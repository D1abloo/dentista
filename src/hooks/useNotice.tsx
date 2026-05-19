import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Notice } from '@/types/app';

const Ctx = createContext<{
  notice: Notice;
  setNotice: (n: Notice) => void;
  clear: () => void;
} | null>(null);

export function NoticeProvider({ children }: { children: ReactNode }) {
  const [notice, setNotice] = useState<Notice>(null);
  return <Ctx.Provider value={{ notice, setNotice, clear: () => setNotice(null) }}>{children}</Ctx.Provider>;
}

export function useNotice() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useNotice debe usarse dentro de NoticeProvider');
  return ctx;
}

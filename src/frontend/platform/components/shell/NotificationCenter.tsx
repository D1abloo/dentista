import { Bell } from 'lucide-react'
import { Button } from '@/frontend/ds'

export const NotificationCenter = () => (
  <Button variant="ghost" size="sm" aria-label="Notificaciones (3 sin leer)" className="relative">
    <Bell className="h-4 w-4" aria-hidden />
    <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-60" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-600" />
    </span>
  </Button>
)

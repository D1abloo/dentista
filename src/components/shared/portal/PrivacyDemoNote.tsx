import { Shield } from 'lucide-react';

export function PrivacyDemoNote({ compact = false }: { compact?: boolean }) {
  return (
    <aside className={`portal-privacy ${compact ? 'portal-privacy--compact' : ''}`}>
      <Shield className="h-4 w-4 shrink-0 text-dental-700" aria-hidden />
      <p className="text-sm font-medium text-slate-700">
        <strong className="text-dental-900">Privacidad demo:</strong> el paciente solo ve registros con su{' '}
        <code className="rounded bg-white/80 px-1 text-xs">patientId</code>. Documentos solo-admin e informes no visibles no aparecen en el portal.
        En producción, <strong>Supabase RLS</strong> debe reforzar estas reglas en backend.
      </p>
    </aside>
  );
}

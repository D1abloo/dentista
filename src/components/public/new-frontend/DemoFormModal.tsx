import { X } from 'lucide-react'
import { ProAccessForm, type ProPlan } from '@/components/public/ProAccessForm'

type Props = {
  open: boolean
  plan: ProPlan
  onPlanChange: (plan: ProPlan) => void
  onClose: () => void
}

export function DemoFormModal({ open, plan, onPlanChange, onClose }: Props) {
  if (!open) return null

  return (
    <div className="ac-demo-modal" role="dialog" aria-modal="true" aria-labelledby="ac-demo-title">
      <button type="button" className="ac-demo-modal__backdrop" onClick={onClose} aria-label="Cerrar modal" />
      <div className="ac-demo-modal__panel">
        <button type="button" className="ac-demo-modal__close" onClick={onClose} aria-label="Cerrar">
          <X className="h-5 w-5" />
        </button>
        <h2 id="ac-demo-title">Solicitar demo</h2>
        <p>Te mostramos AgendaClinic con tu flujo real de clínica, roles y agenda.</p>
        <ProAccessForm plan={plan} onPlanChange={onPlanChange} compact />
      </div>
    </div>
  )
}

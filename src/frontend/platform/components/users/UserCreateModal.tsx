import { useState } from 'react'
import { Modal, Input, Button, Alert } from '@/frontend/ds'
import { createUser } from '../../api/usersApi'

export const UserCreateModal = ({
  open,
  onClose,
  onCreated
}: {
  open: boolean
  onClose: () => void
  onCreated: () => void
}) => {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [accessType, setAccessType] = useState<'patient_portal' | 'clinic_panel'>('patient_portal')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    setError(null)
    if (!fullName.trim() || !email.trim()) {
      setError('Completa nombre y correo.')
      return
    }
    setBusy(true)
    try {
      await createUser({
        fullName: fullName.trim(),
        email: email.trim(),
        clinicId: 'a0e9a6b1-4c2d-4a1f-9b3e-000000000001',
        accessType,
        role: accessType === 'patient_portal' ? 'patient' : 'receptionist',
        userType: accessType === 'patient_portal' ? 'patient' : 'staff',
        sendEmail: true
      })
      onCreated()
      onClose()
      setFullName('')
      setEmail('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear el usuario')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Añadir usuario">
      <div className="space-y-4">
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <Input id="new-user-name" label="Nombre completo" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <Input id="new-user-email" label="Correo electrónico" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <div>
          <label htmlFor="new-user-access" className="mb-1.5 block text-sm font-medium text-slate-700">
            Tipo de acceso
          </label>
          <select
            id="new-user-access"
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
            value={accessType}
            onChange={(e) => setAccessType(e.target.value as typeof accessType)}
          >
            <option value="patient_portal">Portal paciente</option>
            <option value="clinic_panel">Panel clínica</option>
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button onClick={() => void handleSubmit()} loading={busy}>
            Crear usuario
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export function required(value: string, label: string) {
  if (!value?.trim()) return `${label} es obligatorio.`;
  return undefined;
}

export function email(value: string) {
  if (!value.trim()) return 'El email es obligatorio.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Introduce un email válido.';
  return undefined;
}

export function phone(value: string) {
  if (!value.trim()) return 'El teléfono es obligatorio.';
  if (value.replace(/\D/g, '').length < 9) return 'Introduce un teléfono válido.';
  return undefined;
}

export function positiveAmount(value: number, label = 'Importe') {
  if (!Number.isFinite(value) || value <= 0) return `${label} debe ser mayor que 0.`;
  return undefined;
}

/** Valida que el número de colegiado esté informado (no placeholder). */
export function isCollegiateNumberValid(value?: string | null): boolean {
  const n = value?.trim() ?? '';
  if (!n) return false;
  if (/\[.*colegiado/i.test(n)) return false;
  return n.length >= 3;
}

export function collegiateRequiredMessage(honorific = 'El profesional'): string {
  return `${honorific} debe tener un número de colegiado registrado. Complétalo en Dr/Dra del panel o al dar de alta al usuario.`;
}

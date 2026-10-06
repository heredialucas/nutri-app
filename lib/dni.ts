/**
 * Utilidades para normalizar y validar DNI (Argentina).
 * Se guarda siempre en dígitos, sin puntos ni espacios, para poder
 * usarlo como identificador de login y para búsquedas confiables.
 */

export function normalizeDni(value: string | null | undefined): string {
  if (!value) return "";
  return String(value).replace(/\D/g, "");
}

export function isValidDni(value: string | null | undefined): boolean {
  const digits = normalizeDni(value);
  return digits.length >= 7 && digits.length <= 8;
}

export function formatDni(value: string | null | undefined): string {
  const digits = normalizeDni(value);
  if (!digits) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

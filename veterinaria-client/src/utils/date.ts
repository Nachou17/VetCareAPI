// ======================================================
// src/utils/date.ts
// Utilidades de formato de fechas locales (evita desfases UTC de toISOString)
// ======================================================

/**
 * Retorna la fecha local en formato YYYY-MM-DD sin desfase por zona horaria.
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Retorna una fecha futura o pasada sumando o restando días a la fecha local.
 */
export function getOffsetLocalDateString(daysOffset: number, baseDate: Date = new Date()): string {
  const d = new Date(baseDate.getTime() + daysOffset * 86400000)
  return getLocalDateString(d)
}

/**
 * Retorna la fecha y hora local en formato YYYY-MM-DDTHH:mm para inputs datetime-local.
 */
export function getLocalDateTimeString(date: Date = new Date()): string {
  const dateStr = getLocalDateString(date)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${dateStr}T${hours}:${minutes}`
}

/**
 * Verifica si una fecha YYYY-MM-DD es anterior a la fecha local actual.
 */
export function isPastDate(dateStr: string): boolean {
  if (!dateStr) return false
  const today = getLocalDateString()
  return dateStr < today
}

/**
 * Verifica si una fecha y hora (YYYY-MM-DDTHH:mm) es anterior al momento local actual.
 * Permite 1 minuto de tolerancia para tiempo de llenado del formulario.
 */
export function isPastDateTime(dateTimeStr: string, gracePeriodMs = 60000): boolean {
  if (!dateTimeStr) return false
  const parsed = new Date(dateTimeStr).getTime()
  if (isNaN(parsed)) return false
  return parsed < Date.now() - gracePeriodMs
}

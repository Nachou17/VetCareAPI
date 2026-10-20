// ======================================================
// src/utils/rut.ts
// Utilidades de validación y formateo para RUT Chileno
// Algoritmo: Módulo 11
// ======================================================

/**
 * Valida un RUT chileno usando el algoritmo Módulo 11.
 * Acepta formatos: '12.345.678-K', '12345678-K', '12345678-k', etc.
 */
export function validarRutChileno(rutRaw: string): boolean {
  if (!rutRaw || typeof rutRaw !== 'string') return false

  // Formato general: números con posibles puntos, seguido de guión o sin guión y dígito verificador (0-9 o K)
  const regexFormato = /^(\d{1,2}(?:\.?\d{3}){2}-?[\dkK])$|^(\d{7,8}-?[\dkK])$/
  const trimmed = rutRaw.trim()
  if (!regexFormato.test(trimmed)) return false

  // Limpiar puntos y guiones, convertir a mayúsculas
  const limpio = trimmed.replace(/[^0-9kK]/g, '').toUpperCase()
  if (limpio.length < 8 || limpio.length > 9) return false

  const cuerpo = limpio.slice(0, -1)
  const dv = limpio.slice(-1)

  // Algoritmo Módulo 11
  let suma = 0
  let multiplo = 2

  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo.charAt(i), 10) * multiplo
    multiplo = multiplo < 7 ? multiplo + 1 : 2
  }

  const resto = suma % 11
  const dvCalculado = 11 - resto === 11 ? '0' : 11 - resto === 10 ? 'K' : String(11 - resto)

  return dv === dvCalculado
}

/**
 * Da formato estándar con puntos y guion a un RUT chileno (ej: 12.345.678-K).
 */
export function formatearRut(rutRaw: string): string {
  if (!rutRaw) return ''
  const limpio = rutRaw.replace(/[^0-9kK]/g, '').toUpperCase()
  if (limpio.length < 2) return limpio

  const cuerpo = limpio.slice(0, -1)
  const dv = limpio.slice(-1)

  const cuerpoConPuntos = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${cuerpoConPuntos}-${dv}`
}

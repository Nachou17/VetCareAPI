// ======================================================
// src/utils/pagination.ts
// Utilidades de paginación para componentes y listas
// ======================================================

import type { PagedResult } from '../types'

/**
 * Normaliza una respuesta que puede ser un arreglo directo T[] o un PagedResult<T>
 */
export function normalizePaged<T>(
  data: T[] | PagedResult<T> | undefined,
  fallbackPage = 1,
  fallbackPageSize = 10,
): PagedResult<T> {
  if (!data) {
    return {
      items: [],
      page: fallbackPage,
      pageSize: fallbackPageSize,
      totalItems: 0,
      totalPages: 0,
    }
  }

  if (Array.isArray(data)) {
    return {
      items: data,
      page: 1,
      pageSize: data.length || fallbackPageSize,
      totalItems: data.length,
      totalPages: data.length ? Math.ceil(data.length / (fallbackPageSize || 10)) : 0,
    }
  }

  return data
}

/**
 * Pagina una lista de elementos en memoria (útil tras filtrar por búsqueda)
 */
export function paginateList<T>(
  items: T[],
  page: number,
  pageSize = 8,
): {
  pagedItems: T[]
  totalPages: number
  totalItems: number
  currentPage: number
} {
  const totalItems = items.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const currentPage = Math.max(1, Math.min(page, totalPages))
  const startIndex = (currentPage - 1) * pageSize
  const pagedItems = items.slice(startIndex, startIndex + pageSize)

  return {
    pagedItems,
    totalPages,
    totalItems,
    currentPage,
  }
}

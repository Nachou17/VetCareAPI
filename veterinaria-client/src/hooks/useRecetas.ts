// ======================================================
// src/hooks/useRecetas.ts
// TanStack Query hooks para recetas médicas y sus líneas de detalle.
// ======================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { recetaService, type DetalleRecetaCreateDto } from '../services/recetaService'
import type { RecetaCreateDto } from '../types'

export const RECETAS_KEY = ['recetas'] as const
export const DETALLES_RECETAS_KEY = ['detallesReceta'] as const

export function useRecetas() {
  return useQuery({
    queryKey: RECETAS_KEY,
    queryFn: recetaService.getAll,
    staleTime: 1000 * 60,
  })
}

export function useReceta(id: number) {
  return useQuery({
    queryKey: [...RECETAS_KEY, id],
    queryFn: () => recetaService.getById(id),
    enabled: !isNaN(id) && id > 0,
  })
}

export function useDetallesReceta() {
  return useQuery({
    queryKey: DETALLES_RECETAS_KEY,
    queryFn: recetaService.getAllDetalles,
    staleTime: 1000 * 60,
  })
}

export function useCreateReceta() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: RecetaCreateDto) => recetaService.create(dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: RECETAS_KEY })
    },
  })
}

export function useAddDetalleReceta() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: DetalleRecetaCreateDto) => recetaService.addDetalle(dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: DETALLES_RECETAS_KEY })
    },
  })
}

export function useDeleteReceta() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => recetaService.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: RECETAS_KEY })
      void qc.invalidateQueries({ queryKey: DETALLES_RECETAS_KEY })
    },
  })
}

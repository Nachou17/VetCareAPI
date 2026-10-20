// ======================================================
// src/hooks/useInsumos.ts
// TanStack Query hooks para inventario e insumos.
// ======================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { insumoService } from '../services/insumoService'
import type { InsumoCreateDto } from '../types'

export const INSUMOS_KEY = ['insumos'] as const

export function useInsumos() {
  return useQuery({
    queryKey: INSUMOS_KEY,
    queryFn: insumoService.getAll,
    staleTime: 1000 * 60,
  })
}

export function useInsumo(id: number) {
  return useQuery({
    queryKey: [...INSUMOS_KEY, id],
    queryFn: () => insumoService.getById(id),
    enabled: !isNaN(id) && id > 0,
  })
}

export function useCreateInsumo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: InsumoCreateDto) => insumoService.create(dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: INSUMOS_KEY })
    },
  })
}

export function useUpdateInsumo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: InsumoCreateDto }) =>
      insumoService.update(id, dto),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: INSUMOS_KEY })
      void qc.invalidateQueries({ queryKey: [...INSUMOS_KEY, id] })
    },
  })
}

export function useDeleteInsumo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => insumoService.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: INSUMOS_KEY })
    },
  })
}

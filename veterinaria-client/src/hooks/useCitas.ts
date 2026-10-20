// ======================================================
// src/hooks/useCitas.ts
// Queries y mutaciones TanStack Query para /citas.
// ======================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { citaService } from '../services/citaService'
import type { CitaCreateDto } from '../types'

export const CITAS_KEY = ['citas'] as const

export function useCitas() {
  return useQuery({
    queryKey: CITAS_KEY,
    queryFn: citaService.getAll,
    staleTime: 1000 * 60,
  })
}

export function useCita(id: number) {
  return useQuery({
    queryKey: [...CITAS_KEY, id],
    queryFn: () => citaService.getById(id),
    enabled: !isNaN(id) && id > 0,
  })
}

export function useCreateCita() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CitaCreateDto) => citaService.create(dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: CITAS_KEY })
    },
  })
}

export function useUpdateCita() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: CitaCreateDto }) =>
      citaService.update(id, dto),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: CITAS_KEY })
      void qc.invalidateQueries({ queryKey: [...CITAS_KEY, id] })
    },
  })
}

export function useDeleteCita() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => citaService.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: CITAS_KEY })
    },
  })
}

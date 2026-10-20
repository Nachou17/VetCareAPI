// ======================================================
// src/hooks/useConsultas.ts
// Queries y mutaciones TanStack Query para /consultas.
// ======================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { consultaService } from '../services/consultaService'
import type { ConsultaCreateDto } from '../types'

export const CONSULTAS_KEY = ['consultas'] as const

export function useConsultas() {
  return useQuery({
    queryKey: CONSULTAS_KEY,
    queryFn: consultaService.getAll,
    staleTime: 1000 * 60,
  })
}

export function useConsulta(id: number) {
  return useQuery({
    queryKey: [...CONSULTAS_KEY, id],
    queryFn: () => consultaService.getById(id),
    enabled: !isNaN(id) && id > 0,
  })
}

export function useCreateConsulta() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: ConsultaCreateDto) => consultaService.create(dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: CONSULTAS_KEY })
    },
  })
}

export function useUpdateConsulta() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: ConsultaCreateDto }) =>
      consultaService.update(id, dto),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: CONSULTAS_KEY })
      void qc.invalidateQueries({ queryKey: [...CONSULTAS_KEY, id] })
    },
  })
}

export function useDeleteConsulta() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => consultaService.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: CONSULTAS_KEY })
    },
  })
}

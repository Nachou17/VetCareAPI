// ======================================================
// src/hooks/usePacientes.ts
// Queries y mutaciones TanStack Query para /pacientes.
// ======================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { pacienteService } from '../services/pacienteService'
import type { PacienteCreateDto } from '../types'

export const PACIENTES_KEY = ['pacientes'] as const

// ── Lista de pacientes ───────────────────────────────────────
export function usePacientes() {
  return useQuery({
    queryKey: PACIENTES_KEY,
    queryFn: pacienteService.getAll,
    staleTime: 1000 * 60,
  })
}

// ── Detalle de un paciente ───────────────────────────────────
export function usePaciente(id: number) {
  return useQuery({
    queryKey: [...PACIENTES_KEY, id],
    queryFn: () => pacienteService.getById(id),
    enabled: !isNaN(id) && id > 0,
  })
}

// ── Crear paciente ───────────────────────────────────────────
export function useCreatePaciente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: PacienteCreateDto) => pacienteService.create(dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: PACIENTES_KEY })
    },
  })
}

// ── Actualizar paciente ──────────────────────────────────────
export function useUpdatePaciente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: PacienteCreateDto }) =>
      pacienteService.update(id, dto),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: PACIENTES_KEY })
      void qc.invalidateQueries({ queryKey: [...PACIENTES_KEY, id] })
    },
  })
}

// ── Eliminar paciente ────────────────────────────────────────
export function useDeletePaciente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => pacienteService.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: PACIENTES_KEY })
    },
  })
}

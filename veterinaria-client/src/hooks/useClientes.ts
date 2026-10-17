// ======================================================
// src/hooks/useClientes.ts
// Queries y mutaciones TanStack Query para /clientes.
// Invalidación de caché automática tras mutaciones.
// ======================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clienteService } from '../services/clienteService'
import type { ClienteCreateDto } from '../types'

export const CLIENTES_KEY = ['clientes'] as const

// ── Lista de clientes ────────────────────────────────────────
export function useClientes() {
  return useQuery({
    queryKey: CLIENTES_KEY,
    queryFn: clienteService.getAll,
    staleTime: 1000 * 60, // 1 minuto
  })
}

// ── Detalle de un cliente ────────────────────────────────────
export function useCliente(id: number) {
  return useQuery({
    queryKey: [...CLIENTES_KEY, id],
    queryFn: () => clienteService.getById(id),
    enabled: !isNaN(id) && id > 0,
  })
}

// ── Crear cliente ────────────────────────────────────────────
export function useCreateCliente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: ClienteCreateDto) => clienteService.create(dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: CLIENTES_KEY })
    },
  })
}

// ── Actualizar cliente ───────────────────────────────────────
export function useUpdateCliente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: ClienteCreateDto }) =>
      clienteService.update(id, dto),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: CLIENTES_KEY })
      void qc.invalidateQueries({ queryKey: [...CLIENTES_KEY, id] })
    },
  })
}

// ── Eliminar cliente ─────────────────────────────────────────
export function useDeleteCliente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => clienteService.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: CLIENTES_KEY })
    },
  })
}

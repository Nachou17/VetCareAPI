// ======================================================
// src/hooks/useFacturas.ts
// TanStack Query hooks para facturación y cobros.
// ======================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { facturaService, type DetalleFacturaCreateDto } from '../services/facturaService'
import type { FacturaCreateDto } from '../types'

export const FACTURAS_KEY = ['facturas'] as const
export const DETALLES_FACTURAS_KEY = ['detallesFactura'] as const

export function useFacturas() {
  return useQuery({
    queryKey: FACTURAS_KEY,
    queryFn: facturaService.getAll,
    staleTime: 1000 * 60,
  })
}

export function useFactura(id: number) {
  return useQuery({
    queryKey: [...FACTURAS_KEY, id],
    queryFn: () => facturaService.getById(id),
    enabled: !isNaN(id) && id > 0,
  })
}

export function useDetallesFactura() {
  return useQuery({
    queryKey: DETALLES_FACTURAS_KEY,
    queryFn: facturaService.getAllDetalles,
    staleTime: 1000 * 60,
  })
}

export function useCreateFactura() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: FacturaCreateDto) => facturaService.create(dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: FACTURAS_KEY })
    },
  })
}

export function useAddDetalleFactura() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: DetalleFacturaCreateDto) => facturaService.addDetalle(dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: DETALLES_FACTURAS_KEY })
    },
  })
}

export function useDeleteFactura() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => facturaService.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: FACTURAS_KEY })
      void qc.invalidateQueries({ queryKey: DETALLES_FACTURAS_KEY })
    },
  })
}

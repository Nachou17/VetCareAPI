// ======================================================
// src/services/facturaService.ts
// Consumo de los endpoints /api/v1/facturas y /api/v1/detallefac.
// ======================================================

import { apiClient } from '../api/client'
import type { Factura, FacturaCreateDto, DetalleFactura } from '../types'

export interface DetalleFacturaCreateDto {
  facturaId: number
  consultaId?: number | null
  insumoId?: number | null
  subtotal: number
}

const BASE_FACTURAS = '/facturas'
const BASE_DETALLES = '/detallefac'

export const facturaService = {
  async getAll(): Promise<Factura[]> {
    const { data } = await apiClient.get<Factura[]>(BASE_FACTURAS)
    return data
  },

  async getById(id: number): Promise<Factura> {
    const { data } = await apiClient.get<Factura>(`${BASE_FACTURAS}/${id}`)
    return data
  },

  async create(dto: FacturaCreateDto): Promise<Factura> {
    const { data } = await apiClient.post<Factura>(BASE_FACTURAS, dto)
    return data
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete(`${BASE_FACTURAS}/${id}`)
  },

  // ── Detalles de Factura ────────────────────────────────────
  async getAllDetalles(): Promise<DetalleFactura[]> {
    const { data } = await apiClient.get<DetalleFactura[]>(BASE_DETALLES)
    return data
  },

  async addDetalle(dto: DetalleFacturaCreateDto): Promise<DetalleFactura> {
    const { data } = await apiClient.post<DetalleFactura>(BASE_DETALLES, dto)
    return data
  },
}

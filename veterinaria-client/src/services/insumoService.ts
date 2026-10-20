// ======================================================
// src/services/insumoService.ts
// Consumo del endpoint /api/v1/insumos.
// ======================================================

import { apiClient } from '../api/client'
import type { Insumo, InsumoCreateDto } from '../types'

const BASE = '/insumos'

export const insumoService = {
  async getAll(): Promise<Insumo[]> {
    const { data } = await apiClient.get<Insumo[]>(BASE)
    return data
  },

  async getById(id: number): Promise<Insumo> {
    const { data } = await apiClient.get<Insumo>(`${BASE}/${id}`)
    return data
  },

  async create(dto: InsumoCreateDto): Promise<Insumo> {
    const { data } = await apiClient.post<Insumo>(BASE, dto)
    return data
  },

  async update(id: number, dto: InsumoCreateDto): Promise<Insumo> {
    const { data } = await apiClient.put<Insumo>(`${BASE}/${id}`, dto)
    return data
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete(`${BASE}/${id}`)
  },
}

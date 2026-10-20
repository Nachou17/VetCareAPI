// ======================================================
// src/services/citaService.ts
// Consumo del endpoint /api/v1/citas.
// ======================================================

import { apiClient } from '../api/client'
import type { Cita, CitaCreateDto } from '../types'

const BASE = '/citas'

export const citaService = {
  async getAll(): Promise<Cita[]> {
    const { data } = await apiClient.get<Cita[]>(BASE)
    return data
  },

  async getById(id: number): Promise<Cita> {
    const { data } = await apiClient.get<Cita>(`${BASE}/${id}`)
    return data
  },

  async create(dto: CitaCreateDto): Promise<Cita> {
    const { data } = await apiClient.post<Cita>(BASE, dto)
    return data
  },

  async update(id: number, dto: CitaCreateDto): Promise<Cita> {
    const { data } = await apiClient.put<Cita>(`${BASE}/${id}`, dto)
    return data
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete(`${BASE}/${id}`)
  },
}

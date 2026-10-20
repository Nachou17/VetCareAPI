// ======================================================
// src/services/especialidadService.ts
// Consumo del endpoint /api/v1/especialidades.
// ======================================================

import { apiClient } from '../api/client'
import type { Especialidad } from '../types'

const BASE = '/especialidades'

export const especialidadService = {
  async getAll(): Promise<Especialidad[]> {
    const { data } = await apiClient.get<Especialidad[]>(BASE)
    return data
  },

  async create(dto: { nombre: string; costoBase: number }): Promise<Especialidad> {
    const { data } = await apiClient.post<Especialidad>(BASE, dto)
    return data
  },
}

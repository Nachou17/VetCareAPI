// ======================================================
// src/services/consultaService.ts
// Consumo del endpoint /api/v1/consultas.
// ======================================================

import { apiClient } from '../api/client'
import type { Consulta, ConsultaCreateDto } from '../types'

const BASE = '/consultas'

export const consultaService = {
  async getAll(): Promise<Consulta[]> {
    const { data } = await apiClient.get<Consulta[]>(BASE)
    return data
  },

  async getById(id: number): Promise<Consulta> {
    const { data } = await apiClient.get<Consulta>(`${BASE}/${id}`)
    return data
  },

  async create(dto: ConsultaCreateDto): Promise<Consulta> {
    const { data } = await apiClient.post<Consulta>(BASE, dto)
    return data
  },

  async update(id: number, dto: ConsultaCreateDto): Promise<Consulta> {
    const { data } = await apiClient.put<Consulta>(`${BASE}/${id}`, dto)
    return data
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete(`${BASE}/${id}`)
  },
}

// ======================================================
// src/services/recetaService.ts
// Consumo de los endpoints /api/v1/recetas y /api/v1/detallesRe.
// ======================================================

import { apiClient } from '../api/client'
import type { Receta, RecetaCreateDto, DetalleReceta } from '../types'

export interface DetalleRecetaCreateDto {
  recetaId: number
  insumoId: number
  dosis: string
  duracionDias: number
}

const BASE_RECETAS = '/recetas'
const BASE_DETALLES = '/detallesRe'

export const recetaService = {
  async getAll(): Promise<Receta[]> {
    const { data } = await apiClient.get<Receta[]>(BASE_RECETAS)
    return data
  },

  async getById(id: number): Promise<Receta> {
    const { data } = await apiClient.get<Receta>(`${BASE_RECETAS}/${id}`)
    return data
  },

  async create(dto: RecetaCreateDto): Promise<Receta> {
    const { data } = await apiClient.post<Receta>(BASE_RECETAS, dto)
    return data
  },

  async update(id: number, dto: RecetaCreateDto): Promise<Receta> {
    const { data } = await apiClient.put<Receta>(`${BASE_RECETAS}/${id}`, dto)
    return data
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete(`${BASE_RECETAS}/${id}`)
  },

  // ── Detalles de receta ──────────────────────────────────────
  async getAllDetalles(): Promise<DetalleReceta[]> {
    const { data } = await apiClient.get<DetalleReceta[]>(BASE_DETALLES)
    return data
  },

  async addDetalle(dto: DetalleRecetaCreateDto): Promise<DetalleReceta> {
    const { data } = await apiClient.post<DetalleReceta>(BASE_DETALLES, dto)
    return data
  },

  async removeDetalle(id: number): Promise<void> {
    await apiClient.delete(`${BASE_DETALLES}/${id}`)
  },
}

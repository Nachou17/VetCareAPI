// ======================================================
// src/services/usuarioService.ts
// Consumo del endpoint /api/v1/usuarios.
// ======================================================

import { apiClient } from '../api/client'
import type { UsuarioAuth, RegisterRequest } from '../types'

const BASE = '/usuarios'

export const usuarioService = {
  async getAll(): Promise<UsuarioAuth[]> {
    const { data } = await apiClient.get<UsuarioAuth[]>(BASE)
    return data
  },

  async register(dto: RegisterRequest): Promise<UsuarioAuth> {
    const { data } = await apiClient.post<UsuarioAuth>(`${BASE}/register`, dto)
    return data
  },

  async update(id: number, dto: Partial<RegisterRequest>): Promise<UsuarioAuth> {
    const { data } = await apiClient.put<UsuarioAuth>(`${BASE}/${id}`, dto)
    return data
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`${BASE}/${id}`)
  },
}

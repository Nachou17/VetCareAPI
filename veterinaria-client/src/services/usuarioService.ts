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
}

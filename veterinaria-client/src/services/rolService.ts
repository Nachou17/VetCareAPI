// ======================================================
// src/services/rolService.ts
// Consumo del endpoint /api/v1/roles.
// ======================================================

import { apiClient } from '../api/client'

export interface Rol {
  id: number
  nombre: string
  permisosEscritura: boolean
}

const BASE = '/roles'

export const rolService = {
  async getAll(): Promise<Rol[]> {
    const { data } = await apiClient.get<Rol[]>(BASE)
    return data
  },
}

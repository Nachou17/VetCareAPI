// ======================================================
// src/services/clienteService.ts
// Consumo del endpoint /api/v1/clientes.
// Ninguna URL está dispersa en componentes.
// ======================================================

import { apiClient } from '../api/client'
import type { Cliente, ClienteCreateDto, PagedResult } from '../types'

const BASE = '/clientes'

export const clienteService = {
  /** Lista todos los clientes. Requiere rol: Administrador | Veterinario | Recepcionista */
  async getAll(): Promise<Cliente[]> {
    const { data } = await apiClient.get<Cliente[]>(BASE)
    return data
  },

  /** Obtiene clientes paginados desde el servidor con orden por recencia. */
  async getPaged(page = 1, pageSize = 10, search?: string): Promise<PagedResult<Cliente>> {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
    if (search) params.append('search', search)
    const { data } = await apiClient.get<PagedResult<Cliente>>(`${BASE}?${params.toString()}`)
    return data
  },

  /** Obtiene un cliente por ID. */
  async getById(id: number): Promise<Cliente> {
    const { data } = await apiClient.get<Cliente>(`${BASE}/${id}`)
    return data
  },

  /** Crea un nuevo cliente. Requiere rol: Administrador | Veterinario */
  async create(dto: ClienteCreateDto): Promise<Cliente> {
    const { data } = await apiClient.post<Cliente>(BASE, dto)
    return data
  },

  /** Actualiza un cliente existente. Requiere rol: Administrador */
  async update(id: number, dto: ClienteCreateDto): Promise<Cliente> {
    const { data } = await apiClient.put<Cliente>(`${BASE}/${id}`, dto)
    return data
  },

  /** Elimina un cliente. Requiere rol: Administrador */
  async remove(id: number): Promise<void> {
    await apiClient.delete(`${BASE}/${id}`)
  },
}

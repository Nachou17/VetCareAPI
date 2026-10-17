// ======================================================
// src/services/pacienteService.ts
// Consumo del endpoint /api/v1/pacientes.
// ======================================================

import { apiClient } from '../api/client'
import type { Paciente, PacienteCreateDto } from '../types'

const BASE = '/pacientes'

export const pacienteService = {
  /** Lista todos los pacientes. Requiere rol: Administrador | Veterinario | Recepcionista */
  async getAll(): Promise<Paciente[]> {
    const { data } = await apiClient.get<Paciente[]>(BASE)
    return data
  },

  /** Obtiene un paciente por ID. */
  async getById(id: number): Promise<Paciente> {
    const { data } = await apiClient.get<Paciente>(`${BASE}/${id}`)
    return data
  },

  /** Crea un nuevo paciente. Requiere rol: Administrador | Veterinario */
  async create(dto: PacienteCreateDto): Promise<Paciente> {
    const { data } = await apiClient.post<Paciente>(BASE, dto)
    return data
  },

  /** Actualiza un paciente existente. Requiere rol: Administrador | Veterinario */
  async update(id: number, dto: PacienteCreateDto): Promise<Paciente> {
    const { data } = await apiClient.put<Paciente>(`${BASE}/${id}`, dto)
    return data
  },

  /** Elimina un paciente. Requiere rol: Administrador | Veterinario */
  async remove(id: number): Promise<void> {
    await apiClient.delete(`${BASE}/${id}`)
  },
}

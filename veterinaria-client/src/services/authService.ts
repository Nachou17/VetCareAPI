// ======================================================
// src/services/authService.ts
// Consumo del endpoint /usuarios — login y registro.
// ======================================================

import { apiClient } from '../api/client'
import type { LoginRequest, LoginResponse, RegisterRequest, UsuarioAuth } from '../types'
import { tokenStorage } from '../utils/token'

export const authService = {
  /** Inicia sesión, guarda el JWT y devuelve el payload del token. */
  async login(credentials: LoginRequest): Promise<string> {
    const { data } = await apiClient.post<LoginResponse>('/usuarios/login', credentials)
    if (!data?.token) {
      throw new Error('No se recibió un token de autenticación válido.')
    }
    tokenStorage.set(data.token)
    return data.token
  },

  /** Registra un nuevo usuario (solo Administrador/Veterinario). */
  async register(payload: RegisterRequest): Promise<UsuarioAuth> {
    const { data } = await apiClient.post<UsuarioAuth>('/usuarios/register', payload)
    return data
  },

  /** Cierra la sesión limpiando el token del almacenamiento. */
  logout(): void {
    tokenStorage.clear()
  },
}

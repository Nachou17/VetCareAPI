// ======================================================
// src/api/client.ts
// Cliente HTTP centralizado con Axios.
//
// OWASP mitigaciones implementadas aquí:
//  - API3:2023 Broken Object Property Level Authorization:
//    DTOs tipados evitan filtrar campos sensibles.
//  - API8:2023 Security Misconfiguration:
//    URL base leída de variables de entorno (jamás hardcodeada).
//  - Broken Authentication (robo de token):
//    Token siempre en cabecera Authorization, nunca en URL.
// ======================================================

import axios from 'axios'
import type { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { tokenStorage } from '../utils/token'
import { toastEvent } from '../utils/toast'
import type { ApiValidationError, ApiErrorResponse } from '../types'

// ── URL base leída de la variable de entorno VITE_API_URL ──
const BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:7189/api/v1'

// ── Instancia centralizada de Axios ──────────────────────────
export const apiClient = axios.create({
  baseURL: BASE_URL,
  adapter: 'fetch',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
})

// ── Interceptor de SOLICITUD: adjunta JWT si existe ──────────
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStorage.get()
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error: unknown) => Promise.reject(error),
)

// ── Interceptor de RESPUESTA: normaliza errores y maneja 401 ──
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiValidationError | ApiErrorResponse>) => {
    const status = error.response?.status
    const isLoginEndpoint = error.config?.url?.includes('/usuarios/login')

    // 401 Unauthorized → si no es login, la sesión caducó
    if (status === 401) {
      if (!isLoginEndpoint) {
        tokenStorage.clear()
        window.location.replace('/login')
      }
      return Promise.reject(error)
    }

    // 403 Forbidden → usuario autenticado pero sin permiso
    if (status === 403) {
      return Promise.reject(new Error('No tienes permiso para realizar esta acción.'))
    }

    // 409 Conflict → Violación de integridad referencial / clave foránea en base de datos
    if (status === 409) {
      const errorData = error.response?.data as { message?: string } | undefined
      const mensaje =
        errorData?.message ||
        'No es posible eliminar el registro ya que posee dependencias activas (consultas, citas, mascotas o facturas vinculadas).'

      toastEvent.show({
        title: 'Restricción de Integridad',
        message: mensaje,
        type: 'warning',
        durationMs: 5000,
      })

      return Promise.reject(new Error(mensaje))
    }

    // 422 / 400 ValidationProblem → propagar para que el formulario los muestre
    if (status === 422 || status === 400) {
      return Promise.reject(error)
    }

    // 429 Too Many Requests → rate limiting alcanzado
    if (status === 429) {
      return Promise.reject(new Error('Demasiados intentos. Por favor espera un momento.'))
    }

    // Cualquier otro error → propagar error para manejo en UI
    return Promise.reject(error)
  },
)

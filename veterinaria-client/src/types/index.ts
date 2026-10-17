// ======================================================
// src/types/index.ts
// Tipos y DTOs que reflejan el contrato exacto de la API
// VeterinariaAPI — respaldados por los modelos y endpoints
// ======================================================

// ----- Auth -----

export interface UsuarioAuth {
  id: number
  nombreCompleto: string
  email: string
  rol: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
}

export interface RegisterRequest {
  rolId: number
  nombreCompleto: string
  email: string
  password: string
}

// ----- Cliente -----

export interface Cliente {
  id: number
  documentoIdentidad: string
  nombreCompleto: string
  telefono: string | null
  email: string | null
}

export interface ClienteCreateDto {
  documentoIdentidad: string
  nombreCompleto: string
  telefono: string
  email: string
}

// ----- Paciente -----

export interface Paciente {
  id: number
  clienteId: number
  nombre: string
  especie: string
  raza: string | null
  peso: number | null
  alergias: string | null
}

export interface PacienteCreateDto {
  clienteId: number
  nombre: string
  especie: string
  raza?: string
  peso?: number
  alergias?: string
}

// ----- Errores de validación de la API (400 / 422) -----

export interface ApiFieldErrors {
  [field: string]: string[]
}

export interface ApiValidationError {
  type: string
  title: string
  status: number
  errors: ApiFieldErrors
}

export interface ApiErrorResponse {
  status: number
  error: string
  message: string
  detail?: string
}

// ----- Paginación (preparado para uso futuro) -----

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

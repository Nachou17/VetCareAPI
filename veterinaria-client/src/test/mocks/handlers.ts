// ======================================================
// src/test/mocks/handlers.ts
// Mock Service Worker (MSW) handlers para simular la API REST
// ======================================================

import { http, HttpResponse } from 'msw'
import type { Cliente, Paciente, ClienteCreateDto, PacienteCreateDto, LoginRequest, UsuarioAuth, RegisterRequest } from '../../types'

const BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:7189/api/v1'

export function createMockJwt(id: number, nombre: string, email: string, rol: string): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = btoa(
    JSON.stringify({
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier': id,
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name': nombre,
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress': email,
      'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': rol,
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
  )
  return `${header}.${payload}.mock-signature`
}

export const initialRoles = [
  { id: 1, nombre: 'Administrador', permisosEscritura: true },
  { id: 2, nombre: 'Veterinario', permisosEscritura: true },
  { id: 3, nombre: 'Recepcionista', permisosEscritura: false },
]

export const initialUsuarios: UsuarioAuth[] = [
  { id: 1, nombreCompleto: 'Dr. Carlos Mendoza (Admin)', email: 'admin@veterinaria.com', rol: 'Administrador' },
  { id: 2, nombreCompleto: 'Dra. Valentina Ríos (Veterinaria)', email: 'vet@veterinaria.com', rol: 'Veterinario' },
  { id: 3, nombreCompleto: 'Martín Soto (Recepción)', email: 'recepcion@veterinaria.com', rol: 'Recepcionista' },
  { id: 4, nombreCompleto: 'Usuario Con Citas', email: 'concitas@veterinaria.com', rol: 'Veterinario' },
]

export const initialClientes: Cliente[] = [
  {
    id: 1,
    documentoIdentidad: '12345678-9',
    nombreCompleto: 'Juan Pérez',
    telefono: '+56912345678',
    email: 'juan.perez@email.com',
  },
  {
    id: 2,
    documentoIdentidad: '98765432-1',
    nombreCompleto: 'María Gómez',
    telefono: '+56987654321',
    email: 'maria.gomez@email.com',
  },
]

export const initialPacientes: Paciente[] = [
  {
    id: 1,
    clienteId: 1,
    nombre: 'Firulais',
    especie: 'Perro',
    raza: 'Labrador',
    peso: 25.5,
    alergias: 'Ninguna',
  },
  {
    id: 2,
    clienteId: 2,
    nombre: 'Michi',
    especie: 'Gato',
    raza: 'Siamés',
    peso: 4.1,
    alergias: 'Polen',
  },
]

let mockClientes = [...initialClientes]
let mockPacientes = [...initialPacientes]
let mockUsuarios = [...initialUsuarios]

export function resetMockData() {
  mockClientes = [...initialClientes]
  mockPacientes = [...initialPacientes]
  mockUsuarios = [...initialUsuarios]
}

export const handlers = [
  // ── 1. Login ──────────────────────────────────────────────
  http.post(`${BASE_URL}/usuarios/login`, async ({ request }) => {
    const body = (await request.json()) as LoginRequest

    if (body.email === 'admin@veterinaria.com' && (body.password === 'Admin123!' || body.password === '123456')) {
      return HttpResponse.json({
        token: createMockJwt(1, 'Administrador General', 'admin@veterinaria.com', 'Administrador'),
      })
    }

    if (body.email === 'vet@veterinaria.com' && (body.password === 'Vet123!' || body.password === '123456')) {
      return HttpResponse.json({
        token: createMockJwt(2, 'Dra. María Veterinario', 'vet@veterinaria.com', 'Veterinario'),
      })
    }

    if ((body.email === 'recep@veterinaria.com' || body.email === 'recepcion@veterinaria.com') && (body.password === 'Recep123!' || body.password === '123456')) {
      return HttpResponse.json({
        token: createMockJwt(3, 'Pedro Recepcionista', 'recepcion@veterinaria.com', 'Recepcionista'),
      })
    }

    // Credenciales incorrectas
    return new HttpResponse(null, { status: 401 })
  }),

  // Fallback con regex para login
  http.post(/\/api\/v1\/usuarios\/login/, async ({ request }) => {
    const body = (await request.json()) as LoginRequest

    if (body.email === 'admin@veterinaria.com' && (body.password === 'Admin123!' || body.password === '123456')) {
      return HttpResponse.json({
        token: createMockJwt(1, 'Administrador General', 'admin@veterinaria.com', 'Administrador'),
      })
    }

    return new HttpResponse(null, { status: 401 })
  }),

  // ── 2. Clientes ───────────────────────────────────────────
  http.get(`${BASE_URL}/clientes`, () => {
    return HttpResponse.json(mockClientes)
  }),

  http.get(`${BASE_URL}/clientes/:id`, ({ params }) => {
    const id = Number(params.id)
    const cliente = mockClientes.find((c) => c.id === id)
    if (!cliente) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json(cliente)
  }),

  http.post(`${BASE_URL}/clientes`, async ({ request }) => {
    const dto = (await request.json()) as ClienteCreateDto
    const nuevo: Cliente = {
      id: mockClientes.length + 1,
      ...dto,
    }
    mockClientes.push(nuevo)
    return HttpResponse.json(nuevo, { status: 201 })
  }),

  http.put(`${BASE_URL}/clientes/:id`, async ({ params, request }) => {
    const id = Number(params.id)
    const dto = (await request.json()) as ClienteCreateDto
    const index = mockClientes.findIndex((c) => c.id === id)
    if (index === -1) return new HttpResponse(null, { status: 404 })
    mockClientes[index] = { id, ...dto }
    return HttpResponse.json(mockClientes[index])
  }),

  http.delete(`${BASE_URL}/clientes/:id`, ({ params }) => {
    const id = Number(params.id)
    const index = mockClientes.findIndex((c) => c.id === id)
    if (index === -1) return new HttpResponse(null, { status: 404 })
    mockClientes.splice(index, 1)
    return new HttpResponse(null, { status: 204 })
  }),

  // Regex fallbacks para Clientes
  http.get(/\/api\/v1\/clientes$/, () => HttpResponse.json(mockClientes)),
  http.post(/\/api\/v1\/clientes$/, async ({ request }) => {
    const dto = (await request.json()) as ClienteCreateDto
    const nuevo: Cliente = { id: mockClientes.length + 1, ...dto }
    mockClientes.push(nuevo)
    return HttpResponse.json(nuevo, { status: 201 })
  }),

  // ── 3. Pacientes ──────────────────────────────────────────
  http.get(`${BASE_URL}/pacientes`, () => {
    return HttpResponse.json(mockPacientes)
  }),

  http.get(`${BASE_URL}/pacientes/:id`, ({ params }) => {
    const id = Number(params.id)
    const paciente = mockPacientes.find((p) => p.id === id)
    if (!paciente) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json(paciente)
  }),

  http.post(`${BASE_URL}/pacientes`, async ({ request }) => {
    const dto = (await request.json()) as PacienteCreateDto
    const nuevo: Paciente = {
      id: mockPacientes.length + 1,
      clienteId: dto.clienteId,
      nombre: dto.nombre,
      especie: dto.especie,
      raza: dto.raza ?? null,
      peso: dto.peso ?? null,
      alergias: dto.alergias ?? null,
    }
    mockPacientes.push(nuevo)
    return HttpResponse.json(nuevo, { status: 201 })
  }),

  // Regex fallback para Pacientes
  http.get(/\/api\/v1\/pacientes$/, () => HttpResponse.json(mockPacientes)),

  // ── 4. Roles ──────────────────────────────────────────────
  http.get(`${BASE_URL}/roles`, () => {
    return HttpResponse.json(initialRoles)
  }),
  http.get(/\/api\/v1\/roles$/, () => HttpResponse.json(initialRoles)),

  // ── 5. Usuarios ───────────────────────────────────────────
  http.get(`${BASE_URL}/usuarios`, () => {
    return HttpResponse.json(mockUsuarios)
  }),
  http.get(/\/api\/v1\/usuarios$/, () => HttpResponse.json(mockUsuarios)),

  http.post(`${BASE_URL}/usuarios/register`, async ({ request }) => {
    const dto = (await request.json()) as RegisterRequest
    if (dto.rolId === 1) {
      return HttpResponse.json(
        { status: 400, message: 'No se permite registrar nuevos usuarios con el rol Administrador.' },
        { status: 400 },
      )
    }
    const rolNombre = initialRoles.find((r) => r.id === dto.rolId)?.nombre ?? 'Usuario'
    const nuevo: UsuarioAuth = {
      id: mockUsuarios.length + 1,
      nombreCompleto: dto.nombreCompleto,
      email: dto.email,
      rol: rolNombre,
    }
    mockUsuarios.push(nuevo)
    return HttpResponse.json(nuevo, { status: 201 })
  }),
  http.post(/\/api\/v1\/usuarios\/register$/, async ({ request }) => {
    const dto = (await request.json()) as RegisterRequest
    if (dto.rolId === 1) {
      return HttpResponse.json(
        { status: 400, message: 'No se permite registrar nuevos usuarios con el rol Administrador.' },
        { status: 400 },
      )
    }
    const rolNombre = initialRoles.find((r) => r.id === dto.rolId)?.nombre ?? 'Usuario'
    const nuevo: UsuarioAuth = {
      id: mockUsuarios.length + 1,
      nombreCompleto: dto.nombreCompleto,
      email: dto.email,
      rol: rolNombre,
    }
    mockUsuarios.push(nuevo)
    return HttpResponse.json(nuevo, { status: 201 })
  }),

  http.put(`${BASE_URL}/usuarios/:id`, async ({ request }) => {
    const dto = (await request.json()) as Partial<RegisterRequest>
    if (dto.rolId === 1) {
      return HttpResponse.json(
        { status: 400, message: 'No se permite asignar el rol Administrador a un usuario.' },
        { status: 400 },
      )
    }
    return HttpResponse.json({ id: 2, rol: 'Veterinario' })
  }),

  http.delete(`${BASE_URL}/usuarios/:id`, ({ params }) => {
    const id = Number(params.id)
    if (id === 1) {
      return HttpResponse.json(
        { status: 400, message: 'No puedes eliminar tu propia cuenta mientras estás autenticado.' },
        { status: 400 },
      )
    }
    if (id === 4) {
      return HttpResponse.json(
        {
          status: 409,
          message: 'No se puede eliminar el usuario seleccionado porque tiene registros asociados (como citas o atenciones clínicas). Conserve los registros o reasígnelos antes de eliminar.',
        },
        { status: 409 },
      )
    }
    const idx = mockUsuarios.findIndex((u) => u.id === id)
    if (idx !== -1) {
      mockUsuarios.splice(idx, 1)
    }
    return new HttpResponse(null, { status: 204 })
  }),
  http.delete(/\/api\/v1\/usuarios\/\d+$/, ({ request }) => {
    const id = Number(request.url.split('/').pop())
    if (id === 1) {
      return HttpResponse.json(
        { status: 400, message: 'No puedes eliminar tu propia cuenta mientras estás autenticado.' },
        { status: 400 },
      )
    }
    if (id === 4) {
      return HttpResponse.json(
        {
          status: 409,
          message: 'No se puede eliminar el usuario seleccionado porque tiene registros asociados (como citas o atenciones clínicas). Conserve los registros o reasígnelos antes de eliminar.',
        },
        { status: 409 },
      )
    }
    const idx = mockUsuarios.findIndex((u) => u.id === id)
    if (idx !== -1) {
      mockUsuarios.splice(idx, 1)
    }
    return new HttpResponse(null, { status: 204 })
  }),
]

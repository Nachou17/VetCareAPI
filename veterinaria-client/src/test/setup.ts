// ======================================================
// src/test/setup.ts
// Configuración global para pruebas con Vitest y Testing Library
// ======================================================

import '@testing-library/jest-dom/vitest'
import { beforeAll, afterEach, afterAll, vi } from 'vitest'
import { server } from './mocks/server'
import { resetMockData } from './mocks/handlers'

// Inicia el servidor de mock antes de todas las pruebas
beforeAll(() => {
  server.listen({ onUnhandledFrame: 'bypass' })
})

// Resetea los handlers después de cada prueba para aislar el estado
afterEach(() => {
  server.resetHandlers()
  resetMockData()
  sessionStorage.clear()
  localStorage.clear()
  vi.clearAllMocks()
})

// Cierra el servidor al terminar la suite
afterAll(() => {
  server.close()
})

// Mock para window.location.replace para evitar errores en jsdom
Object.defineProperty(window, 'location', {
  writable: true,
  value: {
    ...window.location,
    replace: vi.fn(),
    assign: vi.fn(),
    href: 'http://localhost:3000',
  },
})

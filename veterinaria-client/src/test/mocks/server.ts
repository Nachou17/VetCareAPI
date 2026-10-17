// ======================================================
// src/test/mocks/server.ts
// Configuración del servidor MSW para entorno Node/jsdom
// ======================================================

import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)

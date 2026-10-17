// ======================================================
// src/test/ProtectedRoute.test.tsx
// Pruebas de rutas protegidas y autorización por roles
// ======================================================

import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from '../routes/ProtectedRoute'
import { ForbiddenPage } from '../pages/ForbiddenPage'
import { renderWithProviders } from './test-utils'
import { tokenStorage } from '../utils/token'
import { createMockJwt } from './mocks/handlers'

describe('ProtectedRoute Guard', () => {
  it('redirige a /login cuando no existe token de autenticación', () => {
    // Asegurar que no hay sesión
    tokenStorage.clear()

    renderWithProviders(
      <Routes>
        <Route path="/login" element={<div>Vista de Login</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/admin-only" element={<div>Panel Exclusivo</div>} />
        </Route>
      </Routes>,
      { initialEntries: ['/admin-only'] },
    )

    expect(screen.getByText('Vista de Login')).toBeInTheDocument()
    expect(screen.queryByText('Panel Exclusivo')).not.toBeInTheDocument()
  })

  it('permite el acceso a la ruta si el usuario tiene el rol requerido', () => {
    // Simula sesión de Administrador
    const adminToken = createMockJwt(1, 'Admin User', 'admin@vet.com', 'Administrador')
    tokenStorage.set(adminToken)

    renderWithProviders(
      <Routes>
        <Route path="/login" element={<div>Vista de Login</div>} />
        <Route path="/forbidden" element={<ForbiddenPage />} />
        <Route element={<ProtectedRoute allowedRoles={['Administrador']} />}>
          <Route path="/admin-only" element={<div>Panel Exclusivo Administrador</div>} />
        </Route>
      </Routes>,
      { initialEntries: ['/admin-only'] },
    )

    expect(screen.getByText('Panel Exclusivo Administrador')).toBeInTheDocument()
  })

  it('redirige a /forbidden cuando el usuario tiene un rol insuficiente (ej. Recepcionista)', () => {
    // Simula sesión de Recepcionista tratando de entrar a zona de Administrador
    const recepToken = createMockJwt(2, 'Pedro Recepcionista', 'recep@vet.com', 'Recepcionista')
    tokenStorage.set(recepToken)

    renderWithProviders(
      <Routes>
        <Route path="/login" element={<div>Vista de Login</div>} />
        <Route path="/forbidden" element={<ForbiddenPage />} />
        <Route element={<ProtectedRoute allowedRoles={['Administrador']} />}>
          <Route path="/admin-only" element={<div>Panel Exclusivo Administrador</div>} />
        </Route>
      </Routes>,
      { initialEntries: ['/admin-only'] },
    )

    // Se verifica que no accede y se muestra la pantalla de Acceso Denegado
    expect(screen.queryByText('Panel Exclusivo Administrador')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Acceso Denegado/i })).toBeInTheDocument()
  })
})

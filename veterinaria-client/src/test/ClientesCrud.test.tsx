// ======================================================
// src/test/ClientesCrud.test.tsx
// Pruebas del CRUD de Clientes: listado, creación y validación Zod
// ======================================================

import { describe, it, expect, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ClientesPage } from '../pages/ClientesPage'
import { renderWithProviders } from './test-utils'
import { tokenStorage } from '../utils/token'
import { createMockJwt } from './mocks/handlers'

describe('Clientes CRUD', () => {
  beforeEach(() => {
    // Autenticar como Administrador para habilitar botones de creación
    const adminToken = createMockJwt(1, 'Admin General', 'admin@vet.com', 'Administrador')
    tokenStorage.set(adminToken)
  })

  it('lista los clientes consumiendo el mock de la API', async () => {
    renderWithProviders(<ClientesPage />)

    // Espera a que termine el estado de carga y aparezcan los clientes mockeados (presentes en vista móvil y escritorio)
    await waitFor(() => {
      expect(screen.getAllByText('Juan Pérez').length).toBeGreaterThan(0)
      expect(screen.getAllByText('María Gómez').length).toBeGreaterThan(0)
    })

    expect(screen.getAllByText('12345678-9').length).toBeGreaterThan(0)
    expect(screen.getAllByText('98765432-1').length).toBeGreaterThan(0)
  })

  it('permite abrir el formulario de nuevo cliente al presionar el botón', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ClientesPage />)

    // Espera a que cargue la vista inicial
    await waitFor(() => {
      expect(screen.getAllByText('Juan Pérez').length).toBeGreaterThan(0)
    })

    const newButton = screen.getByRole('button', { name: /nuevo cliente/i })
    await user.click(newButton)

    // Verifica que se renderiza el encabezado y campos del formulario
    expect(screen.getByRole('heading', { name: /Nuevo Cliente/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/documento de identidad/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /crear cliente/i })).toBeInTheDocument()
  })

  it('activa la validación en cliente con Zod cuando se intenta enviar campos obligatorios vacíos', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ClientesPage />)

    await waitFor(() => {
      expect(screen.getAllByText('Juan Pérez').length).toBeGreaterThan(0)
    })

    // Abrir formulario de creación
    await user.click(screen.getByRole('button', { name: /nuevo cliente/i }))

    // Intentar enviar sin rellenar datos
    const submitBtn = screen.getByRole('button', { name: /crear cliente/i })
    await user.click(submitBtn)

    // Verifica los mensajes de error provistos por el esquema clienteSchema (Zod)
    await waitFor(() => {
      expect(screen.getByText(/el documento de identidad es obligatorio/i)).toBeInTheDocument()
      expect(screen.getByText(/el nombre completo debe tener al menos 3 caracteres/i)).toBeInTheDocument()
      expect(screen.getByText(/el teléfono es obligatorio/i)).toBeInTheDocument()
      expect(screen.getByText(/el correo electrónico es obligatorio/i)).toBeInTheDocument()
    })
  })
})

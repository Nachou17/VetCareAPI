// ======================================================
// src/test/AdminUsuarios.test.tsx
// Pruebas de Gestión de Usuarios y Reglas de Negocio
// ======================================================

import { describe, it, expect, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AdminUsuariosPage } from '../pages/AdminUsuariosPage'
import { renderWithProviders } from './test-utils'
import { tokenStorage } from '../utils/token'
import { createMockJwt, resetMockData } from './mocks/handlers'

describe('Gestión de Usuarios - AdminUsuariosPage', () => {
  beforeEach(() => {
    resetMockData()
    // Autenticado como Administrador con ID = 1
    const token = createMockJwt(1, 'Dr. Carlos Mendoza (Admin)', 'admin@veterinaria.com', 'Administrador')
    tokenStorage.set(token)
  })

  it('oculta la opción Administrador del selector de roles de registro', async () => {
    renderWithProviders(<AdminUsuariosPage />)

    let options: string[] = []
    await waitFor(() => {
      const selectRol = screen.getByLabelText(/rol de acceso/i) as HTMLSelectElement
      options = Array.from(selectRol.options).map((opt) => opt.text)
      expect(options.length).toBeGreaterThan(0)
    })

    // Solo debe permitir Veterinario y Recepcionista; nunca Administrador
    expect(options).toContain('Veterinario')
    expect(options).toContain('Recepcionista')
    expect(options).not.toContain('Administrador')
  })

  it('identifica la cuenta propia del administrador y no muestra botón de eliminar para ella', async () => {
    renderWithProviders(<AdminUsuariosPage />)

    await waitFor(() => {
      expect(screen.getAllByText('Dr. Carlos Mendoza (Admin)').length).toBeGreaterThan(0)
    })

    // Debe mostrar la insignia "Tu cuenta" para la fila del administrador actual
    expect(screen.getAllByText('Tu cuenta').length).toBeGreaterThan(0)

    // No debe existir botón de eliminar para la propia cuenta
    const deleteOwnButtons = screen.queryAllByRole('button', {
      name: /eliminar cuenta de Dr\. Carlos Mendoza \(Admin\)/i,
    })
    expect(deleteOwnButtons.length).toBe(0)
  })

  it('muestra el botón de eliminar para otros usuarios y abre el modal de confirmación', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AdminUsuariosPage />)

    await waitFor(() => {
      expect(screen.getAllByText('Dra. Valentina Ríos (Veterinaria)').length).toBeGreaterThan(0)
    })

    const deleteButtons = screen.getAllByRole('button', {
      name: /eliminar cuenta de Dra\. Valentina Ríos \(Veterinaria\)/i,
    })
    expect(deleteButtons.length).toBeGreaterThan(0)

    // Clic en eliminar abre el diálogo accesible de confirmación
    await user.click(deleteButtons[0])

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /confirmar eliminación de personal/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /eliminar usuario/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument()
  })

  it('cancela la eliminación al pulsar el botón Cancelar en el diálogo', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AdminUsuariosPage />)

    await waitFor(() => {
      expect(screen.getAllByText('Dra. Valentina Ríos (Veterinaria)').length).toBeGreaterThan(0)
    })

    const deleteButtons = screen.getAllByRole('button', {
      name: /eliminar cuenta de Dra\. Valentina Ríos \(Veterinaria\)/i,
    })
    await user.click(deleteButtons[0])

    const cancelButton = screen.getByRole('button', { name: /cancelar/i })
    await user.click(cancelButton)

    // Diálogo debe cerrarse y el usuario debe seguir presente
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getAllByText('Dra. Valentina Ríos (Veterinaria)').length).toBeGreaterThan(0)
  })

  it('elimina un usuario sin dependencias al confirmar la acción en el modal', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AdminUsuariosPage />)

    await waitFor(() => {
      expect(screen.getAllByText('Martín Soto (Recepción)').length).toBeGreaterThan(0)
    })

    const deleteButtons = screen.getAllByRole('button', {
      name: /eliminar cuenta de Martín Soto \(Recepción\)/i,
    })
    await user.click(deleteButtons[0])

    const confirmButton = screen.getByRole('button', { name: /eliminar usuario/i })
    await user.click(confirmButton)

    await waitFor(() => {
      expect(screen.getByText(/eliminada exitosamente/i)).toBeInTheDocument()
    })
  })

  it('muestra mensaje de conflicto claro si el usuario tiene registros asociados (409)', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AdminUsuariosPage />)

    await waitFor(() => {
      expect(screen.getAllByText('Usuario Con Citas').length).toBeGreaterThan(0)
    })

    const deleteButtons = screen.getAllByRole('button', {
      name: /eliminar cuenta de Usuario Con Citas/i,
    })
    await user.click(deleteButtons[0])

    const confirmButton = screen.getByRole('button', { name: /eliminar usuario/i })
    await user.click(confirmButton)

    // Al recibir 409, debe mostrarse el mensaje claro de dependencia
    await waitFor(() => {
      expect(screen.getAllByText(/registros asociados/i).length).toBeGreaterThan(0)
    })
  })
})

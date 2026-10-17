// ======================================================
// src/test/Login.test.tsx
// Pruebas del flujo de inicio de sesión
// ======================================================

import { describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginPage } from '../pages/LoginPage'
import { renderWithProviders } from './test-utils'
import { tokenStorage } from '../utils/token'

describe('LoginPage', () => {
  it('renderiza correctamente el formulario con accesibilidad para lectores de pantalla', () => {
    renderWithProviders(<LoginPage />)

    expect(screen.getByRole('heading', { name: /VetCare/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument()
  })

  it('inicia sesión exitosamente con credenciales válidas y persiste el token JWT', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />, { initialEntries: ['/login'] })

    const emailInput = screen.getByLabelText(/correo electrónico/i)
    const passwordInput = screen.getByLabelText(/contraseña/i)
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i })

    await user.type(emailInput, 'admin@veterinaria.com')
    await user.type(passwordInput, 'Admin123!')
    await user.click(submitButton)

    await waitFor(() => {
      // Verifica que el token JWT haya sido guardado en el almacenamiento
      expect(tokenStorage.get()).toBeTruthy()
    })
  })

  it('muestra mensaje de error claro ante credenciales incorrectas (401) sin romper el formulario', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />, { initialEntries: ['/login'] })

    const emailInput = screen.getByLabelText(/correo electrónico/i)
    const passwordInput = screen.getByLabelText(/contraseña/i)
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i })

    await user.type(emailInput, 'invalido@veterinaria.com')
    await user.type(passwordInput, 'WrongPass123!')
    await user.click(submitButton)

    await waitFor(() => {
      const errorAlert = screen.getByRole('alert')
      expect(errorAlert).toBeInTheDocument()
      expect(errorAlert).toHaveTextContent(/incorrectos/i)
    })

    // El formulario sigue presente y usable
    expect(emailInput).toBeInTheDocument()
    expect(passwordInput).toBeInTheDocument()
  })
})

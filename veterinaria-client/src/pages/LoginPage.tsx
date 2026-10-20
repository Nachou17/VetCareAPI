// ======================================================
// src/pages/LoginPage.tsx
// Formulario de login — accesible WCAG 2.2 AA:
//   - Cada campo tiene <label> explícito
//   - Errores anunciados con aria-describedby + role="alert"
//   - Focus en el primer campo al montar
//   - Contraste > 4.5:1 con Tailwind
//   - Validación en cliente con Zod + React Hook Form
// ======================================================

import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { AxiosError } from 'axios'
import type { ApiValidationError } from '../types'

const loginSchema = z.object({
  email: z.string().min(1, 'El correo es obligatorio.').email('Ingresa un correo válido.'),
  password: z.string().min(1, 'La contraseña es obligatoria.'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginPage() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/dashboard'

  const inactivityMessage = (location.state as { message?: string })?.message

  const emailRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) })

  // Si ya está autenticado, redirige
  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true })
  }, [isAuthenticated, navigate, from])

  // Enfoca el primer campo al montar
  useEffect(() => {
    emailRef.current?.focus()
  }, [])

  async function onSubmit(values: LoginFormValues) {
    try {
      await login(values)
      navigate(from, { replace: true })
    } catch (err) {
      const axiosErr = err as AxiosError<ApiValidationError>
      if (axiosErr.response?.status === 401) {
        setError('root', { message: 'Correo o contraseña incorrectos.' })
      } else {
        setError('root', { message: 'Error al iniciar sesión. Intenta de nuevo.' })
      }
    }
  }

  const { ref: emailFormRef, ...emailRest } = register('email')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-md p-8">
        {/* Encabezado */}
        <h1 className="text-2xl font-bold text-gray-900 mb-1 text-center">🐾 VetCare</h1>
        <p className="text-sm text-gray-500 text-center mb-6">Inicia sesión para continuar</p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate aria-label="Formulario de inicio de sesión">
          {/* Notificación de sesión expirada por inactividad */}
          {inactivityMessage && (
            <div
              role="alert"
              aria-live="assertive"
              className="mb-4 p-3 bg-amber-50 border border-amber-300 text-amber-900 text-sm rounded-lg flex items-center gap-2"
            >
              <span aria-hidden="true" className="text-amber-600 font-bold">⚠️</span>
              <span className="font-medium">{inactivityMessage}</span>
            </div>
          )}

          {/* Error global (401, rate-limit, etc.) */}
          {errors.root && (
            <div role="alert" className="mb-4 p-3 bg-red-50 border border-red-300 text-red-700 text-sm rounded">
              {errors.root.message}
            </div>
          )}

          {/* Campo Email */}
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico <span aria-hidden="true" className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              aria-required="true"
              aria-describedby={errors.email ? 'email-error' : undefined}
              aria-invalid={!!errors.email}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                errors.email
                  ? 'border-red-400 focus:ring-red-400 bg-red-50'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              {...emailRest}
              ref={(e) => {
                emailFormRef(e)
                ;(emailRef as React.MutableRefObject<HTMLInputElement | null>).current = e
              }}
            />
            {errors.email && (
              <p id="email-error" role="alert" className="mt-1 text-xs text-red-600">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Campo Contraseña */}
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña <span aria-hidden="true" className="text-red-500">*</span>
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              aria-required="true"
              aria-describedby={errors.password ? 'password-error' : undefined}
              aria-invalid={!!errors.password}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                errors.password
                  ? 'border-red-400 focus:ring-red-400 bg-red-50'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              {...register('password')}
            />
            {errors.password && (
              <p id="password-error" role="alert" className="mt-1 text-xs text-red-600">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium rounded-lg text-sm transition-colors focus-visible:outline-2 focus-visible:outline-blue-800"
            aria-busy={isSubmitting}
          >
            {isSubmitting ? 'Iniciando sesión…' : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </div>
  )
}

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
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

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
    setValue,
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
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status
        if (status === 401) {
          setError('root', { message: 'Correo o contraseña incorrectos.' })
        } else if (status === 429) {
          setError('root', { message: 'Demasiados intentos fallidos. Por favor, espera un momento antes de reintentar.' })
        } else if (!err.response) {
          setError('root', { message: 'No se pudo conectar con el servidor de la veterinaria. Verifica tu conexión.' })
        } else {
          setError('root', { message: 'Error al iniciar sesión. Intenta de nuevo.' })
        }
      } else if (err instanceof Error) {
        setError('root', { message: err.message || 'Correo o contraseña incorrectos.' })
      } else {
        setError('root', { message: 'Correo o contraseña incorrectos.' })
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

        {/* Acceso Rápido para Demostración */}
        <div className="mt-6 pt-5 border-t border-gray-100 text-xs">
          <p className="font-semibold text-gray-700 mb-2">Cuentas demo (completa el correo):</p>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => {
                setValue('email', 'admin@veterinaria.com', { shouldValidate: true })
              }}
              className="px-2 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-center font-medium transition-colors border border-blue-100"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => {
                setValue('email', 'vet@veterinaria.com', { shouldValidate: true })
              }}
              className="px-2 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-center font-medium transition-colors border border-emerald-100"
            >
              Veterinario
            </button>
            <button
              type="button"
              onClick={() => {
                setValue('email', 'recepcion@veterinaria.com', { shouldValidate: true })
              }}
              className="px-2 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded text-center font-medium transition-colors border border-purple-100"
            >
              Recepción
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">Ingresa la contraseña configurada localmente.</p>
        </div>
      </div>
    </div>
  )
}

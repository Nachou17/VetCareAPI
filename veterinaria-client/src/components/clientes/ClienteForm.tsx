// ======================================================
// src/components/clientes/ClienteForm.tsx
// Formulario de creación / edición de un cliente.
// - React Hook Form + Zod (zodResolver)
// - InputField reutilizable con accesibilidad WCAG 2.2 AA
// - Errores 400/422 de la API mapeados al campo correspondiente
// - aria-live="assertive" para error global
// ======================================================

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { AxiosError } from 'axios'
import { clienteSchema, type ClienteFormValues } from '../../schemas/clienteSchema'
import type { Cliente, ApiValidationError } from '../../types'
import { InputField } from '../ui/InputField'

interface ClienteFormProps {
  initial?: Cliente
  onSubmit: (values: ClienteFormValues) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export function ClienteForm({ initial, onSubmit, onCancel, isSubmitting = false }: ClienteFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema),
    defaultValues: initial
      ? {
          documentoIdentidad: initial.documentoIdentidad,
          nombreCompleto: initial.nombreCompleto,
          telefono: initial.telefono ?? '',
          email: initial.email ?? '',
        }
      : { documentoIdentidad: '', nombreCompleto: '', telefono: '', email: '' },
  })

  useEffect(() => {
    if (initial) reset({ ...initial, telefono: initial.telefono ?? '', email: initial.email ?? '' })
  }, [initial, reset])

  async function internalSubmit(values: ClienteFormValues) {
    try {
      await onSubmit(values)
    } catch (err) {
      const axiosErr = err as AxiosError<ApiValidationError>
      const apiErrors = axiosErr.response?.data?.errors
      if (apiErrors) {
        // Mapear errores de la API a los campos del formulario
        for (const [field, messages] of Object.entries(apiErrors)) {
          const formField = field.charAt(0).toLowerCase() + field.slice(1) as keyof ClienteFormValues
          setError(formField, { message: messages[0] })
        }
      } else {
        setError('root', { message: axiosErr.message ?? 'Error al guardar el cliente.' })
      }
    }
  }

  return (
    <form
      onSubmit={handleSubmit(internalSubmit)}
      noValidate
      aria-label={initial ? 'Formulario de edición de cliente' : 'Formulario de nuevo cliente'}
      className="space-y-4"
    >
      {/* Error global de la API */}
      {errors.root && (
        <div role="alert" aria-live="assertive" className="p-3 bg-red-50 border border-red-300 text-red-700 text-sm rounded-lg">
          {errors.root.message}
        </div>
      )}

      <InputField
        id="documentoIdentidad"
        label="Documento de identidad"
        required
        maxLength={20}
        autoComplete="off"
        error={errors.documentoIdentidad?.message}
        {...register('documentoIdentidad')}
      />

      <InputField
        id="nombreCompleto"
        label="Nombre completo"
        required
        maxLength={100}
        autoComplete="name"
        error={errors.nombreCompleto?.message}
        {...register('nombreCompleto')}
      />

      <InputField
        id="telefono"
        label="Teléfono"
        required
        type="tel"
        autoComplete="tel"
        error={errors.telefono?.message}
        {...register('telefono')}
      />

      <InputField
        id="email"
        label="Correo electrónico"
        required
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />

      {/* Botones de acción */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="min-h-[44px] px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className="min-h-[44px] px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-blue-800 focus-visible:outline-none disabled:opacity-50"
        >
          {isSubmitting ? 'Guardando…' : initial ? 'Guardar cambios' : 'Crear cliente'}
        </button>
      </div>
    </form>
  )
}

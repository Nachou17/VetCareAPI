// ======================================================
// src/components/pacientes/PacienteForm.tsx
// Formulario de creación / edición de paciente.
// ======================================================

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { AxiosError } from 'axios'
import { pacienteSchema, type PacienteFormValues } from '../../schemas/pacienteSchema'
import type { Paciente, Cliente, ApiValidationError } from '../../types'
import { InputField } from '../ui/InputField'

interface PacienteFormProps {
  initial?: Paciente
  clientes: Cliente[]
  onSubmit: (values: PacienteFormValues) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export function PacienteForm({ initial, clientes, onSubmit, onCancel, isSubmitting = false }: PacienteFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<PacienteFormValues>({
    resolver: zodResolver(pacienteSchema),
    defaultValues: initial
      ? {
          clienteId: initial.clienteId,
          nombre: initial.nombre,
          especie: initial.especie,
          raza: initial.raza ?? '',
          peso: initial.peso ?? undefined,
          alergias: initial.alergias ?? '',
        }
      : { nombre: '', especie: '', raza: '', alergias: '' },
  })

  useEffect(() => {
    if (initial) {
      reset({
        clienteId: initial.clienteId,
        nombre: initial.nombre,
        especie: initial.especie,
        raza: initial.raza ?? '',
        peso: initial.peso ?? undefined,
        alergias: initial.alergias ?? '',
      })
    }
  }, [initial, reset])

  async function internalSubmit(values: PacienteFormValues) {
    try {
      await onSubmit(values)
    } catch (err) {
      const axiosErr = err as AxiosError<ApiValidationError>
      const apiErrors = axiosErr.response?.data?.errors
      if (apiErrors) {
        for (const [field, messages] of Object.entries(apiErrors)) {
          const formField = field.charAt(0).toLowerCase() + field.slice(1) as keyof PacienteFormValues
          setError(formField, { message: messages[0] })
        }
      } else {
        setError('root', { message: axiosErr.message ?? 'Error al guardar el paciente.' })
      }
    }
  }

  return (
    <form
      onSubmit={handleSubmit(internalSubmit)}
      noValidate
      aria-label={initial ? 'Formulario de edición de paciente' : 'Formulario de nuevo paciente'}
      className="space-y-4"
    >
      {errors.root && (
        <div role="alert" aria-live="assertive" className="p-3 bg-red-50 border border-red-300 text-red-700 text-sm rounded-lg">
          {errors.root.message}
        </div>
      )}

      {/* Selector de cliente */}
      <div className="flex flex-col gap-1">
        <label htmlFor="clienteId" className="text-sm font-medium text-gray-700">
          Cliente propietario <span aria-hidden="true" className="text-red-500">*</span>
        </label>
        <select
          id="clienteId"
          aria-required="true"
          aria-invalid={!!errors.clienteId}
          aria-describedby={errors.clienteId ? 'clienteId-error' : undefined}
          className={[
            'w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 bg-white min-h-[44px]',
            'focus:outline-none focus-visible:ring-2',
            errors.clienteId
              ? 'border-red-400 bg-red-50 focus-visible:ring-red-400'
              : 'border-gray-300 focus-visible:ring-blue-500',
          ].join(' ')}
          {...register('clienteId', { valueAsNumber: true })}
        >
          <option value="">— Selecciona un cliente —</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombreCompleto} ({c.documentoIdentidad})
            </option>
          ))}
        </select>
        {errors.clienteId && (
          <p id="clienteId-error" role="alert" className="text-xs text-red-600">
            ⚠ {errors.clienteId.message}
          </p>
        )}
      </div>

      <InputField id="nombre" label="Nombre del paciente" required maxLength={50} error={errors.nombre?.message} {...register('nombre')} />
      <InputField id="especie" label="Especie" required maxLength={50} error={errors.especie?.message} {...register('especie')} />
      <InputField id="raza" label="Raza" maxLength={50} error={errors.raza?.message} {...register('raza')} />
      <InputField
        id="peso"
        label="Peso (kg)"
        type="number"
        step="0.01"
        min="0"
        hint="Ej: 4.5"
        error={errors.peso?.message}
        {...register('peso', { valueAsNumber: true })}
      />
      <InputField id="alergias" label="Alergias" maxLength={250} error={errors.alergias?.message} {...register('alergias')} />

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
          {isSubmitting ? 'Guardando…' : initial ? 'Guardar cambios' : 'Crear paciente'}
        </button>
      </div>
    </form>
  )
}

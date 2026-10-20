// ======================================================
// src/components/consultas/ConsultaForm.tsx
// Formulario para registro de consultas clínicas y diagnósticos.
// ======================================================

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { AxiosError } from 'axios'
import { consultaSchema, type ConsultaFormValues } from '../../schemas/consultaSchema'
import type { Consulta, Paciente, Cita, ApiValidationError } from '../../types'

interface ConsultaFormProps {
  initial?: Consulta
  pacientes: Paciente[]
  citas: Cita[]
  onSubmit: (values: ConsultaFormValues) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export function ConsultaForm({
  initial,
  pacientes,
  citas,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: ConsultaFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ConsultaFormValues>({
    resolver: zodResolver(consultaSchema),
    defaultValues: initial
      ? {
          pacienteId: initial.pacienteId,
          citaId: initial.citaId ?? null,
          motivo: initial.motivo,
          diagnostico: initial.diagnostico ?? '',
        }
      : {
          pacienteId: pacientes[0]?.id ?? 0,
          citaId: null,
          motivo: '',
          diagnostico: '',
        },
  })

  useEffect(() => {
    if (initial) {
      reset({
        pacienteId: initial.pacienteId,
        citaId: initial.citaId ?? null,
        motivo: initial.motivo,
        diagnostico: initial.diagnostico ?? '',
      })
    }
  }, [initial, reset])

  async function internalSubmit(values: ConsultaFormValues) {
    try {
      await onSubmit(values)
    } catch (err) {
      const axiosErr = err as AxiosError<ApiValidationError>
      const apiErrors = axiosErr.response?.data?.errors
      if (apiErrors) {
        for (const [field, messages] of Object.entries(apiErrors)) {
          const formField = (field.charAt(0).toLowerCase() + field.slice(1)) as keyof ConsultaFormValues
          setError(formField, { message: messages[0] })
        }
      } else {
        setError('root', { message: axiosErr.message ?? 'Error al guardar la consulta médica.' })
      }
    }
  }

  return (
    <form
      onSubmit={handleSubmit(internalSubmit)}
      noValidate
      aria-label={initial ? 'Formulario de edición de consulta' : 'Formulario de nueva consulta médica'}
      className="space-y-4"
    >
      {errors.root && (
        <div role="alert" aria-live="assertive" className="p-3 bg-red-50 border border-red-300 text-red-700 text-sm rounded-lg">
          {errors.root.message}
        </div>
      )}

      {/* Paciente */}
      <div className="flex flex-col gap-1">
        <label htmlFor="pacienteId" className="text-sm font-medium text-gray-700">
          Paciente <span aria-hidden="true" className="text-red-500">*</span>
        </label>
        <select
          id="pacienteId"
          aria-required="true"
          aria-invalid={!!errors.pacienteId}
          aria-describedby={errors.pacienteId ? 'pacienteId-error' : undefined}
          className={`w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 bg-white min-h-[44px] focus:outline-none focus-visible:ring-2 ${
            errors.pacienteId ? 'border-red-400 bg-red-50 focus-visible:ring-red-400' : 'border-gray-300 focus-visible:ring-blue-500'
          }`}
          {...register('pacienteId', { valueAsNumber: true })}
        >
          <option value="">-- Selecciona un paciente --</option>
          {pacientes.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre} ({p.especie}{p.raza ? ` - ${p.raza}` : ''})
            </option>
          ))}
        </select>
        {errors.pacienteId && (
          <p id="pacienteId-error" role="alert" className="text-xs text-red-600">
            {errors.pacienteId.message}
          </p>
        )}
      </div>

      {/* Cita Vinculada (Opcional) */}
      <div className="flex flex-col gap-1">
        <label htmlFor="citaId" className="text-sm font-medium text-gray-700">
          Cita Asociada (Opcional)
        </label>
        <select
          id="citaId"
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 bg-white min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          {...register('citaId', {
            setValueAs: (v) => (v === '' ? null : Number(v)),
          })}
        >
          <option value="">-- Ninguna cita asociada (Consulta espontánea) --</option>
          {citas.map((c) => (
            <option key={c.id} value={c.id}>
              Cita #{c.id} - {new Date(c.fechaHora).toLocaleDateString()} ({c.estado})
            </option>
          ))}
        </select>
      </div>

      {/* Motivo de Consulta */}
      <div className="flex flex-col gap-1">
        <label htmlFor="motivo" className="text-sm font-medium text-gray-700">
          Motivo de Consulta <span aria-hidden="true" className="text-red-500">*</span>
        </label>
        <input
          id="motivo"
          type="text"
          placeholder="Ej: Control general, vacunación, decaimiento..."
          aria-required="true"
          aria-invalid={!!errors.motivo}
          aria-describedby={errors.motivo ? 'motivo-error' : undefined}
          className={`w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 bg-white min-h-[44px] focus:outline-none focus-visible:ring-2 ${
            errors.motivo ? 'border-red-400 bg-red-50 focus-visible:ring-red-400' : 'border-gray-300 focus-visible:ring-blue-500'
          }`}
          {...register('motivo')}
        />
        {errors.motivo && (
          <p id="motivo-error" role="alert" className="text-xs text-red-600">
            {errors.motivo.message}
          </p>
        )}
      </div>

      {/* Diagnóstico Clínico */}
      <div className="flex flex-col gap-1">
        <label htmlFor="diagnostico" className="text-sm font-medium text-gray-700">
          Diagnóstico y Observaciones
        </label>
        <textarea
          id="diagnostico"
          rows={3}
          placeholder="Descripción clínica detallada del examen físico y diagnóstico..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          {...register('diagnostico')}
        />
        {errors.diagnostico && (
          <p id="diagnostico-error" role="alert" className="text-xs text-red-600">
            {errors.diagnostico.message}
          </p>
        )}
      </div>

      {/* Acciones */}
      <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg min-h-[44px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2.5 text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg min-h-[44px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          {isSubmitting ? 'Guardando...' : initial ? 'Guardar Cambios' : 'Registrar Consulta'}
        </button>
      </div>
    </form>
  )
}

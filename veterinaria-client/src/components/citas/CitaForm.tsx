// ======================================================
// src/components/citas/CitaForm.tsx
// Formulario para crear o actualizar citas médicas.
// Cumple accesibilidad WCAG 2.2 AA con inputs etiquetados y foco accesible.
// ======================================================

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { AxiosError } from 'axios'
import { citaSchema, type CitaFormValues } from '../../schemas/citaSchema'
import type { Cita, Paciente, UsuarioAuth, Especialidad, ApiValidationError } from '../../types'

interface CitaFormProps {
  initial?: Cita
  pacientes: Paciente[]
  usuarios: UsuarioAuth[]
  especialidades: Especialidad[]
  onSubmit: (values: CitaFormValues) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export function CitaForm({
  initial,
  pacientes,
  usuarios,
  especialidades,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: CitaFormProps) {
  // Formatear fecha para datetime-local (YYYY-MM-DDTHH:mm)
  const formatInitialDate = (dateStr?: string) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ''
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CitaFormValues>({
    resolver: zodResolver(citaSchema),
    defaultValues: initial
      ? {
          pacienteId: initial.pacienteId,
          usuarioId: initial.usuarioId,
          especialidadId: initial.especialidadId,
          fechaHora: formatInitialDate(initial.fechaHora),
          estado: initial.estado as 'Pendiente' | 'Confirmada' | 'Cancelada' | 'Realizada',
        }
      : {
          pacienteId: pacientes[0]?.id ?? 0,
          usuarioId: usuarios[0]?.id ?? 0,
          especialidadId: especialidades[0]?.id ?? 0,
          fechaHora: '',
          estado: 'Pendiente',
        },
  })

  useEffect(() => {
    if (initial) {
      reset({
        pacienteId: initial.pacienteId,
        usuarioId: initial.usuarioId,
        especialidadId: initial.especialidadId,
        fechaHora: formatInitialDate(initial.fechaHora),
        estado: initial.estado as 'Pendiente' | 'Confirmada' | 'Cancelada' | 'Realizada',
      })
    }
  }, [initial, reset])

  async function internalSubmit(values: CitaFormValues) {
    try {
      // Normalizar fecha a ISO string
      const isoDate = new Date(values.fechaHora).toISOString()
      await onSubmit({ ...values, fechaHora: isoDate })
    } catch (err) {
      const axiosErr = err as AxiosError<ApiValidationError>
      const apiErrors = axiosErr.response?.data?.errors
      if (apiErrors) {
        for (const [field, messages] of Object.entries(apiErrors)) {
          const formField = (field.charAt(0).toLowerCase() + field.slice(1)) as keyof CitaFormValues
          setError(formField, { message: messages[0] })
        }
      } else {
        setError('root', { message: axiosErr.message ?? 'Error al agendar la cita médica.' })
      }
    }
  }

  return (
    <form
      onSubmit={handleSubmit(internalSubmit)}
      noValidate
      aria-label={initial ? 'Formulario de edición de cita' : 'Formulario de nueva cita'}
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
          <option value="">-- Selecciona una mascota --</option>
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

      {/* Veterinario */}
      <div className="flex flex-col gap-1">
        <label htmlFor="usuarioId" className="text-sm font-medium text-gray-700">
          Profesional / Veterinario <span aria-hidden="true" className="text-red-500">*</span>
        </label>
        <select
          id="usuarioId"
          aria-required="true"
          aria-invalid={!!errors.usuarioId}
          aria-describedby={errors.usuarioId ? 'usuarioId-error' : undefined}
          className={`w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 bg-white min-h-[44px] focus:outline-none focus-visible:ring-2 ${
            errors.usuarioId ? 'border-red-400 bg-red-50 focus-visible:ring-red-400' : 'border-gray-300 focus-visible:ring-blue-500'
          }`}
          {...register('usuarioId', { valueAsNumber: true })}
        >
          <option value="">-- Selecciona un profesional --</option>
          {usuarios.map((u) => (
            <option key={u.id} value={u.id}>
              {u.nombreCompleto} ({u.rol})
            </option>
          ))}
        </select>
        {errors.usuarioId && (
          <p id="usuarioId-error" role="alert" className="text-xs text-red-600">
            {errors.usuarioId.message}
          </p>
        )}
      </div>

      {/* Especialidad */}
      <div className="flex flex-col gap-1">
        <label htmlFor="especialidadId" className="text-sm font-medium text-gray-700">
          Especialidad <span aria-hidden="true" className="text-red-500">*</span>
        </label>
        <select
          id="especialidadId"
          aria-required="true"
          aria-invalid={!!errors.especialidadId}
          aria-describedby={errors.especialidadId ? 'especialidadId-error' : undefined}
          className={`w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 bg-white min-h-[44px] focus:outline-none focus-visible:ring-2 ${
            errors.especialidadId ? 'border-red-400 bg-red-50 focus-visible:ring-red-400' : 'border-gray-300 focus-visible:ring-blue-500'
          }`}
          {...register('especialidadId', { valueAsNumber: true })}
        >
          <option value="">-- Selecciona la especialidad --</option>
          {especialidades.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nombre} (${e.costoBase.toLocaleString('es-CL')})
            </option>
          ))}
        </select>
        {errors.especialidadId && (
          <p id="especialidadId-error" role="alert" className="text-xs text-red-600">
            {errors.especialidadId.message}
          </p>
        )}
      </div>

      {/* Fecha y Hora */}
      <div className="flex flex-col gap-1">
        <label htmlFor="fechaHora" className="text-sm font-medium text-gray-700">
          Fecha y Hora de la Cita <span aria-hidden="true" className="text-red-500">*</span>
        </label>
        <input
          id="fechaHora"
          type="datetime-local"
          aria-required="true"
          aria-invalid={!!errors.fechaHora}
          aria-describedby={errors.fechaHora ? 'fechaHora-error' : undefined}
          className={`w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 bg-white min-h-[44px] focus:outline-none focus-visible:ring-2 ${
            errors.fechaHora ? 'border-red-400 bg-red-50 focus-visible:ring-red-400' : 'border-gray-300 focus-visible:ring-blue-500'
          }`}
          {...register('fechaHora')}
        />
        {errors.fechaHora && (
          <p id="fechaHora-error" role="alert" className="text-xs text-red-600">
            {errors.fechaHora.message}
          </p>
        )}
      </div>

      {/* Estado */}
      <div className="flex flex-col gap-1">
        <label htmlFor="estado" className="text-sm font-medium text-gray-700">
          Estado <span aria-hidden="true" className="text-red-500">*</span>
        </label>
        <select
          id="estado"
          aria-required="true"
          aria-invalid={!!errors.estado}
          aria-describedby={errors.estado ? 'estado-error' : undefined}
          className={`w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 bg-white min-h-[44px] focus:outline-none focus-visible:ring-2 ${
            errors.estado ? 'border-red-400 bg-red-50 focus-visible:ring-red-400' : 'border-gray-300 focus-visible:ring-blue-500'
          }`}
          {...register('estado')}
        >
          <option value="Pendiente">Pendiente</option>
          <option value="Confirmada">Confirmada</option>
          <option value="Realizada">Realizada</option>
          <option value="Cancelada">Cancelada</option>
        </select>
        {errors.estado && (
          <p id="estado-error" role="alert" className="text-xs text-red-600">
            {errors.estado.message}
          </p>
        )}
      </div>

      {/* Botones de acción */}
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
          {isSubmitting ? 'Guardando...' : initial ? 'Guardar Cambios' : 'Agendar Cita'}
        </button>
      </div>
    </form>
  )
}

// ======================================================
// src/components/recetas/RecetaForm.tsx
// Formulario para emisión y prescripción de recetas médicas.
// ======================================================

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { AxiosError } from 'axios'
import { recetaSchema, type RecetaFormValues } from '../../schemas/recetaSchema'
import { getLocalDateString, getOffsetLocalDateString } from '../../utils/date'
import type { Consulta, Insumo, Paciente, ApiValidationError } from '../../types'

interface RecetaFormProps {
  consultas: Consulta[]
  insumos: Insumo[]
  pacientes: Paciente[]
  onSubmit: (values: RecetaFormValues) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export function RecetaForm({
  consultas,
  insumos,
  pacientes,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: RecetaFormProps) {
  // Fechas por defecto: hoy y +15 días en hora local (sin desfase UTC)
  const today = getLocalDateString()
  const in15Days = getOffsetLocalDateString(15)

  const pacienteMap = new Map(pacientes.map((p) => [p.id, p]))

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<RecetaFormValues>({
    resolver: zodResolver(recetaSchema),
    defaultValues: {
      consultaId: consultas[0]?.id ?? 0,
      fechaEmision: today,
      validaHasta: in15Days,
      insumoId: insumos[0]?.id ?? 0,
      dosis: '1 comprimido cada 12 horas vía oral',
      duracionDias: 7,
    },
  })

  const fechaEmisionActual = watch('fechaEmision') || today

  async function internalSubmit(values: RecetaFormValues) {
    try {
      await onSubmit(values)
    } catch (err) {
      const axiosErr = err as AxiosError<ApiValidationError>
      const apiErrors = axiosErr.response?.data?.errors
      if (apiErrors) {
        for (const [field, messages] of Object.entries(apiErrors)) {
          const formField = (field.charAt(0).toLowerCase() + field.slice(1)) as keyof RecetaFormValues
          setError(formField, { message: messages[0] })
        }
      } else {
        setError('root', { message: axiosErr.message ?? 'Error al emitir la receta médica.' })
      }
    }
  }

  return (
    <form
      onSubmit={handleSubmit(internalSubmit)}
      noValidate
      aria-label="Formulario de nueva receta médica"
      className="space-y-4"
    >
      {errors.root && (
        <div role="alert" aria-live="assertive" className="p-3 bg-red-50 border border-red-300 text-red-700 text-sm rounded-lg">
          {errors.root.message}
        </div>
      )}

      {/* Consulta Médica Asociada */}
      <div className="flex flex-col gap-1">
        <label htmlFor="consultaId" className="text-sm font-medium text-gray-700">
          Consulta Médica <span aria-hidden="true" className="text-red-500">*</span>
        </label>
        <select
          id="consultaId"
          aria-required="true"
          aria-invalid={!!errors.consultaId}
          aria-describedby={errors.consultaId ? 'consultaId-error' : undefined}
          className={`w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 bg-white min-h-[44px] focus:outline-none focus-visible:ring-2 ${
            errors.consultaId ? 'border-red-400 bg-red-50 focus-visible:ring-red-400' : 'border-gray-300 focus-visible:ring-blue-500'
          }`}
          {...register('consultaId', { valueAsNumber: true })}
        >
          <option value="">-- Selecciona una consulta clínica --</option>
          {consultas.map((c) => {
            const pac = pacienteMap.get(c.pacienteId)
            return (
              <option key={c.id} value={c.id}>
                Consulta #{c.id} - {pac ? `${pac.nombre} (${pac.especie})` : `Paciente #${c.pacienteId}`} ({c.motivo})
              </option>
            )
          })}
        </select>
        {errors.consultaId && (
          <p id="consultaId-error" role="alert" className="text-xs text-red-600">
            {errors.consultaId.message}
          </p>
        )}
      </div>

      {/* Fechas de Emisión y Validez */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="fechaEmision" className="text-sm font-medium text-gray-700">
            Fecha de Emisión <span aria-hidden="true" className="text-red-500">*</span>
          </label>
          <input
            id="fechaEmision"
            type="date"
            min={today}
            aria-required="true"
            aria-invalid={!!errors.fechaEmision}
            aria-describedby={errors.fechaEmision ? 'fechaEmision-error' : undefined}
            className={`w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 bg-white min-h-[44px] focus:outline-none focus-visible:ring-2 ${
              errors.fechaEmision ? 'border-red-400 bg-red-50 focus-visible:ring-red-400' : 'border-gray-300 focus-visible:ring-blue-500'
            }`}
            {...register('fechaEmision')}
          />
          {errors.fechaEmision && (
            <p id="fechaEmision-error" role="alert" className="text-xs text-red-600">
              {errors.fechaEmision.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="validaHasta" className="text-sm font-medium text-gray-700">
            Válida Hasta <span aria-hidden="true" className="text-red-500">*</span>
          </label>
          <input
            id="validaHasta"
            type="date"
            min={fechaEmisionActual}
            aria-required="true"
            aria-invalid={!!errors.validaHasta}
            aria-describedby={errors.validaHasta ? 'validaHasta-error' : undefined}
            className={`w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 bg-white min-h-[44px] focus:outline-none focus-visible:ring-2 ${
              errors.validaHasta ? 'border-red-400 bg-red-50 focus-visible:ring-red-400' : 'border-gray-300 focus-visible:ring-blue-500'
            }`}
            {...register('validaHasta')}
          />
          {errors.validaHasta && (
            <p id="validaHasta-error" role="alert" className="text-xs text-red-600">
              {errors.validaHasta.message}
            </p>
          )}
        </div>
      </div>

      {/* Medicamento / Insumo */}
      <div className="pt-2 border-t border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Prescripción de Fármaco</h3>

        <div className="flex flex-col gap-1">
          <label htmlFor="insumoId" className="text-sm font-medium text-gray-700">
            Medicamento / Insumo <span aria-hidden="true" className="text-red-500">*</span>
          </label>
          <select
            id="insumoId"
            aria-required="true"
            aria-invalid={!!errors.insumoId}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 bg-white min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            {...register('insumoId', { valueAsNumber: true })}
          >
            <option value="">-- Selecciona el fármaco --</option>
            {insumos.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nombreProducto} ({i.tipo}) - Stock: {i.stockActual}
              </option>
            ))}
          </select>
          {errors.insumoId && (
            <p role="alert" className="text-xs text-red-600">
              {errors.insumoId.message}
            </p>
          )}
        </div>

        {/* Dosis e Indicaciones */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
          <div className="sm:col-span-2 flex flex-col gap-1">
            <label htmlFor="dosis" className="text-sm font-medium text-gray-700">
              Dosis y Posología <span aria-hidden="true" className="text-red-500">*</span>
            </label>
            <input
              id="dosis"
              type="text"
              placeholder="Ej: 1 comprimido cada 8 horas junto a la comida"
              aria-required="true"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 bg-white min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              {...register('dosis')}
            />
            {errors.dosis && (
              <p role="alert" className="text-xs text-red-600">
                {errors.dosis.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="duracionDias" className="text-sm font-medium text-gray-700">
              Duración (Días) <span aria-hidden="true" className="text-red-500">*</span>
            </label>
            <input
              id="duracionDias"
              type="number"
              min="1"
              aria-required="true"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 bg-white min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              {...register('duracionDias', { valueAsNumber: true })}
            />
            {errors.duracionDias && (
              <p role="alert" className="text-xs text-red-600">
                {errors.duracionDias.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Botones */}
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
          {isSubmitting ? 'Emitiendo Receta...' : 'Emitir Receta Médica'}
        </button>
      </div>
    </form>
  )
}

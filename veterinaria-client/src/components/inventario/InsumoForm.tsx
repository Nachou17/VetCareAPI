// ======================================================
// src/components/inventario/InsumoForm.tsx
// Formulario para creación y edición de insumos/medicamentos.
// ======================================================

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { AxiosError } from 'axios'
import { insumoSchema, type InsumoFormValues } from '../../schemas/insumoSchema'
import type { Insumo, ApiValidationError } from '../../types'

interface InsumoFormProps {
  initial?: Insumo
  onSubmit: (values: InsumoFormValues) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

const TIPOS_INSUMO = [
  'Medicamento',
  'Vacuna',
  'Antiparasitario',
  'Material Quirúrgico',
  'Alimento / Suplemento',
  'Higiene y Cuidado',
]

export function InsumoForm({
  initial,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: InsumoFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<InsumoFormValues>({
    resolver: zodResolver(insumoSchema),
    defaultValues: initial
      ? {
          nombreProducto: initial.nombreProducto,
          tipo: initial.tipo,
          stockActual: initial.stockActual,
          precioUnitario: initial.precioUnitario,
        }
      : {
          nombreProducto: '',
          tipo: 'Medicamento',
          stockActual: 0,
          precioUnitario: 1000,
        },
  })

  useEffect(() => {
    if (initial) {
      reset({
        nombreProducto: initial.nombreProducto,
        tipo: initial.tipo,
        stockActual: initial.stockActual,
        precioUnitario: initial.precioUnitario,
      })
    }
  }, [initial, reset])

  async function internalSubmit(values: InsumoFormValues) {
    try {
      await onSubmit(values)
    } catch (err) {
      const axiosErr = err as AxiosError<ApiValidationError>
      const apiErrors = axiosErr.response?.data?.errors
      if (apiErrors) {
        for (const [field, messages] of Object.entries(apiErrors)) {
          const formField = (field.charAt(0).toLowerCase() + field.slice(1)) as keyof InsumoFormValues
          setError(formField, { message: messages[0] })
        }
      } else {
        setError('root', { message: axiosErr.message ?? 'Error al guardar el insumo.' })
      }
    }
  }

  return (
    <form
      onSubmit={handleSubmit(internalSubmit)}
      noValidate
      aria-label={initial ? 'Formulario de edición de insumo' : 'Formulario de nuevo insumo'}
      className="space-y-4"
    >
      {errors.root && (
        <div role="alert" aria-live="assertive" className="p-3 bg-red-50 border border-red-300 text-red-700 text-sm rounded-lg">
          {errors.root.message}
        </div>
      )}

      {/* Nombre del Producto */}
      <div className="flex flex-col gap-1">
        <label htmlFor="nombreProducto" className="text-sm font-medium text-gray-700">
          Nombre del Producto / Fármaco <span aria-hidden="true" className="text-red-500">*</span>
        </label>
        <input
          id="nombreProducto"
          type="text"
          placeholder="Ej: Amoxicilina 250mg, Vacuna Antirrábica..."
          aria-required="true"
          aria-invalid={!!errors.nombreProducto}
          aria-describedby={errors.nombreProducto ? 'nombreProducto-error' : undefined}
          className={`w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 bg-white min-h-[44px] focus:outline-none focus-visible:ring-2 ${
            errors.nombreProducto ? 'border-red-400 bg-red-50 focus-visible:ring-red-400' : 'border-gray-300 focus-visible:ring-blue-500'
          }`}
          {...register('nombreProducto')}
        />
        {errors.nombreProducto && (
          <p id="nombreProducto-error" role="alert" className="text-xs text-red-600">
            {errors.nombreProducto.message}
          </p>
        )}
      </div>

      {/* Tipo */}
      <div className="flex flex-col gap-1">
        <label htmlFor="tipo" className="text-sm font-medium text-gray-700">
          Categoría / Tipo de Insumo <span aria-hidden="true" className="text-red-500">*</span>
        </label>
        <select
          id="tipo"
          aria-required="true"
          aria-invalid={!!errors.tipo}
          aria-describedby={errors.tipo ? 'tipo-error' : undefined}
          className={`w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 bg-white min-h-[44px] focus:outline-none focus-visible:ring-2 ${
            errors.tipo ? 'border-red-400 bg-red-50 focus-visible:ring-red-400' : 'border-gray-300 focus-visible:ring-blue-500'
          }`}
          {...register('tipo')}
        >
          {TIPOS_INSUMO.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        {errors.tipo && (
          <p id="tipo-error" role="alert" className="text-xs text-red-600">
            {errors.tipo.message}
          </p>
        )}
      </div>

      {/* Stock y Precio en fila */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Stock Actual */}
        <div className="flex flex-col gap-1">
          <label htmlFor="stockActual" className="text-sm font-medium text-gray-700">
            Stock Disponible <span aria-hidden="true" className="text-red-500">*</span>
          </label>
          <input
            id="stockActual"
            type="number"
            min="0"
            aria-required="true"
            aria-invalid={!!errors.stockActual}
            aria-describedby={errors.stockActual ? 'stockActual-error' : undefined}
            className={`w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 bg-white min-h-[44px] focus:outline-none focus-visible:ring-2 ${
              errors.stockActual ? 'border-red-400 bg-red-50 focus-visible:ring-red-400' : 'border-gray-300 focus-visible:ring-blue-500'
            }`}
            {...register('stockActual', { valueAsNumber: true })}
          />
          {errors.stockActual && (
            <p id="stockActual-error" role="alert" className="text-xs text-red-600">
              {errors.stockActual.message}
            </p>
          )}
        </div>

        {/* Precio Unitario */}
        <div className="flex flex-col gap-1">
          <label htmlFor="precioUnitario" className="text-sm font-medium text-gray-700">
            Precio Unitario ($) <span aria-hidden="true" className="text-red-500">*</span>
          </label>
          <input
            id="precioUnitario"
            type="number"
            min="1"
            step="100"
            aria-required="true"
            aria-invalid={!!errors.precioUnitario}
            aria-describedby={errors.precioUnitario ? 'precioUnitario-error' : undefined}
            className={`w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 bg-white min-h-[44px] focus:outline-none focus-visible:ring-2 ${
              errors.precioUnitario ? 'border-red-400 bg-red-50 focus-visible:ring-red-400' : 'border-gray-300 focus-visible:ring-blue-500'
            }`}
            {...register('precioUnitario', { valueAsNumber: true })}
          />
          {errors.precioUnitario && (
            <p id="precioUnitario-error" role="alert" className="text-xs text-red-600">
              {errors.precioUnitario.message}
            </p>
          )}
        </div>
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
          {isSubmitting ? 'Guardando...' : initial ? 'Guardar Cambios' : 'Registrar Insumo'}
        </button>
      </div>
    </form>
  )
}

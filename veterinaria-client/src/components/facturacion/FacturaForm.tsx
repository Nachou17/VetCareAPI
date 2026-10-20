// ======================================================
// src/components/facturacion/FacturaForm.tsx
// Formulario para facturación con desglose automático de IVA (19%).
// ======================================================

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { AxiosError } from 'axios'
import { facturaSchema, type FacturaFormValues } from '../../schemas/facturaSchema'
import type { Cliente, Consulta, Insumo, ApiValidationError } from '../../types'

interface FacturaFormProps {
  clientes: Cliente[]
  consultas: Consulta[]
  insumos: Insumo[]
  onSubmit: (values: FacturaFormValues & { montoImpuestos: number; montoTotal: number }) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export function FacturaForm({
  clientes,
  consultas,
  insumos,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: FacturaFormProps) {
  const today = new Date().toISOString().split('T')[0]
  const [tipoCobro, setTipoCobro] = useState<'consulta' | 'insumo'>('consulta')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors },
  } = useForm<FacturaFormValues>({
    resolver: zodResolver(facturaSchema),
    defaultValues: {
      clienteId: clientes[0]?.id ?? 0,
      fechaEmision: today,
      subtotal: 25000,
      consultaId: consultas[0]?.id ?? null,
      insumoId: null,
    },
  })

  const subtotalActual = watch('subtotal') || 0
  const ivaCalculado = Math.round(subtotalActual * 0.19)
  const totalCalculado = subtotalActual + ivaCalculado

  const handleInsumoChange = (insumoId: number) => {
    const item = insumos.find((i) => i.id === insumoId)
    if (item) {
      setValue('subtotal', item.precioUnitario)
    }
  }

  async function internalSubmit(values: FacturaFormValues) {
    try {
      await onSubmit({
        ...values,
        montoImpuestos: ivaCalculado,
        montoTotal: totalCalculado,
      })
    } catch (err) {
      const axiosErr = err as AxiosError<ApiValidationError>
      const apiErrors = axiosErr.response?.data?.errors
      if (apiErrors) {
        for (const [field, messages] of Object.entries(apiErrors)) {
          const formField = (field.charAt(0).toLowerCase() + field.slice(1)) as keyof FacturaFormValues
          setError(formField, { message: messages[0] })
        }
      } else {
        setError('root', { message: axiosErr.message ?? 'Error al generar la factura.' })
      }
    }
  }

  return (
    <form
      onSubmit={handleSubmit(internalSubmit)}
      noValidate
      aria-label="Formulario de emisión de factura electrónica"
      className="space-y-4"
    >
      {errors.root && (
        <div role="alert" aria-live="assertive" className="p-3 bg-red-50 border border-red-300 text-red-700 text-sm rounded-lg">
          {errors.root.message}
        </div>
      )}

      {/* Cliente y Fecha */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="clienteId" className="text-sm font-medium text-gray-700">
            Cliente / Titular de Cobro <span aria-hidden="true" className="text-red-500">*</span>
          </label>
          <select
            id="clienteId"
            aria-required="true"
            aria-invalid={!!errors.clienteId}
            className={`w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 bg-white min-h-[44px] focus:outline-none focus-visible:ring-2 ${
              errors.clienteId ? 'border-red-400 bg-red-50 focus-visible:ring-red-400' : 'border-gray-300 focus-visible:ring-blue-500'
            }`}
            {...register('clienteId', { valueAsNumber: true })}
          >
            <option value="">-- Selecciona el cliente --</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombreCompleto} ({c.documentoIdentidad})
              </option>
            ))}
          </select>
          {errors.clienteId && (
            <p role="alert" className="text-xs text-red-600">
              {errors.clienteId.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="fechaEmision" className="text-sm font-medium text-gray-700">
            Fecha de Emisión <span aria-hidden="true" className="text-red-500">*</span>
          </label>
          <input
            id="fechaEmision"
            type="date"
            aria-required="true"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 bg-white min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            {...register('fechaEmision')}
          />
        </div>
      </div>

      {/* Selector de Tipo de Cobro */}
      <div className="flex gap-4 pt-2">
        <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-800">
          <input
            type="radio"
            name="tipoCobroRadio"
            checked={tipoCobro === 'consulta'}
            onChange={() => {
              setTipoCobro('consulta')
              setValue('insumoId', null)
              setValue('subtotal', 25000)
            }}
            className="text-blue-600 focus:ring-blue-500"
          />
          Consulta / Atención Médica
        </label>

        <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-800">
          <input
            type="radio"
            name="tipoCobroRadio"
            checked={tipoCobro === 'insumo'}
            onChange={() => {
              setTipoCobro('insumo')
              setValue('consultaId', null)
              if (insumos[0]) {
                setValue('insumoId', insumos[0].id)
                setValue('subtotal', insumos[0].precioUnitario)
              }
            }}
            className="text-blue-600 focus:ring-blue-500"
          />
          Insumo / Medicamento de Farmacia
        </label>
      </div>

      {/* Ítem Asociado */}
      {tipoCobro === 'consulta' ? (
        <div className="flex flex-col gap-1">
          <label htmlFor="consultaId" className="text-sm font-medium text-gray-700">
            Consulta Médica a Cobrar
          </label>
          <select
            id="consultaId"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 bg-white min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            {...register('consultaId', {
              setValueAs: (v) => (v === '' ? null : Number(v)),
            })}
          >
            <option value="">-- Cobro general de consulta --</option>
            {consultas.map((c) => (
              <option key={c.id} value={c.id}>
                Consulta #{c.id} ({c.motivo})
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <label htmlFor="insumoId" className="text-sm font-medium text-gray-700">
            Insumo / Producto Vendido
          </label>
          <select
            id="insumoId"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 bg-white min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            onChange={(e) => {
              const id = Number(e.target.value)
              setValue('insumoId', id || null)
              if (id) handleInsumoChange(id)
            }}
          >
            <option value="">-- Selecciona producto --</option>
            {insumos.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nombreProducto} (${i.precioUnitario.toLocaleString('es-CL')})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Subtotal */}
      <div className="flex flex-col gap-1">
        <label htmlFor="subtotal" className="text-sm font-medium text-gray-700">
          Subtotal Neto ($ CLP) <span aria-hidden="true" className="text-red-500">*</span>
        </label>
        <input
          id="subtotal"
          type="number"
          min="1"
          step="100"
          aria-required="true"
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 bg-white min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          {...register('subtotal', { valueAsNumber: true })}
        />
        {errors.subtotal && (
          <p role="alert" className="text-xs text-red-600">
            {errors.subtotal.message}
          </p>
        )}
      </div>

      {/* Desglose de Cálculo Tributario (IVA 19%) */}
      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Neto Gravado:</span>
          <span className="font-medium">${subtotalActual.toLocaleString('es-CL')}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>IVA (19%):</span>
          <span className="font-medium text-amber-700">+${ivaCalculado.toLocaleString('es-CL')}</span>
        </div>
        <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-200">
          <span>Total a Facturar:</span>
          <span className="text-blue-700">${totalCalculado.toLocaleString('es-CL')}</span>
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
          {isSubmitting ? 'Generando Comprobante...' : 'Emitir Factura'}
        </button>
      </div>
    </form>
  )
}

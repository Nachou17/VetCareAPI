// ======================================================
// src/schemas/recetaSchema.ts
// Validación Zod para emisión de recetas médicas veterinarias.
// ======================================================

import { z } from 'zod'
import { isPastDate } from '../utils/date'

export const recetaSchema = z
  .object({
    consultaId: z
      .number({ invalid_type_error: 'Selecciona una consulta médica' })
      .int()
      .positive('La consulta médica es obligatoria'),
    fechaEmision: z
      .string()
      .min(1, 'La fecha de emisión es obligatoria')
      .refine((v) => !isPastDate(v), 'La fecha de emisión no puede ser anterior a la fecha actual'),
    validaHasta: z
      .string()
      .min(1, 'La fecha de vigencia es obligatoria')
      .refine((v) => !isPastDate(v), 'La fecha de vigencia no puede ser anterior a la fecha actual'),
    // Campos del primer medicamento para agilizar la prescripción
    insumoId: z
      .number({ invalid_type_error: 'Selecciona un medicamento/insumo' })
      .int()
      .positive('El medicamento es obligatorio'),
    dosis: z
      .string()
      .trim()
      .min(2, 'La dosis e indicaciones son obligatorias (ej: 1 comp cada 12 hrs)')
      .max(100, 'Máximo 100 caracteres'),
    duracionDias: z
      .number({ invalid_type_error: 'Indica los días de tratamiento' })
      .int('Debe ser un número entero')
      .positive('Debe ser de al menos 1 día'),
  })
  .refine(
    (data) => {
      if (!data.fechaEmision || !data.validaHasta) return true
      return data.validaHasta >= data.fechaEmision
    },
    {
      message: 'La fecha de vigencia no puede ser anterior a la fecha de emisión',
      path: ['validaHasta'],
    },
  )

export type RecetaFormValues = z.infer<typeof recetaSchema>

// ======================================================
// src/schemas/insumoSchema.ts
// Validación Zod para productos e insumos médicos.
// ======================================================

import { z } from 'zod'

export const insumoSchema = z.object({
  nombreProducto: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede superar los 100 caracteres'),
  tipo: z
    .string()
    .trim()
    .min(2, 'El tipo de insumo es obligatorio')
    .max(50, 'El tipo no puede superar 50 caracteres'),
  stockActual: z
    .number({ invalid_type_error: 'El stock debe ser un número entero' })
    .int('El stock debe ser entero')
    .min(0, 'El stock no puede ser negativo'),
  precioUnitario: z
    .number({ invalid_type_error: 'El precio debe ser un número' })
    .positive('El precio unitario debe ser mayor a 0'),
})

export type InsumoFormValues = z.infer<typeof insumoSchema>

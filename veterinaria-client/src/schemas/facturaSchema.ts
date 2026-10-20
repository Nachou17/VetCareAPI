// ======================================================
// src/schemas/facturaSchema.ts
// Validación Zod para emisión de facturas y cobros.
// ======================================================

import { z } from 'zod'

export const facturaSchema = z.object({
  clienteId: z
    .number({ invalid_type_error: 'Selecciona un cliente' })
    .int()
    .positive('El cliente es obligatorio'),
  fechaEmision: z
    .string()
    .min(1, 'La fecha de emisión es obligatoria'),
  subtotal: z
    .number({ invalid_type_error: 'El subtotal debe ser un número' })
    .positive('El monto debe ser mayor a 0'),
  consultaId: z
    .number()
    .int()
    .nullable()
    .optional(),
  insumoId: z
    .number()
    .int()
    .nullable()
    .optional(),
})

export type FacturaFormValues = z.infer<typeof facturaSchema>

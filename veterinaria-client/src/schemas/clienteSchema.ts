// ======================================================
// src/schemas/clienteSchema.ts
// Reglas de validación Zod — espeja exactamente las
// DataAnnotations del DTO ClienteCreateDto en C#.
// ======================================================

import { z } from 'zod'

export const clienteSchema = z.object({
  documentoIdentidad: z
    .string()
    .trim()
    .min(1, 'El documento de identidad es obligatorio.')
    .max(20, 'El documento de identidad no puede superar los 20 caracteres.'),

  nombreCompleto: z
    .string()
    .trim()
    .min(3, 'El nombre completo debe tener al menos 3 caracteres.')
    .max(100, 'El nombre completo no puede superar los 100 caracteres.'),

  telefono: z
    .string()
    .trim()
    .min(1, 'El teléfono es obligatorio.')
    .refine((val) => {
      const digits = val.replace(/\D/g, '')
      return /^\+?[0-9\s-]+$/.test(val) && digits.length >= 8 && digits.length <= 15
    }, 'El teléfono debe tener un formato internacional válido (entre 8 y 15 dígitos numéricos).'),

  email: z
    .string()
    .trim()
    .min(1, 'El correo electrónico es obligatorio.')
    .email('El formato del correo electrónico no es válido.'),
})

export type ClienteFormValues = z.infer<typeof clienteSchema>

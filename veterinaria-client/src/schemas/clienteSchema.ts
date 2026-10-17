// ======================================================
// src/schemas/clienteSchema.ts
// Reglas de validación Zod — espeja exactamente las
// DataAnnotations del DTO ClienteCreateDto en C#.
// ======================================================

import { z } from 'zod'

export const clienteSchema = z.object({
  documentoIdentidad: z
    .string()
    .min(1, 'El documento de identidad es obligatorio.')
    .max(20, 'El documento de identidad no puede superar los 20 caracteres.'),

  nombreCompleto: z
    .string()
    .min(3, 'El nombre completo debe tener al menos 3 caracteres.')
    .max(100, 'El nombre completo no puede superar los 100 caracteres.'),

  telefono: z
    .string()
    .min(1, 'El teléfono es obligatorio.')
    .regex(
      /^\+?[\d\s\-().]{7,20}$/,
      'El teléfono debe contener solo dígitos, espacios, guiones o paréntesis (7–20 caracteres).',
    ),

  email: z
    .string()
    .min(1, 'El correo electrónico es obligatorio.')
    .email('El formato del correo electrónico no es válido.'),
})

export type ClienteFormValues = z.infer<typeof clienteSchema>

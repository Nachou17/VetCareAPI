// ======================================================
// src/schemas/clienteSchema.ts
// Reglas de validación Zod con validación estricta de RUT (Módulo 11),
// longitud máxima de correo y nombres no vacíos.
// ======================================================

import { z } from 'zod'
import { validarRutChileno } from '../utils/rut'

export const clienteSchema = z.object({
  documentoIdentidad: z
    .string()
    .trim()
    .min(1, 'El documento de identidad es obligatorio.')
    .max(20, 'El documento de identidad no puede superar los 20 caracteres.')
    .refine(
      (val) => validarRutChileno(val),
      'El RUT ingresado no es válido (ej: 12.345.678-5 o 12345678-K con Módulo 11).',
    ),

  nombreCompleto: z
    .string()
    .trim()
    .min(3, 'El nombre completo debe tener al menos 3 caracteres.')
    .max(80, 'El nombre completo no puede superar los 80 caracteres.')
    .refine(
      (val) => val.trim().length >= 3,
      'El nombre no puede consistir únicamente de espacios vacíos.',
    ),

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
    .max(100, 'El correo electrónico no puede superar los 100 caracteres.')
    .email('El formato del correo electrónico no es válido.'),
})

export type ClienteFormValues = z.infer<typeof clienteSchema>

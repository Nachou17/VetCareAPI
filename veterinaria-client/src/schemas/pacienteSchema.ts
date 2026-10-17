// ======================================================
// src/schemas/pacienteSchema.ts
// Reglas de validación Zod — espeja el DTO PacienteCreateDto
// y las restricciones del modelo Paciente en C#.
// ======================================================

import { z } from 'zod'

export const pacienteSchema = z.object({
  clienteId: z
    .number({ invalid_type_error: 'Debes seleccionar un cliente.' })
    .int('El ID del cliente debe ser un número entero.')
    .positive('Debes seleccionar un cliente válido.'),

  nombre: z
    .string()
    .min(2, 'El nombre del paciente debe tener al menos 2 caracteres.')
    .max(50, 'El nombre del paciente no puede superar los 50 caracteres.'),

  especie: z
    .string()
    .min(1, 'La especie es obligatoria.')
    .max(50, 'La especie no puede superar los 50 caracteres.'),

  raza: z
    .string()
    .max(50, 'La raza no puede superar los 50 caracteres.')
    .optional()
    .or(z.literal('')),

  peso: z
    .number({ invalid_type_error: 'El peso debe ser un número.' })
    .positive('El peso debe ser mayor a 0.')
    .optional(),

  alergias: z
    .string()
    .max(250, 'Las alergias no pueden superar los 250 caracteres.')
    .optional()
    .or(z.literal('')),
})

export type PacienteFormValues = z.infer<typeof pacienteSchema>
